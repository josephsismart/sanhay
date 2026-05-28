import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

type RouteContext = { params: Promise<{ rssaId: string }> };

// GET /api/teacher/grades/[rssaId]
// Returns all enrolled learners for the section + their grades for this rssa
export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 7) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rssaId } = await ctx.params;
  const basicInfoId = (session.user as any).basicInfoId;

  try {
    const { schema, inputGradesQrtr } = await getActiveSySchema();

    // Verify teacher owns this rssa
    const ownerCheck = await prisma.$queryRawUnsafe<any[]>(
      `SELECT rssa.id, rssa.room_section_id, rssa.grading_lock,
              p_subj.description AS subject_name,
              rs.sctn_nm AS section_name,
              p_grade.description AS grade_level
       FROM building_sectioning.tbl_room_section_subject_assignment rssa
       JOIN building_sectioning.tbl_room_section rs ON rs.id = rssa.room_section_id
       JOIN global.tbl_party p_grade ON p_grade.id = rs.grd_lvl_id
       LEFT JOIN global.tbl_party p_subj ON p_subj.id = rssa.subject_id
       JOIN profile.tbl_schoolpersonnel sp ON sp.id = rssa.schl_personnel_id
       WHERE rssa.id = $1 AND sp.basic_info_id = $2`,
      Number(rssaId), Number(basicInfoId)
    );

    if (!ownerCheck.length) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const rssaInfo = ownerCheck[0];
    const roomSectionId = Number(rssaInfo.room_section_id);

    // Get learners enrolled in this section with their grades for this rssa
    const learners = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
         le.id AS enrollment_id,
         tl.id AS learner_id,
         tl.lrn,
         bi.first_name, bi.last_name, bi.middle_name, bi.sex,
         lg.id AS grade_id,
         lg.q1, lg.q2, lg.q3, lg.q4,
         lg.remarks
       FROM ${schema}.bs_tbl_learner_enrollment le
       JOIN profile.tbl_learners tl ON tl.id = le.learner_id
       JOIN profile.tbl_basicinfo bi ON bi.id = tl.basic_info_id
       LEFT JOIN ${schema}.bs_tbl_learner_grades lg
         ON lg.learner_enrollment_id = le.id
         AND lg.rm_sctn_sbjct_assgnmnt_id = $1
       WHERE le.room_section_id = $2
       ORDER BY bi.last_name, bi.first_name`,
      Number(rssaId), roomSectionId
    );

    // Determine which quarters are open from input_grades_qrtr (e.g. 1234 means all open)
    const qrtrCode = inputGradesQrtr?.toString() || "";
    const openQuarters = [1, 2, 3, 4].filter(q => qrtrCode.includes(q.toString()));

    return NextResponse.json({
      rssa: {
        id: Number(rssaId),
        subjectName: rssaInfo.subject_name,
        sectionName: rssaInfo.section_name,
        gradeLevel: rssaInfo.grade_level,
        gradingLock: rssaInfo.grading_lock,
        openQuarters,
      },
      learners: learners.map(r => ({
        enrollmentId: Number(r.enrollment_id),
        learnerId: Number(r.learner_id),
        lrn: r.lrn,
        firstName: r.first_name,
        lastName: r.last_name,
        middleName: r.middle_name,
        sex: r.sex,
        gradeId: r.grade_id ? Number(r.grade_id) : null,
        q1: r.q1 != null ? Number(r.q1) : null,
        q2: r.q2 != null ? Number(r.q2) : null,
        q3: r.q3 != null ? Number(r.q3) : null,
        q4: r.q4 != null ? Number(r.q4) : null,
        remarks: r.remarks ?? null,
      })),
    });
  } catch (error) {
    console.error("Grades GET error:", error);
    return NextResponse.json({ error: "Failed to fetch grades" }, { status: 500 });
  }
}

// POST /api/teacher/grades/[rssaId]
// Upsert grades for one or more learners
export async function POST(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 7) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rssaId } = await ctx.params;
  const basicInfoId = (session.user as any).basicInfoId;

  try {
    const body = await req.json();
    const { grades } = body as {
      grades: Array<{
        enrollmentId: number;
        gradeId: number | null;
        q1: number | null;
        q2: number | null;
        q3: number | null;
        q4: number | null;
        remarks?: string | null;
      }>;
    };

    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json({ error: "No grades provided" }, { status: 400 });
    }

    // Verify teacher owns this rssa
    const ownerCheck = await prisma.$queryRawUnsafe<any[]>(
      `SELECT rssa.id FROM building_sectioning.tbl_room_section_subject_assignment rssa
       JOIN profile.tbl_schoolpersonnel sp ON sp.id = rssa.schl_personnel_id
       WHERE rssa.id = $1 AND sp.basic_info_id = $2 AND rssa.grading_lock = false`,
      Number(rssaId), Number(basicInfoId)
    );

    if (!ownerCheck.length) {
      return NextResponse.json({ error: "Not authorized or grading is locked" }, { status: 403 });
    }

    // Get teacher's personnel_id
    const spRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM profile.tbl_schoolpersonnel WHERE basic_info_id = $1`,
      Number(basicInfoId)
    );
    const personnelId = spRows[0]?.id ? Number(spRows[0].id) : null;

    const { schema } = await getActiveSySchema();
    const now = new Date();

    // Upsert each grade row
    for (const g of grades) {
      const q1 = g.q1 != null ? Number(g.q1) : null;
      const q2 = g.q2 != null ? Number(g.q2) : null;
      const q3 = g.q3 != null ? Number(g.q3) : null;
      const q4 = g.q4 != null ? Number(g.q4) : null;

      if (g.gradeId) {
        // Update existing
        await prisma.$executeRawUnsafe(
          `UPDATE ${schema}.bs_tbl_learner_grades
           SET q1=$1, q2=$2, q3=$3, q4=$4, remarks=$5,
               date_updated=$6, updated_by=$7
           WHERE id=$8`,
          q1, q2, q3, q4, g.remarks ?? null, now, personnelId, g.gradeId
        );
      } else {
        // Insert new
        await prisma.$executeRawUnsafe(
          `INSERT INTO ${schema}.bs_tbl_learner_grades
             (learner_enrollment_id, rm_sctn_sbjct_assgnmnt_id, q1, q2, q3, q4, remarks, date_added, added_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          g.enrollmentId, Number(rssaId), q1, q2, q3, q4, g.remarks ?? null, now, personnelId
        );
      }
    }

    return NextResponse.json({ success: true, saved: grades.length });
  } catch (error) {
    console.error("Grades POST error:", error);
    return NextResponse.json({ error: "Failed to save grades" }, { status: 500 });
  }
}
