import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET() {
  try {
    const { schema } = await getActiveSySchema();
    const data = await prisma.$queryRawUnsafe<Array<{
      city_mun: string; city_name: string; male: bigint; female: bigint; total: bigint;
    }>>(
      `SELECT
        t2.code::text AS city_mun,
        t2.description AS city_name,
        SUM(CASE WHEN t1.sex_bool = TRUE THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN t1.sex_bool = FALSE THEN 1 ELSE 0 END) AS female,
        COUNT(1) AS total
      FROM ${schema}.bs_view_enrollment t1
      JOIN address.tbl_citymun t2 ON t1.citymun_id = t2.id
      WHERE t1.status_id = 5
      GROUP BY t1.citymun_id, t2.code, t2.description
      ORDER BY total DESC`
    );
    const result = data.map(row => ({
      code: row.city_mun,
      name: row.city_name,
      male: Number(row.male),
      female: Number(row.female),
      total: Number(row.total),
    }));
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Map API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
