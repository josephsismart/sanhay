import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const gradeId = searchParams.get("gradeId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  const like = "%" + search.replace(/'/g, "''") + "%";

  try {
    const { schema, syId } = await getActiveSySchema();
    const gradeFilter = gradeId ? `AND rs.grd_lvl_id = ${Number(gradeId)}` : "";
    const searchFilter = search
      ? `AND (bi.first_name ILIKE '${like}' OR bi.last_name ILIKE '${like}' OR l.lrn ILIKE '${like}' OR bi.middle_name ILIKE '${like}')`
      : "";

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        l.id, l.lrn,
        bi.id AS basic_info_id,
        bi.first_name, bi.middle_name, bi.last_name, bi.suffix,
        bi.birthdate, bi.sex, bi.img_path,
        rs.sctn_nm AS section_name,
        gp.description AS grade_level, gp.id AS grade_level_id,
        e.id AS enrollment_id, e.status_id AS enroll_status_id
      FROM profile.tbl_learners l
      JOIN profile.tbl_basicinfo bi ON bi.id = l.basic_info_id
      LEFT JOIN ${schema}.bs_tbl_learner_enrollment e ON e.learner_id = l.id
      LEFT JOIN building_sectioning.tbl_room_section rs ON rs.id = e.room_section_id
        AND rs.schl_yr_id = ${syId}
      LEFT JOIN global.tbl_party gp ON gp.id = rs.grd_lvl_id
      WHERE e.status_id = 5
        ${searchFilter}
        ${gradeFilter}
      ORDER BY bi.last_name, bi.first_name
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countRows = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(*) AS count
      FROM profile.tbl_learners l
      JOIN profile.tbl_basicinfo bi ON bi.id = l.basic_info_id
      LEFT JOIN ${schema}.bs_tbl_learner_enrollment e ON e.learner_id = l.id
      LEFT JOIN building_sectioning.tbl_room_section rs ON rs.id = e.room_section_id
        AND rs.schl_yr_id = ${syId}
      WHERE e.status_id = 5
        ${searchFilter}
        ${gradeFilter}
    `);

    // Fetch grade levels for filter dropdown
    const grades = await prisma.$queryRawUnsafe<any[]>(`
      SELECT DISTINCT gp.id, gp.description, gp.order_by
      FROM ${schema}.bs_tbl_learner_enrollment e
      JOIN building_sectioning.tbl_room_section rs ON rs.id = e.room_section_id
        AND rs.schl_yr_id = ${syId}
      JOIN global.tbl_party gp ON gp.id = rs.grd_lvl_id
      WHERE e.status_id = 5
      ORDER BY gp.order_by
    `).catch(() => []);

    const data = rows.map((r) => ({
      id: Number(r.id),
      lrn: r.lrn,
      basicInfoId: Number(r.basic_info_id),
      firstName: r.first_name,
      middleName: r.middle_name,
      lastName: r.last_name,
      suffix: r.suffix,
      birthdate: r.birthdate,
      sex: r.sex,
      imgPath: r.img_path,
      sectionName: r.section_name,
      gradeLevel: r.grade_level,
      gradeLevelId: r.grade_level_id ? Number(r.grade_level_id) : null,
      enrollmentId: r.enrollment_id ? Number(r.enrollment_id) : null,
      enrollStatusId: r.enroll_status_id ? Number(r.enroll_status_id) : null,
    }));

    return NextResponse.json({
      data,
      total: Number(countRows[0]?.count ?? 0),
      page,
      limit,
      grades: grades.map((g) => ({ id: Number(g.id), label: g.description })),
    });
  } catch (err) {
    console.error("ID card API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
