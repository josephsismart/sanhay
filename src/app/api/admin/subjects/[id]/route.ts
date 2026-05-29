import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SUBJECT_PARTY_TYPE_ID = 17;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 2) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const body = await req.json();
    const description = (body.description ?? "").toString().trim();
    const abbr = (body.abbr ?? "").toString().trim();
    const orderBy = body.orderBy != null ? Number(body.orderBy) : null;
    const parentPartyId = body.parentPartyId === null || body.parentPartyId === undefined
      ? null
      : Number(body.parentPartyId);

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    // Confirm it's actually a subject
    const exists = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM global.tbl_party WHERE id = $1 AND party_type_id = ${SUBJECT_PARTY_TYPE_ID}`,
      id
    );
    if (!exists.length) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Duplicate check (excluding self)
    const dup = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM global.tbl_party
       WHERE party_type_id = ${SUBJECT_PARTY_TYPE_ID}
         AND LOWER(description) = LOWER($1)
         AND id <> $2
       LIMIT 1`,
      description,
      id
    );
    if (dup.length) {
      return NextResponse.json({ error: "Another subject with this name already exists" }, { status: 409 });
    }

    await prisma.$executeRawUnsafe(
      `UPDATE global.tbl_party
         SET description = $1,
             abbr = $2,
             order_by = COALESCE($3, order_by),
             parent_party_id = $4
       WHERE id = $5 AND party_type_id = ${SUBJECT_PARTY_TYPE_ID}`,
      description,
      abbr || null,
      orderBy,
      parentPartyId,
      id
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[subjects PUT]", err);
    return NextResponse.json({ error: "Failed to update", detail: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 2) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const body = await req.json();
    const isActive = !!body.isActive;

    const updated = await prisma.$executeRawUnsafe(
      `UPDATE global.tbl_party
         SET is_active = $1
       WHERE id = $2 AND party_type_id = ${SUBJECT_PARTY_TYPE_ID}`,
      isActive,
      id
    );

    if (!updated) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, isActive });
  } catch (err) {
    console.error("[subjects PATCH]", err);
    return NextResponse.json({ error: "Failed to toggle", detail: String(err) }, { status: 500 });
  }
}
