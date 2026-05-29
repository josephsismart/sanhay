import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/school/sections/pickers
 * Returns grade levels, schedules, strands, and rooms for the Add Section form.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Grade levels: JHS (party_type 14) + SHS (party_type 15)
    const grades = await prisma.$queryRawUnsafe<any[]>(`
      SELECT p.id, p.description, p.order_by, pt.description AS level_kind, p.party_type_id
      FROM global.tbl_party p
      JOIN global.tbl_partytype pt ON pt.id = p.party_type_id
      WHERE p.party_type_id IN (14, 15) AND p.is_active = true
      ORDER BY p.party_type_id, p.order_by, p.description
    `);

    // Schedules (party_type 18)
    const schedules = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, description, abbr
      FROM global.tbl_party
      WHERE party_type_id = 18 AND is_active = true
      ORDER BY order_by NULLS LAST, description
    `);

    // Strands (party_type 22)
    const strands = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, description, abbr
      FROM global.tbl_party
      WHERE party_type_id = 22 AND is_active = true
      ORDER BY description
    `);

    // Rooms
    const rooms = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, description, room_number
      FROM building_sectioning.tbl_room
      ORDER BY description NULLS LAST, room_number NULLS LAST
    `);

    return NextResponse.json({
      gradeLevels: grades.map((g) => ({
        id: Number(g.id),
        description: g.description,
        levelKind: g.level_kind,
        partyTypeId: Number(g.party_type_id),
      })),
      schedules: schedules.map((s) => ({ id: Number(s.id), description: s.description, abbr: s.abbr })),
      strands: strands.map((s) => ({ id: Number(s.id), description: s.description, abbr: s.abbr })),
      rooms: rooms.map((r) => ({
        id: Number(r.id),
        description: r.description,
        roomNumber: r.room_number,
        label: r.description
          ? `${r.description}${r.room_number ? " · " + r.room_number : ""}`
          : `Room ${r.room_number || "?"}`,
      })),
    });
  } catch (err) {
    console.error("[sections pickers]", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
