import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

/**
 * POST /api/school/sections/[id]/enroll
 * Body: { learnerIds: number[] }
 *
 * Enrolls the given learners into the section (status_id = 5 ENROLLED) in the active SY.
 * Skips learners who already have an active enrollment.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: idParam } = await params;
  const sectionId = Number(idParam);
  if (!sectionId) return NextResponse.json({ error: "Invalid section id" }, { status: 400 });

  try {
    const body = await req.json();
    const ids: number[] = Array.isArray(body.learnerIds) ? body.learnerIds.map(Number).filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ error: "learnerIds array is required" }, { status: 400 });
    }

    const sessionUserId = Number((session.user as any).id) || null;
    const { schema } = await getActiveSySchema();

    // Confirm section exists
    const sec = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, sctn_nm FROM building_sectioning.tbl_room_section WHERE id = $1`,
      sectionId
    );
    if (!sec.length) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Filter out learners that already have active enrollment
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const alreadyEnrolled = await prisma.$queryRawUnsafe<any[]>(
      `SELECT DISTINCT learner_id
       FROM ${schema}.bs_tbl_learner_enrollment
       WHERE status_id = 5 AND learner_id IN (${placeholders})`,
      ...ids
    );
    const alreadySet = new Set(alreadyEnrolled.map((r) => Number(r.learner_id)));
    const newIds = ids.filter((id) => !alreadySet.has(id));

    if (!newIds.length) {
      return NextResponse.json({
        success: true,
        enrolled: 0,
        skipped: ids.length,
        message: "All selected learners are already enrolled in another section.",
      });
    }

    // Bulk insert
    const valuesSql = newIds
      .map((_, i) => `($${i + 1}, ${sectionId}, 5, NOW(), $${newIds.length + 1}, NOW())`)
      .join(", ");
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${schema}.bs_tbl_learner_enrollment
        (learner_id, room_section_id, status_id, enrollment_date, added_by, date_added)
       VALUES ${valuesSql}`,
      ...newIds,
      sessionUserId
    );

    // Try to refresh materialized view if exists (don't fail if it doesn't)
    try {
      await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${schema}.bs_view_enrollment`);
    } catch {
      try {
        await prisma.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW ${schema}.bs_view_enrollment`);
      } catch {/* not a matview or doesn't exist; ignore */}
    }

    return NextResponse.json({
      success: true,
      enrolled: newIds.length,
      skipped: ids.length - newIds.length,
    });
  } catch (err) {
    console.error("[enroll POST]", err);
    return NextResponse.json({ error: "Failed to enroll", detail: String(err) }, { status: 500 });
  }
}
