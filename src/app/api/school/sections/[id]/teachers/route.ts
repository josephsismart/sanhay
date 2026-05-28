import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 7) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        rssa.id          AS rssa_id,
        rssa.advisory,
        p_subj.description  AS subject,
        bi.first_name,
        bi.middle_name,
        bi.last_name,
        bi.suffix,
        bi.img_path,
        bi.id            AS basic_info_id,
        sp.id            AS sp_id
      FROM building_sectioning.tbl_room_section_subject_assignment rssa
      LEFT JOIN global.tbl_party p_subj ON p_subj.id = rssa.subject_id
      JOIN profile.tbl_schoolpersonnel sp ON sp.id = rssa.schl_personnel_id
      JOIN profile.tbl_basicinfo bi ON bi.id = sp.basic_info_id
      WHERE rssa.room_section_id = $1
      ORDER BY p_subj.description
    `, Number(id));

    const data = rows.map((r) => ({
      rssaId: Number(r.rssa_id),
      advisory: r.advisory,
      subject: r.subject || "—",
      firstName: r.first_name,
      middleName: r.middle_name,
      lastName: r.last_name,
      suffix: r.suffix,
      imgPath: r.img_path,
      basicInfoId: Number(r.basic_info_id),
      spId: Number(r.sp_id),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Section teachers error:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}
