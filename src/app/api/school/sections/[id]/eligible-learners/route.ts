import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

/**
 * GET /api/school/sections/[id]/eligible-learners
 * Returns learners NOT currently enrolled (status_id=5) in the active SY.
 *
 * Query: search (name/LRN), limit (default 50), page
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const sectionId = Number(idParam);
  if (!sectionId) return NextResponse.json({ error: "Invalid section id" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;
  const like = "%" + search.replace(/[%_]/g, (m) => "\\" + m) + "%";

  try {
    const { schema } = await getActiveSySchema();

    const filters: string[] = [
      `NOT EXISTS (
        SELECT 1 FROM ${schema}.bs_tbl_learner_enrollment ee
        WHERE ee.learner_id = l.id AND ee.status_id = 5
      )`,
    ];
    if (search) {
      filters.push(`(
        bi.first_name ILIKE $1
        OR bi.last_name ILIKE $1
        OR bi.middle_name ILIKE $1
        OR l.lrn ILIKE $1
      )`);
    }
    const whereClause = `WHERE ${filters.join(" AND ")}`;
    const baseParams: any[] = search ? [like] : [];

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
         l.id AS learner_id, l.lrn,
         bi.first_name, bi.middle_name, bi.last_name, bi.suffix,
         bi.birthdate, bi.sex, bi.img_path
       FROM ${schema}.bs_tbl_learner l
       JOIN profile.tbl_basicinfo bi ON bi.id = l.basic_info_id
       ${whereClause}
       ORDER BY bi.last_name, bi.first_name
       LIMIT ${limit} OFFSET ${offset}`,
      ...baseParams
    );

    const countRows = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) AS count
       FROM ${schema}.bs_tbl_learner l
       JOIN profile.tbl_basicinfo bi ON bi.id = l.basic_info_id
       ${whereClause}`,
      ...baseParams
    );

    return NextResponse.json({
      data: rows.map((r) => ({
        learnerId: Number(r.learner_id),
        lrn: r.lrn,
        firstName: r.first_name,
        middleName: r.middle_name,
        lastName: r.last_name,
        suffix: r.suffix,
        birthdate: r.birthdate,
        sex: r.sex,
        imgPath: r.img_path,
      })),
      total: Number(countRows[0]?.count ?? 0),
      page,
      limit,
    });
  } catch (err) {
    console.error("[eligible-learners]", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
