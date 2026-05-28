
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  const searchLike = "%" + search + "%";
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT sp.id, sp.employee_id, sp.is_active, sp.uuid,
        bi.id AS basic_info_id, bi.first_name, bi.middle_name, bi.last_name,
        bi.suffix, bi.birthdate, bi.sex, bi.img_path,
        et.description AS employee_type, pt.description AS personal_title,
        st.description AS employment_status, sd.department_name,
        sp.school_department_id, sp.employee_type_id, sp.personal_title_id, sp.status_id
       FROM profile.tbl_schoolpersonnel sp
       JOIN profile.tbl_basicinfo bi ON bi.id = sp.basic_info_id
       LEFT JOIN global.tbl_party et ON et.id = sp.employee_type_id
       LEFT JOIN global.tbl_party pt ON pt.id = sp.personal_title_id
       LEFT JOIN global.tbl_status st ON st.id = sp.status_id
       LEFT JOIN profile.tbl_school_department sd ON sd.id = sp.school_department_id
       WHERE ($1 = '' OR bi.first_name ILIKE $2 OR bi.last_name ILIKE $2 OR sp.employee_id ILIKE $2)
       ORDER BY bi.last_name, bi.first_name
       LIMIT $3 OFFSET $4`,
      search, searchLike, limit, offset
    );
    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) AS count FROM profile.tbl_schoolpersonnel sp
       JOIN profile.tbl_basicinfo bi ON bi.id = sp.basic_info_id
       WHERE ($1 = \'\' OR bi.first_name ILIKE $2 OR bi.last_name ILIKE $2 OR sp.employee_id ILIKE $2)`,
      search, searchLike
    );
    const data = rows.map((r) => ({
      ...r,
      id: Number(r.id),
      basic_info_id: Number(r.basic_info_id),
      employee_type_id: r.employee_type_id ? Number(r.employee_type_id) : null,
      personal_title_id: r.personal_title_id ? Number(r.personal_title_id) : null,
      status_id: r.status_id ? Number(r.status_id) : null,
      school_department_id: r.school_department_id ? Number(r.school_department_id) : null,
      is_active: Number(r.is_active),
    }));
    return NextResponse.json({ data, total: Number(countResult[0].count), page, limit });
  } catch (error) {
    console.error("Personnel list error:", error);
    return NextResponse.json({ error: "Failed to fetch personnel" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { firstName, middleName, lastName, suffix, birthdate, sex,
      employeeId, employeeTypeId, personalTitleId, statusId, schoolDepartmentId } = body;
    if (!firstName || !lastName || !employeeId || !personalTitleId || !statusId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await prisma.$transaction(async (tx) => {
      const basicInfo = await tx.basicInfo.create({
        data: {
          firstName: firstName.trim().toUpperCase(),
          middleName: middleName ? middleName.trim().toUpperCase() : null,
          lastName: lastName.trim().toUpperCase(),
          suffix: suffix || null,
          birthdate: birthdate ? new Date(birthdate) : null,
          sex: sex === true || sex === "true" || sex === 1,
        },
      });
      const newUuid = crypto.randomUUID();
      const empId = employeeId.trim();
      const biId = Number(basicInfo.id);
      const titleId = Number(personalTitleId);
      const statId = Number(statusId);
      const empTypeId = employeeTypeId ? Number(employeeTypeId) : null;
      const deptId = schoolDepartmentId ? Number(schoolDepartmentId) : null;
      await tx.$executeRawUnsafe(
        `INSERT INTO profile.tbl_schoolpersonnel (school_id, basic_info_id, employee_type_id, personal_title_id, status_id, school_department_id, is_active, employee_id, uuid) VALUES (1, $1, $2, $3, $4, $5, 1, $6, $7)`,
        biId, empTypeId, titleId, statId, deptId, empId, newUuid
      );
      return { basicInfoId: biId };
    });
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    console.error("Personnel create error:", error);
    return NextResponse.json({ error: "Failed to create personnel" }, { status: 500 });
  }
}
