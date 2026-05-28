import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET() {
  try {
    const { schema } = await getActiveSySchema();

    const gradeData = await prisma.$queryRawUnsafe<Array<{
      grade: string; male: bigint; female: bigint; total: bigint;
    }>>(
      `SELECT
        p.description AS grade,
        SUM(CASE WHEN t1.sex_bool = TRUE THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN t1.sex_bool = FALSE THEN 1 ELSE 0 END) AS female,
        COUNT(1) AS total
      FROM ${schema}.bs_view_enrollment t1
      JOIN global.tbl_party p ON t1.grd_lvl_id = p.id
      WHERE t1.status_id = 5
      GROUP BY p.description, p.order_by
      ORDER BY p.order_by`
    ).catch(() => []);

    const genderData = await prisma.$queryRawUnsafe<[{
      male: bigint; female: bigint; total: bigint;
    }]>(
      `SELECT
        SUM(CASE WHEN t1.sex_bool = TRUE THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN t1.sex_bool = FALSE THEN 1 ELSE 0 END) AS female,
        COUNT(1) AS total
      FROM ${schema}.bs_view_enrollment t1
      WHERE t1.status_id = 5`
    ).catch(() => [{ male: BigInt(0), female: BigInt(0), total: BigInt(0) }]);

    const sectionData = await prisma.$queryRawUnsafe<Array<{
      section: string; grade: string; count: bigint;
    }>>(
      `SELECT
        rs.sctn_nm AS section,
        p.description AS grade,
        COUNT(t1.id) AS count
      FROM ${schema}.bs_tbl_learner_enrollment t1
      JOIN building_sectioning.tbl_room_section rs ON t1.room_section_id = rs.id
      JOIN global.tbl_party p ON rs.grd_lvl_id = p.id
      WHERE t1.status_id = 5
      GROUP BY rs.sctn_nm, p.description, p.order_by
      ORDER BY p.order_by, count DESC
      LIMIT 20`
    ).catch(() => []);

    const statusData = await prisma.$queryRawUnsafe<Array<{
      status: string; count: bigint;
    }>>(
      `SELECT
        s.description AS status,
        COUNT(t1.id) AS count
      FROM ${schema}.bs_tbl_learner_enrollment t1
      JOIN global.tbl_status s ON t1.status_id = s.id
      GROUP BY s.description, s.order_by
      ORDER BY count DESC`
    ).catch(() => []);

    return NextResponse.json({
      byGrade: (gradeData as any[]).map((r: any) => ({
        grade: r.grade,
        male: Number(r.male),
        female: Number(r.female),
        total: Number(r.total),
      })),
      gender: {
        male: Number(genderData[0]?.male || 0),
        female: Number(genderData[0]?.female || 0),
        total: Number(genderData[0]?.total || 0),
      },
      bySection: (sectionData as any[]).map((r: any) => ({
        section: r.section,
        grade: r.grade,
        count: Number(r.count),
      })),
      byStatus: (statusData as any[]).map((r: any) => ({
        status: r.status,
        count: Number(r.count),
      })),
    });
  } catch (error: any) {
    console.error("Learners API error:", error);
    return NextResponse.json({
      byGrade: [], gender: { male: 0, female: 0, total: 0 }, bySection: [], byStatus: [],
    }, { status: 500 });
  }
}
