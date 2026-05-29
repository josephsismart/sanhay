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
    const { schema } = await getActiveSySchema();

    const sectionFilter = sectionId ? `AND e.room_section_id = ${Number(sectionId)}` : "";
    const gradeFilter = gradeId ? `AND e.grd_lvl_id = ${Number(gradeId)}` : "";
    const searchFilter = search
      ? `AND (e.first_name ILIKE '${like}' OR e.last_name ILIKE '${like}' OR e.lrn ILIKE '${like}' OR e.middle_name ILIKE '${like}')`
      : "";

    // Use sy?.bs_view_enrollment materialized view — has EVERYTHING pre-joined:
    // full_name, address_details, barangay_name, citymun_name, other_details (jsonb with guardian/contact)
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        e.learner_id AS id,
        e.lrn,
        e.person_id AS basic_info_id,
        e.first_name, e.middle_name, e.last_name, e.suffix,
        e.birthdate, e.sex_bool AS sex, e.img_path,
        e.full_name, e.last_fullname, e.address_details,
        e.barangay_name, e.citymun_name,
        e.room_section_id AS section_id,
        e.sctn_nm AS section_name,
        e.grade AS grade_level,
        e.grd_lvl_id AS grade_level_id,
        gpt.description AS grade_level_k,
        strand_p.description AS strand_name,
        rs.program AS program_text,
        e.enrollment_id, e.status_id AS enroll_status_id,
        e.other_details,
        CONCAT(adv_bi.last_name, ', ', adv_bi.first_name) AS advisory_teacher
      FROM ${schema}.bs_view_enrollment e
      LEFT JOIN building_sectioning.tbl_room_section rs ON rs.id = e.room_section_id
      LEFT JOIN global.tbl_party gp ON gp.id = e.grd_lvl_id
      LEFT JOIN global.tbl_partytype gpt ON gpt.id = gp.party_type_id
      LEFT JOIN global.tbl_party strand_p ON strand_p.id = rs.program_strand_id
      LEFT JOIN building_sectioning.tbl_room_section_subject_assignment adv_rssa
             ON adv_rssa.room_section_id = e.room_section_id AND adv_rssa.advisory = true
      LEFT JOIN profile.tbl_schoolpersonnel adv_sp ON adv_sp.id = adv_rssa.schl_personnel_id
      LEFT JOIN profile.tbl_basicinfo adv_bi ON adv_bi.id = adv_sp.basic_info_id
      WHERE e.status_id = 5
        ${sectionFilter}
        ${gradeFilter}
        ${searchFilter}
      ORDER BY e.last_name, e.first_name
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countRows = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(*) AS count
      FROM ${schema}.bs_view_enrollment e
      WHERE e.status_id = 5
        ${sectionFilter}
        ${gradeFilter}
        ${searchFilter}
    `);

    const data = rows.map((r) => {
      // Extract guardian + contact from other_details jsonb
      const od = r.other_details || {};
      const guardianName = od.guardian || od.mother || od.father || null;
      const contactNum = od.contact_number || null;

      return {
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
        fullName: r.full_name,
        lastFullname: r.last_fullname,
        addressDetails: r.address_details,
        barangayName: r.barangay_name,
        cityMunName: r.citymun_name,
        sectionId: r.section_id ? Number(r.section_id) : null,
        sectionName: r.section_name,
        gradeLevel: r.grade_level,
        gradeLevelId: r.grade_level_id ? Number(r.grade_level_id) : null,
        gradeLevelK: r.grade_level_k ?? null,
        enrollmentId: r.enrollment_id ? Number(r.enrollment_id) : null,
        enrollStatusId: r.enroll_status_id ? Number(r.enroll_status_id) : null,
        advisoryTeacher: r.advisory_teacher,
        strand: r.strand_name ?? r.program_text ?? null,
        guardian: guardianName,
        contactNum: contactNum,
      };
    });

    console.log(`[id-card] schema=${schema} sectionId=${sectionId} rows=${rows.length} count=${countRows[0]?.count}`);
    return NextResponse.json({
      data,
      total: Number(countRows[0]?.count ?? 0),
      page,
      limit,
    });
  } catch (err) {
    console.error("ID card API error:", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
