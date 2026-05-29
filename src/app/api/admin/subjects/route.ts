import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// SUBJECT party_type_id (from legacy: global.tbl_partytype where description='SUBJECT')
const SUBJECT_PARTY_TYPE_ID = 17;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const status = searchParams.get("status") || "all"; // all | active | inactive
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;
  const like = "%" + search.replace(/[%_]/g, (m) => "\\" + m) + "%";

  const searchFilter = search
    ? `AND (p.description ILIKE $1 OR p.abbr ILIKE $1)`
    : "";
  const statusFilter =
    status === "active"
      ? "AND p.is_active = true"
      : status === "inactive"
      ? "AND p.is_active = false"
      : "";

  try {
    const baseParams: any[] = search ? [like] : [];
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
         p.id, p.description, p.abbr, p.is_active, p.parent_party_id, p.order_by, p.group_by,
         parent.description AS parent_description,
         COALESCE(usage.gl_count, 0)::int AS grade_links_count
       FROM global.tbl_party p
       LEFT JOIN global.tbl_party parent ON parent.id = p.parent_party_id
       LEFT JOIN (
         SELECT subject_id, COUNT(*) AS gl_count
         FROM building_sectioning.tbl_gradelvl_subject
         GROUP BY subject_id
       ) usage ON usage.subject_id = p.id
       WHERE p.party_type_id = ${SUBJECT_PARTY_TYPE_ID}
         ${searchFilter}
         ${statusFilter}
       ORDER BY p.description ASC
       LIMIT ${limit} OFFSET ${offset}`,
      ...baseParams
    );

    const countRows = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) AS count
       FROM global.tbl_party p
       WHERE p.party_type_id = ${SUBJECT_PARTY_TYPE_ID}
         ${searchFilter}
         ${statusFilter}`,
      ...baseParams
    );

    const data = rows.map((r) => ({
      id: Number(r.id),
      description: r.description,
      abbr: r.abbr,
      isActive: r.is_active,
      parentPartyId: r.parent_party_id ? Number(r.parent_party_id) : null,
      parentDescription: r.parent_description,
      orderBy: r.order_by,
      groupBy: r.group_by,
      gradeLinksCount: r.grade_links_count,
    }));

    return NextResponse.json({
      data,
      total: Number(countRows[0]?.count ?? 0),
      page,
      limit,
    });
  } catch (err) {
    console.error("[subjects GET]", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 2) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const description = (body.description ?? "").toString().trim();
    const abbr = (body.abbr ?? "").toString().trim();
    const parentPartyId = body.parentPartyId ? Number(body.parentPartyId) : null;
    const orderBy = body.orderBy != null ? Number(body.orderBy) : 1;

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    // Check duplicate (same description, same party type)
    const dup = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM global.tbl_party
       WHERE party_type_id = ${SUBJECT_PARTY_TYPE_ID}
         AND LOWER(description) = LOWER($1)
       LIMIT 1`,
      description
    );
    if (dup.length) {
      return NextResponse.json({ error: "A subject with this name already exists" }, { status: 409 });
    }

    const inserted = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO global.tbl_party
         (party_type_id, description, abbr, is_active, order_by, group_by, parent_party_id)
       VALUES (${SUBJECT_PARTY_TYPE_ID}, $1, $2, true, $3, 11, $4)
       RETURNING id`,
      description,
      abbr || null,
      orderBy,
      parentPartyId
    );

    return NextResponse.json({ success: true, id: Number(inserted[0].id) }, { status: 201 });
  } catch (err) {
    console.error("[subjects POST]", err);
    return NextResponse.json({ error: "Failed to create subject", detail: String(err) }, { status: 500 });
  }
}
