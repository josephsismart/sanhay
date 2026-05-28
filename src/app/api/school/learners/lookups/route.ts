import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [gradeLevels, sections, enrollStatuses, syRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT id, description, order_by FROM global.tbl_party WHERE party_type_id = 1 ORDER BY order_by`
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT rs.id, rs.sctn_nm, gp.description as grade_level, gp.order_by as grade_order, rs.schl_yr_id
         FROM building_sectioning.tbl_room_section rs
         JOIN global.tbl_party gp ON gp.id = rs.grd_lvl_id
         WHERE rs.is_active = true
         ORDER BY gp.order_by, rs.sctn_nm`
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT id, description FROM global.tbl_status WHERE status_type_id = 2 ORDER BY id`
      ),
      prisma.$queryRawUnsafe<[{ id: bigint; description: string }]>(
        `SELECT id, description FROM global.tbl_sy WHERE is_active = true LIMIT 1`
      ),
    ]);

    return NextResponse.json({
      gradeLevels: gradeLevels.map((r) => ({ ...r, id: Number(r.id) })),
      sections: sections.map((r) => ({ ...r, id: Number(r.id), schl_yr_id: Number(r.schl_yr_id) })),
      enrollStatuses: enrollStatuses.map((r) => ({ ...r, id: Number(r.id) })),
      activeSy: syRows[0] ? { ...syRows[0], id: Number(syRows[0].id) } : null,
    });
  } catch (error) {
    console.error("Learner lookups error:", error);
    return NextResponse.json({ error: "Failed to fetch lookups" }, { status: 500 });
  }
}
