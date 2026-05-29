import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/schedule/pickers
 * Returns lists of sections and teachers for the schedule picker UI.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sections = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        rs.id, rs.sctn_nm, rs.grd_lvl_id,
        gpt.description AS grade_label,
        COUNT(DISTINCT sb.id)::int AS block_count
      FROM building_sectioning.tbl_room_section rs
      LEFT JOIN global.tbl_party gp ON gp.id = rs.grd_lvl_id
      LEFT JOIN global.tbl_partytype gpt ON gpt.id = gp.party_type_id
      LEFT JOIN building_sectioning.tbl_room_section_subject_assignment rssa
            ON rssa.room_section_id = rs.id
      LEFT JOIN building_sectioning.tbl_rssa_schedule_blocks sb
            ON sb.tbl_rssa_id = rssa.id
      WHERE rs.is_active = true
      GROUP BY rs.id, rs.sctn_nm, rs.grd_lvl_id, gpt.description
      ORDER BY gpt.description NULLS LAST, rs.sctn_nm
    `);

    const teachers = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        sp.id, sp.employee_id,
        CONCAT(bi.last_name, ', ', bi.first_name) AS full_name,
        bi.first_name, bi.last_name,
        sd.department_name,
        COUNT(DISTINCT sb.id)::int AS block_count
      FROM profile.tbl_schoolpersonnel sp
      JOIN profile.tbl_basicinfo bi ON bi.id = sp.basic_info_id
      LEFT JOIN profile.tbl_school_department sd ON sd.id = sp.school_department_id
      LEFT JOIN building_sectioning.tbl_room_section_subject_assignment rssa
            ON rssa.schl_personnel_id = sp.id
      LEFT JOIN building_sectioning.tbl_rssa_schedule_blocks sb
            ON sb.tbl_rssa_id = rssa.id
      WHERE sp.is_active = 1
      GROUP BY sp.id, sp.employee_id, bi.first_name, bi.last_name, sd.department_name
      HAVING COUNT(DISTINCT sb.id) > 0
      ORDER BY bi.last_name, bi.first_name
    `);

    return NextResponse.json({
      sections: sections.map((s) => ({
        id: Number(s.id),
        name: s.sctn_nm,
        gradeLevelId: s.grd_lvl_id,
        gradeLabel: s.grade_label,
        blockCount: s.block_count,
      })),
      teachers: teachers.map((t) => ({
        id: Number(t.id),
        employeeId: t.employee_id,
        fullName: t.full_name,
        firstName: t.first_name,
        lastName: t.last_name,
        department: t.department_name,
        blockCount: t.block_count,
      })),
    });
  } catch (err) {
    console.error("[schedule pickers]", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
