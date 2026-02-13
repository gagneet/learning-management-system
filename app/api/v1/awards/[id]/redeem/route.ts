import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/v1/awards/:id/redeem - Redeem an award
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: awardId } = await params;

  // Only students can redeem awards (or admins for testing)
  if (!["STUDENT", "SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { studentId } = body;

    // Determine the actual student ID
    const actualStudentId =
      user.role === "STUDENT" ? user.id : studentId;

    if (!actualStudentId) {
      return NextResponse.json(
        {
          success: false,
          error: "studentId is required for admin redemptions",
        },
        { status: 400 }
      );
    }

    // Get award details
    const award = await prisma.award.findUnique({
      where: { id: awardId },
      select: {
        id: true,
        name: true,
        xpCost: true,
        awardType: true,
        isActive: true,
        stockQuantity: true,
        centreId: true,
      },
    });

    if (!award) {
      return NextResponse.json(
        { success: false, error: "Award not found" },
        { status: 404 }
      );
    }

    // Verify award is active
    if (!award.isActive) {
      return NextResponse.json(
        { success: false, error: "Award is not currently available" },
        { status: 400 }
      );
    }

    // Check stock availability
    if (award.stockQuantity !== null && award.stockQuantity <= 0) {
      return NextResponse.json(
        { success: false, error: "Award is out of stock" },
        { status: 400 }
      );
    }

    // Get student details
    const student = await prisma.user.findUnique({
      where: { id: actualStudentId },
      select: {
        id: true,
        name: true,
        email: true,
        centerId: true,
        gamificationProfile: {
          select: {
            totalXP: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const studentTotalXP = student.gamificationProfile?.totalXP || 0;

    // Verify centre match
    if (award.centreId !== student.centerId) {
      return NextResponse.json(
        { success: false, error: "Award not available in student's centre" },
        { status: 400 }
      );
    }

    // Check if student has enough XP
    if (studentTotalXP < award.xpCost) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient XP. Required: ${award.xpCost}, Available: ${studentTotalXP}`,
        },
        { status: 400 }
      );
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Deduct XP from student's gamification profile
      await tx.gamificationProfile.update({
        where: { userId: actualStudentId },
        data: {
          totalXP: {
            decrement: award.xpCost,
          },
        },
      });

      // Create XP transaction record
      await tx.xPTransaction.create({
        data: {
          userId: actualStudentId,
          amount: -award.xpCost,
          description: `Redeemed award: ${award.name}`,
          source: "AWARD_REDEMPTION",
        },
      });

      // Decrement stock if applicable
      if (award.stockQuantity !== null) {
        await tx.award.update({
          where: { id: awardId },
          data: {
            stockQuantity: {
              decrement: 1,
            },
          },
        });
      }

      // Create redemption record
      const redemption = await tx.awardRedemption.create({
        data: {
          studentId: actualStudentId,
          awardId,
          xpSpent: award.xpCost,
        },
        include: {
          award: {
            select: {
              id: true,
              name: true,
              description: true,
              awardType: true,
              xpCost: true,
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              gamificationProfile: {
                select: {
                  totalXP: true,
                },
              },
            },
          },
        },
      });

      return redemption;
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Successfully redeemed ${award.name}!`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error redeeming award:", error);
    return NextResponse.json(
      { success: false, error: "Failed to redeem award" },
      { status: 500 }
    );
  }
}
