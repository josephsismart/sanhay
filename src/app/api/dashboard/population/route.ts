import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET() {
  try {
    const { schema } = await getActiveSySchema();

    const data = await prisma.$queryRawUnsafe<Array<{
      age_bracket: string; male_count: bigint; female_count: bigint;
    }>>(
      `SELECT
        age_bracket,
        SUM(CASE WHEN sex = True THEN 1 ELSE 0 END) * -1 AS male_count,
        SUM(CASE WHEN sex = False THEN 1 ELSE 0 END) AS female_count
      FROM (
        SELECT
          t1.sex_bool AS sex,
          CASE
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) <= 13 THEN '13-'
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) = 14 THEN '14'
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) = 15 THEN '15'
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) = 16 THEN '16'
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) = 17 THEN '17'
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) = 18 THEN '18'
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) = 19 THEN '19'
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) = 20 THEN '20'
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) = 21 THEN '21'
            WHEN EXTRACT(YEAR FROM age(t1.birthdate)) >= 22 THEN '22+'
          END AS age_bracket
        FROM ${schema}.bs_view_enrollment t1
        WHERE t1.status_id = 5
      ) AS subquery
      WHERE age_bracket IS NOT NULL
      GROUP BY age_bracket
      ORDER BY
        CASE
          WHEN age_bracket = '13-' THEN 1
          WHEN age_bracket = '14' THEN 2
          WHEN age_bracket = '15' THEN 3
          WHEN age_bracket = '16' THEN 4
          WHEN age_bracket = '17' THEN 5
          WHEN age_bracket = '18' THEN 6
          WHEN age_bracket = '19' THEN 7
          WHEN age_bracket = '20' THEN 8
          WHEN age_bracket = '21' THEN 9
          ELSE 10
        END`
    );

    const result = data.map(row => ({
      age: row.age_bracket,
      male: Math.abs(Number(row.male_count)),
      female: Number(row.female_count),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Population API error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
