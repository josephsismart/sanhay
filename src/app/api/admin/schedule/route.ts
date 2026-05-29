import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/schedule
 *
 * Query params:
 *   - mode: "section" | "teacher" (default "section")
 *   - sectionId: number (when mode=section)
 *   - teacherId: number (when mode=teacher, schl_personnel_id)
 *
 * Returns:
 *   - meta: section or teacher details
 *   - blocks: { id, day, fromTime, toTime, fromOrder, toOrder, subject, teacher, sectionName, roomName, teaching, nonTeachingLabel }[]
 *   - timeSlots: aggregated unique time ranges (for grid rows)
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") || "section";
  const sectionId = searchParams.get("sectionId");
  const teacherId = searchParams.get("teacherId");

  try {
    let filterClause = "";
    let metaRows: any[] = [];

    if (mode === "section") {
      if (!sectionId) {
        return NextResponse.json({ error: "sectionId is required for section mode" }, { status: 400 });
      }
      const sid = Number(sectionId);
      filterClause = `WHERE rs.id = ${sid}`;

      metaRows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          rs.id, rs.sctn_nm, rs.grd_lvl_id,
          gpt.description AS grade_label,
          rm.description AS room_name,
          rm.room_number,
          CONCAT(adv_bi.first_name, ' ', adv_bi.last_name) AS adviser_name,
          rs.program,
          strand.description AS strand_name
        FROM building_sectioning.tbl_room_section rs
        LEFT JOIN global.tbl_party gp ON gp.id = rs.grd_lvl_id
        LEFT JOIN global.tbl_partytype gpt ON gpt.id = gp.party_type_id
        LEFT JOIN building_sectioning.tbl_room rm ON rm.id = rs.room_id
        LEFT JOIN building_sectioning.tbl_room_section_subject_assignment adv_rssa
               ON adv_rssa.room_section_id = rs.id AND adv_rssa.advisory = true
        LEFT JOIN profile.tbl_schoolpersonnel adv_sp ON adv_sp.id = adv_rssa.schl_personnel_id
        LEFT JOIN profile.tbl_basicinfo adv_bi ON adv_bi.id = adv_sp.basic_info_id
        LEFT JOIN global.tbl_party strand ON strand.id = rs.program_strand_id
        WHERE rs.id = ${sid}
        LIMIT 1
      `);
    } else if (mode === "teacher") {
      if (!teacherId) {
        return NextResponse.json({ error: "teacherId is required for teacher mode" }, { status: 400 });
      }
      const tid = Number(teacherId);
      filterClause = `WHERE rssa.schl_personnel_id = ${tid}`;

      metaRows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          sp.id, sp.employee_id,
          CONCAT(bi.first_name, ' ', bi.last_name) AS full_name,
          bi.first_name, bi.last_name,
          sd.department_name
        FROM profile.tbl_schoolpersonnel sp
        JOIN profile.tbl_basicinfo bi ON bi.id = sp.basic_info_id
        LEFT JOIN profile.tbl_school_department sd ON sd.id = sp.school_department_id
        WHERE sp.id = ${tid}
        LIMIT 1
      `);
    } else {
      return NextResponse.json({ error: "Invalid mode (expected 'section' or 'teacher')" }, { status: 400 });
    }

    // Pull all schedule blocks joined with timetable for nice display
    const blocks = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        sb.id,
        sb.day_of_week,
        sb.teaching,
        ft.id AS from_id, ft.time_char AS from_time, ft.order_by AS from_order, ft.time_ AS from_t,
        tt2.id AS to_id, tt2.time_char AS to_time, tt2.order_by AS to_order, tt2.time_ AS to_t,
        rssa.id AS rssa_id,
        rssa.advisory,
        subj.description AS subject,
        subj.abbr AS subject_abbr,
        nt.description AS non_teaching_label,
        rs.id AS section_id, rs.sctn_nm,
        rs.grd_lvl_id,
        rm.description AS room_name, rm.room_number,
        sp.id AS teacher_id,
        CONCAT(bi.first_name, ' ', bi.last_name) AS teacher_name
      FROM building_sectioning.tbl_rssa_schedule_blocks sb
      JOIN building_sectioning.tbl_room_section_subject_assignment rssa
            ON rssa.id = sb.tbl_rssa_id
      JOIN building_sectioning.tbl_room_section rs ON rs.id = rssa.room_section_id
      LEFT JOIN building_sectioning.tbl_room rm ON rm.id = rs.room_id
      LEFT JOIN global.tbl_party subj ON subj.id = rssa.subject_id
      LEFT JOIN global.tbl_party nt ON nt.id = sb.non_teaching_id
      LEFT JOIN profile.tbl_schoolpersonnel sp ON sp.id = rssa.schl_personnel_id
      LEFT JOIN profile.tbl_basicinfo bi ON bi.id = sp.basic_info_id
      LEFT JOIN building_sectioning.tbl_timetable ft ON ft.id = sb.from_timetable_id
      LEFT JOIN building_sectioning.tbl_timetable tt2 ON tt2.id = sb.to_timetable_id
      ${filterClause.replace("WHERE", "WHERE")
        .replace("rs.id = ", "rs.id = ")}
      ORDER BY
        CASE sb.day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
          ELSE 9
        END,
        ft.order_by
    `);

    const data = blocks.map((b) => ({
      id: Number(b.id),
      day: b.day_of_week,
      fromTime: b.from_time,
      toTime: b.to_time,
      fromOrder: b.from_order,
      toOrder: b.to_order,
      fromTimeRaw: b.from_t,
      toTimeRaw: b.to_t,
      rssaId: Number(b.rssa_id),
      advisory: !!b.advisory,
      teaching: !!b.teaching,
      subject: b.subject,
      subjectAbbr: b.subject_abbr,
      nonTeachingLabel: b.non_teaching_label,
      sectionId: Number(b.section_id),
      sectionName: b.sctn_nm,
      gradeLevelId: b.grd_lvl_id,
      roomName: b.room_name || b.room_number,
      teacherId: b.teacher_id ? Number(b.teacher_id) : null,
      teacherName: b.teacher_name,
    }));

    // Conflict detection (overlapping time blocks on same day for same teacher or same section)
    const conflicts: { dayKey: string; ids: number[] }[] = [];
    if (mode === "section") {
      // group by day, find overlaps
      const byDay: Record<string, typeof data> = {};
      data.forEach((b) => {
        if (!byDay[b.day]) byDay[b.day] = [];
        byDay[b.day].push(b);
      });
      for (const day of Object.keys(byDay)) {
        const items = byDay[day].sort((a, b) => a.fromOrder - b.fromOrder);
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            // overlap when other.from < current.to AND other.to > current.from
            if (items[j].fromOrder < items[i].toOrder && items[j].toOrder > items[i].fromOrder) {
              conflicts.push({ dayKey: day, ids: [items[i].id, items[j].id] });
            }
          }
        }
      }
    }

    const meta = metaRows[0]
      ? Object.fromEntries(
          Object.entries(metaRows[0]).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v])
        )
      : null;

    return NextResponse.json({
      mode,
      meta,
      blocks: data,
      conflicts,
      totalBlocks: data.length,
    });
  } catch (err) {
    console.error("[schedule GET]", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
