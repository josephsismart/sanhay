import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

/**
 * GET /api/admin/users
 *   Lists personnel and their user account (if any).
 *
 *   Query params:
 *     search        — match name/username/employee_id
 *     accountStatus — "all" | "with" | "without" | "active" | "inactive"
 *     roleId        — filter by role (1, 6, 7, etc.)
 *     page, limit
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const accountStatus = searchParams.get("accountStatus") || "all";
  const roleId = searchParams.get("roleId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const like = "%" + search.replace(/[%_]/g, (m) => "\\" + m) + "%";

  const filters: string[] = ["sp.is_active = 1"];
  if (search) {
    filters.push(`(
      bi.first_name ILIKE $1
      OR bi.last_name ILIKE $1
      OR sp.employee_id ILIKE $1
      OR ua.username ILIKE $1
    )`);
  }
  if (accountStatus === "with") filters.push("ua.id IS NOT NULL");
  if (accountStatus === "without") filters.push("ua.id IS NULL");
  if (accountStatus === "active") filters.push("ua.is_active = true");
  if (accountStatus === "inactive") filters.push("ua.is_active = false");
  if (roleId) filters.push(`ua.role_id = ${Number(roleId)}`);

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const baseParams: any[] = search ? [like] : [];

  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        sp.id AS personnel_id, sp.employee_id,
        sp.basic_info_id,
        bi.first_name, bi.middle_name, bi.last_name, bi.suffix, bi.img_path,
        sd.department_name,
        ua.id AS user_id, ua.username, ua.role_id, ua.is_active AS account_active,
        ua.change_pwd, ua.date_added, ua.date_updated,
        pt.description AS personal_title,
        st.description AS employment_status
      FROM profile.tbl_schoolpersonnel sp
      JOIN profile.tbl_basicinfo bi ON bi.id = sp.basic_info_id
      LEFT JOIN account.tbl_useraccount ua ON ua.basic_info_id = sp.basic_info_id
      LEFT JOIN profile.tbl_school_department sd ON sd.id = sp.school_department_id
      LEFT JOIN global.tbl_party pt ON pt.id = sp.personal_title_id
      LEFT JOIN global.tbl_status st ON st.id = sp.status_id
      ${whereClause}
      ORDER BY (ua.id IS NULL) DESC, bi.last_name, bi.first_name
      LIMIT ${limit} OFFSET ${offset}`,
      ...baseParams
    );

    const countRows = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) AS count
       FROM profile.tbl_schoolpersonnel sp
       JOIN profile.tbl_basicinfo bi ON bi.id = sp.basic_info_id
       LEFT JOIN account.tbl_useraccount ua ON ua.basic_info_id = sp.basic_info_id
       ${whereClause}`,
      ...baseParams
    );

    const data = rows.map((r) => ({
      personnelId: Number(r.personnel_id),
      basicInfoId: Number(r.basic_info_id),
      employeeId: r.employee_id,
      firstName: r.first_name,
      middleName: r.middle_name,
      lastName: r.last_name,
      suffix: r.suffix,
      imgPath: r.img_path,
      department: r.department_name,
      personalTitle: r.personal_title,
      employmentStatus: r.employment_status,
      userId: r.user_id ? Number(r.user_id) : null,
      username: r.username,
      roleId: r.role_id ? Number(r.role_id) : null,
      accountActive: r.account_active,
      requirePasswordChange: r.change_pwd,
      accountCreatedAt: r.date_added,
      accountUpdatedAt: r.date_updated,
    }));

    // High-level stats (separate query so they don't depend on filters)
    const stats = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        COUNT(DISTINCT sp.id)::int AS total_personnel,
        COUNT(DISTINCT sp.id) FILTER (WHERE ua.id IS NOT NULL)::int AS with_account,
        COUNT(DISTINCT sp.id) FILTER (WHERE ua.id IS NULL)::int AS without_account,
        COUNT(DISTINCT sp.id) FILTER (WHERE ua.is_active = true)::int AS active_accounts,
        COUNT(DISTINCT sp.id) FILTER (WHERE ua.is_active = false)::int AS inactive_accounts
      FROM profile.tbl_schoolpersonnel sp
      LEFT JOIN account.tbl_useraccount ua ON ua.basic_info_id = sp.basic_info_id
      WHERE sp.is_active = 1
    `);

    return NextResponse.json({
      data,
      total: Number(countRows[0]?.count ?? 0),
      page,
      limit,
      stats: stats[0] || {},
    });
  } catch (err) {
    console.error("[users GET]", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 *   Create user account for a personnel (basic_info_id).
 *   body: { basicInfoId, username, password, roleId }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 2) {
    return NextResponse.json({ error: "Forbidden — only Super Admin can create accounts" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const basicInfoId = Number(body.basicInfoId);
    const username = (body.username || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();
    const roleId = Number(body.roleId);
    const sessionUserId = Number((session.user as any).id) || null;

    if (!basicInfoId || !username || !password || !roleId) {
      return NextResponse.json({ error: "basicInfoId, username, password, roleId are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!/^[a-z0-9._@-]+$/i.test(username)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, dots, underscores, hyphens, and @" }, { status: 400 });
    }

    // Make sure personnel exists
    const personnel = await prisma.$queryRawUnsafe<any[]>(
      `SELECT sp.id FROM profile.tbl_schoolpersonnel sp WHERE sp.basic_info_id = $1 LIMIT 1`,
      basicInfoId
    );
    if (!personnel.length) {
      return NextResponse.json({ error: "Personnel not found" }, { status: 404 });
    }

    // Ensure personnel doesn't already have an account
    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM account.tbl_useraccount WHERE basic_info_id = $1 LIMIT 1`,
      basicInfoId
    );
    if (existing.length) {
      return NextResponse.json({ error: "This personnel already has a user account" }, { status: 409 });
    }

    // Ensure username is unique
    const dup = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM account.tbl_useraccount WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      username
    );
    if (dup.length) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    const passwordHash = md5(password);

    const inserted = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO account.tbl_useraccount
        (basic_info_id, role_id, username, password, change_pwd, is_active, added_by, date_added)
       VALUES ($1, $2, $3, $4, true, true, $5, NOW())
       RETURNING id`,
      basicInfoId,
      roleId,
      username,
      passwordHash,
      sessionUserId
    );

    return NextResponse.json({ success: true, userId: Number(inserted[0].id) }, { status: 201 });
  } catch (err) {
    console.error("[users POST]", err);
    return NextResponse.json({ error: "Failed to create account", detail: String(err) }, { status: 500 });
  }
}
