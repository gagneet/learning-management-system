import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  checkCenterAccess,
} from "@/lib/api-middleware";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from "@/lib/api-utils";
import { awardXP } from "@/lib/gamification-utils";

// GET /api/v1/student-goals/:id - Get specific student goal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { session } = authResult;
  const { user } = session;
  const { id: goalId } = await params;

  try {
    const goal = await prisma.studentGoal.findUnique({
      where: { id: goalId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            centerId: true,
            parentId: true,
          },
        },
      },
    });

    if (!goal) {
      return notFoundResponse("Goal");
    }

    // Authorization
    if (user.role === "STUDENT" && goal.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "PARENT") {
      if (goal.student.parentId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      !["STUDENT", "PARENT"].includes(user.role)
    ) {
      const accessError = checkCenterAccess(
        user.role,
        user.centerId,
        goal.student.centerId
      );
      if (accessError) return accessError;
    }

    return successResponse(goal);
  } catch (error) {
    console.error("Error fetching student goal:", error);
    return errorResponse("Failed to fetch student goal");
  }
}

// PATCH /api/v1/student-goals/:id - Update student goal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { session } = authResult;

  const { user } = session;
  const { id: goalId } = await params;

  // Students can update their own goals, teachers/admins can update any
  if (
    ![
      "SUPER_ADMIN",
      "CENTER_ADMIN",
      "CENTER_SUPERVISOR",
      "TEACHER",
      "STUDENT",
    ].includes(user.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      goalText,
      category,
      targetDate,
      isAchieved,
    } = body;

    // Get existing goal
    const existingGoal = await prisma.studentGoal.findUnique({
      where: { id: goalId },
      include: {
        student: {
          select: {
            centerId: true,
          },
        },
      },
    });

    if (!existingGoal) {
      return notFoundResponse("Goal");
    }

    // Authorization
    if (user.role === "STUDENT" && existingGoal.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "STUDENT"
    ) {
      const accessError = checkCenterAccess(
        user.role,
        user.centerId,
        existingGoal.student.centerId
      );
      if (accessError) return accessError;
    }

    // Build goal update payload with proper typing
    const goalUpdatePayload: {
      goalText?: string;
      category?: string;
      targetDate?: Date | null;
      isAchieved?: boolean;
      achievedAt?: Date | null;
    } = {};

    if (goalText !== undefined) goalUpdatePayload.goalText = goalText;
    if (category !== undefined) goalUpdatePayload.category = category;
    if (targetDate !== undefined)
      goalUpdatePayload.targetDate = targetDate ? new Date(targetDate) : null;

    if (isAchieved !== undefined) {
      goalUpdatePayload.isAchieved = isAchieved;

      // Set achievedAt when goal is achieved
      if (isAchieved && !existingGoal.achievedAt) {
        goalUpdatePayload.achievedAt = new Date();
      }

      // Clear achievedAt when goal is unachieved
      if (!isAchieved && existingGoal.achievedAt) {
        goalUpdatePayload.achievedAt = null;
      }
    }

    // Update goal
    const updatedGoal = await prisma.studentGoal.update({
      where: { id: goalId },
      data: goalUpdatePayload,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Award XP when goal is achieved
    if (isAchieved && !existingGoal.isAchieved) {
      // Award XP based on goal category
      let xpAmount = 100; // Base XP for achieving a goal

      if (updatedGoal.category) {
        switch (updatedGoal.category.toUpperCase()) {
          case "ACADEMIC":
            xpAmount = 150;
            break;
          case "SKILL":
            xpAmount = 100;
            break;
          case "PERSONAL":
            xpAmount = 75;
            break;
          default:
            xpAmount = 50;
        }
      }

      // Use utility function for XP awarding
      await awardXP(
        existingGoal.studentId,
        xpAmount,
        `Goal achieved: ${updatedGoal.goalText}`,
        "GOAL_COMPLETE"
      );
    }

    return successResponse(updatedGoal);
  } catch (error) {
    console.error("Error updating student goal:", error);
    return errorResponse("Failed to update student goal");
  }
}

// DELETE /api/v1/student-goals/:id - Delete student goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: goalId } = await params;

  // Only admins can delete goals
  if (!["SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get existing goal
    const existing = await prisma.studentGoal.findUnique({
      where: { id: goalId },
      include: {
        student: {
          select: {
            centerId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404 }
      );
    }

    // Verify center access
    if (
      user.role !== "SUPER_ADMIN" &&
      existing.student.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete goal
    await prisma.studentGoal.delete({
      where: { id: goalId },
    });

    return NextResponse.json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student goal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete student goal" },
      { status: 500 }
    );
  }
}
