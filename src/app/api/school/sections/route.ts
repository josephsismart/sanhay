import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 7) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { schema } = await getActiveSySchema();
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        rs.id,
        rs.sctn_nm,
        rs.is_active,
        gp.description   AS grade_level,
        gp.order_by      AS grade_order,
        gp.id            AS grade_level_id,
        sy.description   AS sy_description,
        sched.description AS schedule,
        CONCAT(adv_bi.last_name, ', ', adv_bi.first_name) AS advisory_teacher,
        (
          SELECT COUNT(*)
          FROM ${schema}.bs_tbl_learner_enrollment e2
          WHERE e2.room_section_id = rs.id
        ) AS learner_count,
        (
          SELECT COUNT(*)
          FROM building_sectioning.tbl_room_section_subject_assignment rssa2
          WHERE rssa2.room_section_id = rs.id
        ) AS subject_count
      FROM building_sectioning.tbl_room_section rs
      JOIN  global.tbl_party gp   ON gp.id  = rs.grd_lvl_id
      JOIN  global.tbl_sy    sy   ON sy.id  = rs.schl_yr_id
      LEFT JOIN global.tbl_party sched ON sched.id = rs.schedule_id
      LEFT JOIN building_sectioning.tbl_room_section_subject_assignment adv_rssa
             ON adv_rssa.room_section_id = rs.id AND adv_rssa.advisory = true
      LEFT JOIN profile.tbl_schoolpersonnel adv_sp
             ON adv_sp.id = adv_rssa.schl_personnel_id
      LEFT JOIN profile.tbl_basicinfo adv_bi
             ON adv_bi.id = adv_sp.basic_info_id
      WHERE sy.is_active = true
      ORDER BY gp.order_by, rs.sctn_nm
    `);

    const data = rows.map((r) => ({
      ...r,
      id: Number(r.id),
      grade_order: Number(r.grade_order),
      grade_level_id: Number(r.grade_level_id),
      learner_count: Number(r.learner_count),
      subject_count: Number(r.subject_count),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Sections error:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

/**
 * POST /api/school/sections
 * Create a new section in the currently active school year.
 * Body: { sectionName, gradeLevelId, scheduleId?, roomId?, programStrandId?, program? }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Forbidden — admins only" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const sectionName = (body.sectionName ?? "").toString().trim();
    const gradeLevelId = Number(body.gradeLevelId);
    const scheduleId = body.scheduleId ? Number(body.scheduleId) : null;
    const roomId = body.roomId ? Number(body.roomId) : null;
    const programStrandId = body.programStrandId ? Number(body.programStrandId) : null;
    const program = body.program ? body.program.toString().trim() : null;

    if (!sectionName) return NextResponse.json({ error: "Section name is required" }, { status: 400 });
    if (!gradeLevelId) return NextResponse.json({ error: "Grade level is required" }, { status: 400 });

    const sy = await getActiveSySchema();
    const syId = sy.syId;

    // Duplicate check (same name + same grade + same SY)
    const dup = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM building_sectioning.tbl_room_section
       WHERE UPPER(sctn_nm) = UPPER($1)
         AND grd_lvl_id = $2
         AND schl_yr_id = $3
       LIMIT 1`,
      sectionName,
      gradeLevelId,
      syId
    );
    if (dup.length) {
      return NextResponse.json({ error: "A section with this name already exists for this grade and school year" }, { status: 409 });
    }

    // Pick the first room if none specified (DB requires room_id non-null? actually NULL not allowed based on sample)
    // Sample row shows room_id is bigint NOT NULL — fall back to room 1 if not supplied
    const finalRoomId = roomId ?? 1;

    const inserted = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO building_sectioning.tbl_room_section
        (room_id, grd_lvl_id, schl_yr_id, sctn_nm, schedule_id, is_active, program, program_strand_id)
       VALUES ($1, $2, $3, $4, $5, true, $6, $7)
       RETURNING id`,
      finalRoomId,
      gradeLevelId,
      syId,
      sectionName.toUpperCase(),
      scheduleId,
      program,
      programStrandId
    );

    return NextResponse.json({ success: true, id: Number(inserted[0].id) }, { status: 201 });
  } catch (err) {
    console.error("[sections POST]", err);
    return NextResponse.json({ error: "Failed to create section", detail: String(err) }, { status: 500 });
  }
}
