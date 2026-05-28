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
  const sectionId = searchParams.get("sectionId") || "";
  const limit = parseInt(searchParams.get("limit") || "200");
  const page = parseInt(searchParams.get("page") || "1");
  const offset = (page - 1) * limit;
  const like = "%" + search.replace(/'/g, "''") + "%";

  try {
    const { schema, syId } = await getActiveSySchema();

    const gradeFilter = gradeId ? `AND rs.grd_lvl_id = ${Number(gradeId)}` : "";
    const sectionFilter = sectionId ? `AND e.room_section_id = ${Number(sectionId)}` : "";
    const searchFilter = search
      ? `AND (bi.first_name ILIKE '${like}' OR bi.last_name ILIKE '${like}' OR l.lrn ILIKE '${like}' OR bi.middle_name ILIKE '${like}')`
      : "";

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        l.id, l.lrn, l.guardian, l.relation,
        bi.id AS basic_info_id,
        bi.first_name, bi.middle_name, bi.last_name, bi.suffix,
        bi.birthdate, bi.sex, bi.img_path,
        rs.id AS section_id,
        rs.sctn_nm AS section_name,
        gp.description AS grade_level, gp.id AS grade_level_id,
        e.id AS enrollment_id, e.status_id AS enroll_status_id,
        CONCAT(adv_bi.last_name, ', ', adv_bi.first_name) AS advisory_teacher,
        strand_p.description AS strand
      FROM profile.tbl_learners l
      JOIN profile.tbl_basicinfo bi ON bi.id = l.basic_info_id
      JOIN ${schema}.bs_tbl_learner_enrollment e ON e.learner_id = l.id AND e.status_id = 5
      JOIN building_sectioning.tbl_room_section rs ON rs.id = e.room_section_id
      LEFT JOIN global.tbl_party gp ON gp.id = rs.grd_lvl_id
      LEFT JOIN building_sectioning.tbl_room_section_subject_assignment adv_rssa
             ON adv_rssa.room_section_id = rs.id AND adv_rssa.advisory = true
      LEFT JOIN profile.tbl_schoolpersonnel adv_sp ON adv_sp.id = adv_rssa.schl_personnel_id
      LEFT JOIN profile.tbl_basicinfo adv_bi ON adv_bi.id = adv_sp.basic_info_id
      LEFT JOIN global.tbl_party strand_p ON strand_p.id = rs.strand_id
      WHERE 1=1
        ${searchFilter}
        ${gradeFilter}
        ${sectionFilter}
      ORDER BY bi.last_name, bi.first_name
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countRows = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(*) AS count
      FROM profile.tbl_learners l
      JOIN profile.tbl_basicinfo bi ON bi.id = l.basic_info_id
      JOIN ${schema}.bs_tbl_learner_enrollment e ON e.learner_id = l.id AND e.status_id = 5
      JOIN building_sectioning.tbl_room_section rs ON rs.id = e.room_section_id
      WHERE 1=1
        ${searchFilter}
        ${gradeFilter}
        ${sectionFilter}
    `);

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
      sectionId: r.section_id ? Number(r.section_id) : null,
      sectionName: r.section_name,
      gradeLevel: r.grade_level,
      gradeLevelId: r.grade_level_id ? Number(r.grade_level_id) : null,
      enrollmentId: r.enrollment_id ? Number(r.enrollment_id) : null,
      enrollStatusId: r.enroll_status_id ? Number(r.enroll_status_id) : null,
      advisoryTeacher: r.advisory_teacher,
      strand: r.strand,
      guardian: r.guardian,
    }));

    return NextResponse.json({
      data,
      total: Number(countRows[0]?.count ?? 0),
      page,
      limit,
    });
  } catch (err) {
    console.error("ID card API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
