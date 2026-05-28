import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 7) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const { schema } = await getActiveSySchema();
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        l.id            AS learner_id,
        l.lrn,
        l.four_ps,
        bi.first_name,
        bi.middle_name,
        bi.last_name,
        bi.suffix,
        bi.birthdate,
        bi.sex,
        bi.img_path,
        e.id            AS enrollment_id,
        e.enrollment_date,
        e.status_id,
        st.description  AS status
      FROM ${schema}.bs_tbl_learner_enrollment e
      JOIN profile.tbl_learners   l  ON l.id  = e.learner_id
      JOIN profile.tbl_basicinfo  bi ON bi.id = l.basic_info_id
      LEFT JOIN global.tbl_status st ON st.id = e.status_id
      WHERE e.room_section_id = $1
      ORDER BY bi.last_name, bi.first_name
    `, Number(id));

    const data = rows.map((r) => ({
      ...r,
      learner_id: Number(r.learner_id),
      enrollment_id: Number(r.enrollment_id),
      status_id: r.status_id ? Number(r.status_id) : null,
    }));

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("Enrollees error:", error);
    return NextResponse.json({ error: "Failed to fetch enrollees" }, { status: 500 });
  }
}
