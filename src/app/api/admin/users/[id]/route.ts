import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

/**
 * PATCH /api/admin/users/[id]
 *   Update an existing user account.
 *   body fields (all optional):
 *     username, roleId, isActive, newPassword (resets password)
 */
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
    const sessionUserId = Number((session.user as any).id) || null;

    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, username FROM account.tbl_useraccount WHERE id = $1`,
      id
    );
    if (!existing.length) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (body.username !== undefined) {
      const newUsername = (body.username || "").toString().trim().toLowerCase();
      if (!/^[a-z0-9._@-]+$/i.test(newUsername)) {
        return NextResponse.json({ error: "Invalid username format" }, { status: 400 });
      }
      // Duplicate check (excluding self)
      const dup = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM account.tbl_useraccount WHERE LOWER(username) = LOWER($1) AND id <> $2 LIMIT 1`,
        newUsername,
        id
      );
      if (dup.length) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
      }
      updates.push(`username = $${i++}`);
      values.push(newUsername);
    }

    if (body.roleId !== undefined) {
      updates.push(`role_id = $${i++}`);
      values.push(Number(body.roleId));
    }

    if (body.isActive !== undefined) {
      updates.push(`is_active = $${i++}`);
      values.push(!!body.isActive);
    }

    if (body.newPassword !== undefined && body.newPassword !== "") {
      const pw = body.newPassword.toString();
      if (pw.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      updates.push(`password = $${i++}`);
      values.push(md5(pw));
      updates.push(`change_pwd = true`);
    }

    if (!updates.length) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_by = $${i++}`);
    values.push(sessionUserId);
    updates.push(`date_updated = NOW()`);

    values.push(id);
    const sql = `UPDATE account.tbl_useraccount SET ${updates.join(", ")} WHERE id = $${i}`;
    await prisma.$executeRawUnsafe(sql, ...values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[users PATCH]", err);
    return NextResponse.json({ error: "Failed to update", detail: String(err) }, { status: 500 });
  }
}
