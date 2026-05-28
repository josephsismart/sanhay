import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET() {
  try {
    const { schema } = await getActiveSySchema();

    const learnersResult = await prisma.$queryRawUnsafe<[{count: bigint}]>(
      `SELECT count(1) as count FROM ${schema}.bs_tbl_learner_enrollment WHERE status_id = 5`
    );
    const learners = Number(learnersResult[0]?.count || 0);

    const teachingResult = await prisma.$queryRawUnsafe<[{count: bigint}]>(
      `SELECT count(1) as count FROM profile.tbl_schoolpersonnel WHERE employee_type_id = 4 AND is_active = 1`
    );
    const teachingPersonnel = Number(teachingResult[0]?.count || 0);

    const nonTeachingResult = await prisma.$queryRawUnsafe<[{count: bigint}]>(
      `SELECT count(1) as count FROM profile.tbl_schoolpersonnel WHERE employee_type_id = 5 AND is_active = 1`
    );
    const nonTeachingPersonnel = Number(nonTeachingResult[0]?.count || 0);

    const usersResult = await prisma.$queryRawUnsafe<[{count: bigint}]>(
      `SELECT count(1) as count FROM account.tbl_useraccount WHERE is_active = true`
    );
    const totalUsers = Number(usersResult[0]?.count || 0);

    const deptsResult = await prisma.$queryRawUnsafe<[{count: bigint}]>(
      `SELECT count(1) as count FROM profile.tbl_school_department`
    );
    const departments = Number(deptsResult[0]?.count || 0);

    const sectionsResult = await prisma.$queryRawUnsafe<[{count: bigint}]>(
      `SELECT count(1) as count FROM building_sectioning.tbl_room_section WHERE is_active = true`
    );
    const sections = Number(sectionsResult[0]?.count || 0);

    const scansResult = await prisma.$queryRawUnsafe<[{count: bigint}]>(
      `SELECT count(1) as count FROM logs.tbl_scan_logs1 WHERE date::date = CURRENT_DATE`
    ).catch(() => [{ count: BigInt(0) }]);
    const todayScans = Number((scansResult as any)[0]?.count || 0);

    const roleDistribution = await prisma.$queryRawUnsafe<Array<{role: string, count: bigint}>>(
      `SELECT r.description as role, count(u.id) as count
       FROM account.tbl_useraccount u
       JOIN account.tbl_role r ON u.role_id = r.id
       WHERE u.is_active = true
       GROUP BY r.description, r.order_by
       ORDER BY r.order_by`
    );

    return NextResponse.json({
      learners,
      teachingPersonnel,
      nonTeachingPersonnel,
      totalUsers,
      departments,
      sections,
      todayScans,
      roleDistribution: roleDistribution.map(r => ({
        role: r.role,
        count: Number(r.count),
      })),
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
