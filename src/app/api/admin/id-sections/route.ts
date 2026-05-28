import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { schema, syId } = await getActiveSySchema();
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        rs.id,
        rs.sctn_nm,
        gp.description AS grade_level,
        gp.id AS grade_level_id,
        gp.order_by AS grade_order,
        CONCAT(adv_bi.last_name, ', ', adv_bi.first_name) AS advisory_teacher,
        COUNT(e.id) AS learner_count
      FROM building_sectioning.tbl_room_section rs
      JOIN global.tbl_sy sy ON sy.id = rs.schl_yr_id AND sy.is_active = true
      JOIN global.tbl_party gp ON gp.id = rs.grd_lvl_id
      LEFT JOIN ${schema}.bs_tbl_learner_enrollment e
             ON e.room_section_id = rs.id AND e.status_id = 5
      LEFT JOIN building_sectioning.tbl_room_section_subject_assignment adv_rssa
             ON adv_rssa.room_section_id = rs.id AND adv_rssa.advisory = true
      LEFT JOIN profile.tbl_schoolpersonnel adv_sp ON adv_sp.id = adv_rssa.schl_personnel_id
      LEFT JOIN profile.tbl_basicinfo adv_bi ON adv_bi.id = adv_sp.basic_info_id
      GROUP BY rs.id, rs.sctn_nm, gp.description, gp.id, gp.order_by,
               adv_bi.last_name, adv_bi.first_name
      ORDER BY gp.order_by, rs.sctn_nm
    `);

    const data = rows.map(r => ({
      id: Number(r.id),
      sctn_nm: r.sctn_nm,
      grade_level: r.grade_level,
      grade_level_id: Number(r.grade_level_id),
      grade_order: Number(r.grade_order),
      advisory_teacher: r.advisory_teacher ?? null,
      learner_count: Number(r.learner_count),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("ID sections error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
