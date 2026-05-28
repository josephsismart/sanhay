import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rssaId = searchParams.get("rssaId");

  if (!rssaId) {
    return NextResponse.json([]);
  }

  try {
    const { schema } = await getActiveSySchema();

    const learners = await prisma.$queryRawUnsafe<Array<{
      lrn: string;
      name: string;
      sex: boolean;
      birthdate: Date | null;
      status: string;
    }>>(
      `SELECT
        l.lrn,
        CONCAT(bi.last_name, ', ', bi.first_name, ' ', COALESCE(bi.middle_name, '')) AS name,
        bi.sex,
        bi.birthdate,
        s.description AS status
      FROM ${schema}.bs_tbl_learner_enrollment le
      JOIN profile.tbl_learners l ON le.learner_id = l.id
      JOIN profile.tbl_basicinfo bi ON l.basic_info_id = bi.id
      JOIN global.tbl_status s ON le.status_id = s.id
      JOIN building_sectioning.tbl_room_section rs ON le.room_section_id = rs.id
      JOIN building_sectioning.tbl_room_section_subject_assignment rssa ON rssa.room_section_id = rs.id
      WHERE rssa.id = $1
        AND le.status_id = 5
      ORDER BY bi.sex DESC, bi.last_name, bi.first_name`,
      Number(rssaId)
    );

    const result = learners.map(l => ({
      lrn: l.lrn,
      name: l.name.trim(),
      sex: l.sex,
      birthdate: l.birthdate ? new Date(l.birthdate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : null,
      status: l.status,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Learners API error:", error);
    return NextResponse.json([]);
  }
}
