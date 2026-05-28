import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/personnel/[id]
export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT sp.id, sp.employee_id, sp.is_active, sp.uuid,
        sp.employee_type_id, sp.personal_title_id, sp.status_id, sp.school_department_id,
        bi.id AS basic_info_id, bi.first_name, bi.middle_name, bi.last_name,
        bi.suffix, bi.birthdate, bi.sex, bi.img_path,
        et.description AS employee_type, pt.description AS personal_title,
        st.description AS employment_status, sd.department_name
       FROM profile.tbl_schoolpersonnel sp
       JOIN profile.tbl_basicinfo bi ON bi.id = sp.basic_info_id
       LEFT JOIN global.tbl_party et ON et.id = sp.employee_type_id
       LEFT JOIN global.tbl_party pt ON pt.id = sp.personal_title_id
       LEFT JOIN global.tbl_status st ON st.id = sp.status_id
       LEFT JOIN profile.tbl_school_department sd ON sd.id = sp.school_department_id
       WHERE sp.id = $1`,
      Number(id)
    );
    if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const r = rows[0];
    return NextResponse.json({
      ...r,
      id: Number(r.id),
      basic_info_id: Number(r.basic_info_id),
      employee_type_id: r.employee_type_id ? Number(r.employee_type_id) : null,
      personal_title_id: r.personal_title_id ? Number(r.personal_title_id) : null,
      status_id: r.status_id ? Number(r.status_id) : null,
      school_department_id: r.school_department_id ? Number(r.school_department_id) : null,
      is_active: Number(r.is_active),
    });
  } catch (error) {
    console.error("Get personnel error:", error);
    return NextResponse.json({ error: "Failed to fetch personnel" }, { status: 500 });
  }
}

// PUT /api/admin/personnel/[id]
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const { firstName, middleName, lastName, suffix, birthdate, sex,
      employeeId, employeeTypeId, personalTitleId, statusId, schoolDepartmentId, isActive, basicInfoId } = body;

    await prisma.$transaction(async (tx) => {
      await tx.basicInfo.update({
        where: { id: BigInt(basicInfoId) },
        data: {
          firstName: firstName.trim().toUpperCase(),
          middleName: middleName ? middleName.trim().toUpperCase() : null,
          lastName: lastName.trim().toUpperCase(),
          suffix: suffix || null,
          birthdate: birthdate ? new Date(birthdate) : null,
          sex: sex === true || sex === "true" || sex === 1,
        },
      });
      await tx.$executeRawUnsafe(
        `UPDATE profile.tbl_schoolpersonnel SET
          employee_id = $1,
          employee_type_id = $2,
          personal_title_id = $3,
          status_id = $4,
          school_department_id = $5,
          is_active = $6
         WHERE id = $7`,
        employeeId.trim(),
        employeeTypeId ? Number(employeeTypeId) : null,
        Number(personalTitleId),
        Number(statusId),
        schoolDepartmentId ? Number(schoolDepartmentId) : null,
        isActive ? 1 : 0,
        Number(id)
      );
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update personnel error:", error);
    return NextResponse.json({ error: "Failed to update personnel" }, { status: 500 });
  }
}

// DELETE /api/admin/personnel/[id] — soft delete
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE profile.tbl_schoolpersonnel SET is_active = 0 WHERE id = $1`,
      Number(id)
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete personnel error:", error);
    return NextResponse.json({ error: "Failed to deactivate personnel" }, { status: 500 });
  }
}
