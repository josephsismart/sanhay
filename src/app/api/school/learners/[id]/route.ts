import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSySchema } from "@/lib/sy-schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role > 6) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const {
      basicInfoId, firstName, middleName, lastName, suffix, birthdate, sex,
      lrn, fourPs, guardian, relation, contactNum,
      fFirstName, fMiddleName, fLastName,
      mFirstName, mMiddleName, mLastName,
      sectionId, enrollmentId,
    } = body;

    await prisma.$transaction(async (tx) => {
      await tx.basicInfo.update({
        where: { id: BigInt(basicInfoId) },
        data: {
          firstName: firstName.trim().toUpperCase(),
          middleName: middleName ? middleName.trim().toUpperCase() : null,
          lastName: lastName.trim().toUpperCase(),
          suffix: suffix || null,
          birthdate: birthdate ? new Date(birthdate) : null,
          sex: sex === true || sex === "true",
        },
      });

      await tx.$executeRawUnsafe(
        `UPDATE profile.tbl_learners SET
          lrn=$1, four_ps=$2, guardian=$3, relation=$4, contact_num=$5,
          ffirst_name=$6, fmiddle_name=$7, flast_name=$8,
          mfirst_name=$9, mmiddle_name=$10, mlast_name=$11
         WHERE id=$12`,
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
        Number(id)
      );

      // Update section if enrollment exists
      if (enrollmentId && sectionId) {
        const { schema: sySchema } = await getActiveSySchema();
        await tx.$executeRawUnsafe(
          `UPDATE ${sySchema}.bs_tbl_learner_enrollment SET room_section_id=$1 WHERE id=$2`,
          Number(sectionId), Number(enrollmentId)
        );
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update learner error:", error);
    return NextResponse.json({ error: "Failed to update learner" }, { status: 500 });
  }
}
