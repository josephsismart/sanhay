import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const basicInfoId = (session.user as any).basicInfoId;

  try {
    const { schema } = await getActiveSySchema();

    // Get teacher's assigned classes
    const classes = await prisma.$queryRawUnsafe<Array<{
      rssa_id: bigint;
      section_name: string;
      grade: string;
      subject: string;
      advisory: boolean;
      room: string;
      male: bigint;
      female: bigint;
      total: bigint;
    }>>(
      `SELECT
        rssa.id AS rssa_id,
        rs.sctn_nm AS section_name,
        gl.description AS grade,
        subj.description AS subject,
        rssa.advisory,
        r.description AS room,
        COALESCE(SUM(CASE WHEN bi.sex = TRUE THEN 1 ELSE 0 END), 0) AS male,
        COALESCE(SUM(CASE WHEN bi.sex = FALSE THEN 1 ELSE 0 END), 0) AS female,
        COALESCE(COUNT(le.id), 0) AS total
      FROM building_sectioning.tbl_room_section_subject_assignment rssa
      JOIN building_sectioning.tbl_room_section rs ON rssa.room_section_id = rs.id
      JOIN building_sectioning.tbl_room r ON rs.room_id = r.id
      JOIN global.tbl_party gl ON rs.grd_lvl_id = gl.id
      JOIN global.tbl_party subj ON rssa.subject_id = subj.id
      JOIN profile.tbl_schoolpersonnel sp ON rssa.schl_personnel_id = sp.id
      LEFT JOIN ${schema}.bs_tbl_learner_enrollment le ON le.room_section_id = rs.id AND le.status_id = 5
      LEFT JOIN profile.tbl_learners l ON le.learner_id = l.id
      LEFT JOIN profile.tbl_basicinfo bi ON l.basic_info_id = bi.id
      WHERE sp.basic_info_id = $1
        AND rs.is_active = true
      GROUP BY rssa.id, rs.sctn_nm, gl.description, subj.description, rssa.advisory, r.description, gl.order_by
      ORDER BY gl.order_by, rs.sctn_nm, subj.description`,
      Number(basicInfoId)
    );

    // Dashboard stats
    const totalClasses = classes.length;
    const advisoryClasses = classes.filter(c => c.advisory).length;
    const totalStudents = classes.reduce((sum, c) => sum + Number(c.total), 0);
    const uniqueSections = new Set(classes.map(c => c.section_name)).size;

    return NextResponse.json({
      classes: classes.map(c => ({
        rssaId: Number(c.rssa_id),
        sectionName: c.section_name,
        grade: c.grade,
        subject: c.subject,
        advisory: c.advisory,
        room: c.room,
        male: Number(c.male),
        female: Number(c.female),
        total: Number(c.total),
      })),
      stats: {
        totalClasses,
        advisoryClasses,
        totalStudents,
        uniqueSections,
      },
    });
  } catch (error: any) {
    console.error("Teacher API error:", error);
    return NextResponse.json({ classes: [], stats: { totalClasses: 0, advisoryClasses: 0, totalStudents: 0, uniqueSections: 0 } });
  }
}
