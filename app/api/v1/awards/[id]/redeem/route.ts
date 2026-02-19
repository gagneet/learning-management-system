import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  checkRole,
} from "@/lib/api-middleware";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  badRequestResponse,
} from "@/lib/api-utils";
import {
  deductXP,
  getStudentWithGamification,
} from "@/lib/gamification-utils";

// POST /api/v1/awards/:id/redeem - Redeem an award
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { session } = authResult;
  const { user } = session;
  const { id: awardId } = await params;

  // Only students can redeem awards (or admins for testing)
  const roleError = checkRole(user.role, [
    "STUDENT",
    "SUPER_ADMIN",
    "CENTER_ADMIN",
  ]);
  if (roleError) return roleError;

  try {
    const body = await request.json();
    const { studentId } = body;

    // Determine the actual student ID
    const actualStudentId = user.role === "STUDENT" ? user.id : studentId;

    if (!actualStudentId) {
      return badRequestResponse(
        "studentId is required for admin redemptions"
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
      return notFoundResponse("Award");
    }

    // Verify award is active
    if (!award.isActive) {
      return badRequestResponse("Award is not currently available");
    }

    // Check stock availability
    if (award.stockQuantity !== null && award.stockQuantity <= 0) {
      return badRequestResponse("Award is out of stock");
    }

    // Get student details with gamification profile
    const student = await getStudentWithGamification(actualStudentId);

    if (!student) {
      return notFoundResponse("Student");
    }

    const studentTotalXP = student.gamificationProfile?.totalXP || 0;

    // Verify centre match
    if (award.centreId !== student.centerId) {
      return badRequestResponse("Award not available in student's centre");
    }

    // Check if student has enough XP
    if (studentTotalXP < award.xpCost) {
      return badRequestResponse(
        `Insufficient XP. Required: ${award.xpCost}, Available: ${studentTotalXP}`
      );
    }

    // Use a transaction to ensure atomicity
    const redemption = await prisma.$transaction(async (tx) => {
      // Deduct XP using utility function (handles both XP transaction and profile update)
      await deductXP(
        actualStudentId,
        award.xpCost,
        `Redeemed award: ${award.name}`,
        "AWARD_REDEMPTION"
      );

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
      return await tx.awardRedemption.create({
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
    });

    return NextResponse.json(
      {
        success: true,
        data: redemption,
        message: `Successfully redeemed ${award.name}!`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error redeeming award:", error);
    return errorResponse("Failed to redeem award");
  }
}
