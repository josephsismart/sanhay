import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const gradeId = searchParams.get("gradeId") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  const like = "%" + search + "%";

  try {
    const { schema, syId } = await getActiveSySchema();

    let gradeFilter = gradeId ? `AND rs.grd_lvl_id = ${Number(gradeId)}` : "";
    let searchFilter = search
      ? `AND (bi.first_name ILIKE '${like.replace(/'/g, "''")}' OR bi.last_name ILIKE '${like.replace(/'/g, "''")}' OR l.lrn ILIKE '${like.replace(/'/g, "''")}' OR bi.middle_name ILIKE '${like.replace(/'/g, "''")}')`
      : "";

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        l.id, l.lrn, l.four_ps, l.guardian, l.relation, l.contact_num,
        l.ffirst_name, l.fmiddle_name, l.flast_name,
        l.mfirst_name, l.mmiddle_name, l.mlast_name,
        bi.id AS basic_info_id, bi.first_name, bi.middle_name, bi.last_name,
        bi.suffix, bi.birthdate, bi.sex, bi.img_path,
        e.id AS enrollment_id, e.status_id AS enroll_status_id,
        st.description AS enroll_status,
        rs.id AS section_id, rs.sctn_nm AS section_name,
        gp.description AS grade_level, gp.id AS grade_level_id, gp.order_by AS grade_order
      FROM profile.tbl_learners l
      JOIN profile.tbl_basicinfo bi ON bi.id = l.basic_info_id
      LEFT JOIN ${schema}.bs_tbl_learner_enrollment e ON e.learner_id = l.id
      LEFT JOIN building_sectioning.tbl_room_section rs ON rs.id = e.room_section_id
        AND rs.schl_yr_id = ${syId}
      LEFT JOIN global.tbl_party gp ON gp.id = rs.grd_lvl_id
      LEFT JOIN global.tbl_status st ON st.id = e.status_id
      WHERE 1=1
        ${searchFilter}
        ${gradeFilter}
      ORDER BY bi.last_name, bi.first_name
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countRows = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(*) AS count
      FROM profile.tbl_learners l
      JOIN profile.tbl_basicinfo bi ON bi.id = l.basic_info_id
      LEFT JOIN ${schema}.bs_tbl_learner_enrollment e ON e.learner_id = l.id
      LEFT JOIN building_sectioning.tbl_room_section rs ON rs.id = e.room_section_id
        AND rs.schl_yr_id = ${syId}
      WHERE 1=1
        ${searchFilter}
        ${gradeFilter}
    `);

    const data = rows.map((r) => ({
      ...r,
      id: Number(r.id),
      basic_info_id: Number(r.basic_info_id),
      enrollment_id: r.enrollment_id ? Number(r.enrollment_id) : null,
      section_id: r.section_id ? Number(r.section_id) : null,
      grade_level_id: r.grade_level_id ? Number(r.grade_level_id) : null,
      enroll_status_id: r.enroll_status_id ? Number(r.enroll_status_id) : null,
    }));

    return NextResponse.json({
      data,
      total: Number(countRows[0].count),
      page,
      limit,
      syId,
    });
  } catch (error) {
    console.error("Learners list error:", error);
    return NextResponse.json({ error: "Failed to fetch learners" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      firstName, middleName, lastName, suffix, birthdate, sex,
      lrn, fourPs, guardian, relation, contactNum,
      fFirstName, fMiddleName, fLastName,
      mFirstName, mMiddleName, mLastName,
      sectionId,
    } = body;

    if (!firstName || !lastName || !lrn) {
      return NextResponse.json({ error: "First name, last name, and LRN are required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const basicInfo = await tx.basicInfo.create({
        data: {
          firstName: firstName.trim().toUpperCase(),
          middleName: middleName ? middleName.trim().toUpperCase() : null,
          lastName: lastName.trim().toUpperCase(),
          suffix: suffix || null,
          birthdate: birthdate ? new Date(birthdate) : null,
          sex: sex === true || sex === "true",
        },
      });

      const newUuid = crypto.randomUUID();
      await tx.$executeRawUnsafe(
        `INSERT INTO profile.tbl_learners
          (basic_info_id, lrn, four_ps, guardian, relation, contact_num,
           ffirst_name, fmiddle_name, flast_name,
           mfirst_name, mmiddle_name, mlast_name, uuid)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        Number(basicInfo.id),
        lrn.trim(),
        fourPs ? true : false,
        guardian || null,
        relation || null,
        contactNum || null,
        fFirstName ? fFirstName.trim().toUpperCase() : null,
        fMiddleName ? fMiddleName.trim().toUpperCase() : null,
        fLastName ? fLastName.trim().toUpperCase() : null,
        mFirstName ? mFirstName.trim().toUpperCase() : null,
        mMiddleName ? mMiddleName.trim().toUpperCase() : null,
        mLastName ? mLastName.trim().toUpperCase() : null,
        newUuid
      );

      // Get the new learner id
      const learnerRows = await tx.$queryRawUnsafe<[{ id: bigint }]>(
        `SELECT id FROM profile.tbl_learners WHERE uuid = $1`, newUuid
      );
      const learnerId = Number(learnerRows[0].id);

      // Enroll in section if provided
      if (sectionId) {
        const { schema: sySchema } = await getActiveSySchema();
        await tx.$executeRawUnsafe(
          `INSERT INTO ${sySchema}.bs_tbl_learner_enrollment
            (learner_id, room_section_id, status_id, enrollment_date, added_by, date_added)
           VALUES ($1, $2, 5, CURRENT_DATE, $3, NOW())`,
          learnerId, Number(sectionId), Number(session.user.id)
        );
      }

      return { learnerId };
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    console.error("Create learner error:", error);
    if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "LRN already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create learner" }, { status: 500 });
  }
}
