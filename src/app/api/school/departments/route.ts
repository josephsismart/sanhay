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
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        sd.id, sd.department_name, sd.abbr,
        CONCAT(bi.last_name, ', ', bi.first_name) AS dept_head,
        COUNT(DISTINCT sp.id) AS personnel_count
      FROM profile.tbl_school_department sd
      LEFT JOIN profile.tbl_basicinfo bi ON bi.id = sd.department_head_person_id
      LEFT JOIN profile.tbl_schoolpersonnel sp ON sp.school_department_id = sd.id AND sp.is_active = 1
      GROUP BY sd.id, sd.department_name, sd.abbr, bi.last_name, bi.first_name
      ORDER BY sd.department_name
    `);

    return NextResponse.json({
      data: rows.map((r) => ({ ...r, id: Number(r.id), personnel_count: Number(r.personnel_count) })),
    });
  } catch (error) {
    console.error("Departments error:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}
