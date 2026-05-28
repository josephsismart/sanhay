import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/personnel/lookups — all dropdown data for the form
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [employeeTypes, personalTitles, employmentStatuses, departments] = await Promise.all([
      // Employee types (Teaching / Non-Teaching) — party_type_id = 2
      prisma.$queryRaw<{ id: bigint; description: string }[]>`
        SELECT id, description FROM global.tbl_party WHERE party_type_id = 2 ORDER BY id
      `,
      // Personal titles — party_type_id = 4
      prisma.$queryRaw<{ id: bigint; description: string }[]>`
        SELECT id, description FROM global.tbl_party WHERE party_type_id = 4 ORDER BY description
      `,
      // Employment statuses — status_type_id = 1
      prisma.$queryRaw<{ id: bigint; description: string }[]>`
        SELECT id, description FROM global.tbl_status WHERE status_type_id = 1 ORDER BY id
      `,
      // Departments
      prisma.$queryRaw<{ id: bigint; department_name: string; abbr: string | null }[]>`
        SELECT id, department_name, abbr FROM profile.tbl_school_department ORDER BY department_name
      `,
    ]);

    return NextResponse.json({
      employeeTypes: employeeTypes.map((r) => ({ ...r, id: Number(r.id) })),
      personalTitles: personalTitles.map((r) => ({ ...r, id: Number(r.id) })),
      employmentStatuses: employmentStatuses.map((r) => ({ ...r, id: Number(r.id) })),
      departments: departments.map((r) => ({ ...r, id: Number(r.id) })),
    });
  } catch (error) {
    console.error("Lookups error:", error);
    return NextResponse.json({ error: "Failed to fetch lookups" }, { status: 500 });
  }
}
