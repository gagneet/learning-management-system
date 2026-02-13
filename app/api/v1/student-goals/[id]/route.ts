import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/student-goals/:id - Get specific student goal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404 }
      );
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
      if (goal.student.centerId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error("Error fetching student goal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student goal" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/student-goals/:id - Update student goal
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    // Authorization
    if (user.role === "STUDENT" && existing.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "STUDENT" &&
      existing.student.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};

    if (goalText !== undefined) updateData.goalText = goalText;
    if (category !== undefined) updateData.category = category;
    if (targetDate !== undefined)
      updateData.targetDate = targetDate ? new Date(targetDate) : null;

    if (isAchieved !== undefined) {
      updateData.isAchieved = isAchieved;

      // Set achievedAt when goal is achieved
      if (isAchieved && !existing.achievedAt) {
        updateData.achievedAt = new Date();
      }

      // Clear achievedAt when goal is unachieved
      if (!isAchieved && existing.achievedAt) {
        updateData.achievedAt = null;
      }
    }

    // Update goal
    const goal = await prisma.studentGoal.update({
      where: { id: goalId },
      data: updateData,
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
    if (isAchieved && !existing.isAchieved) {
      // Award XP based on goal category
      let xpToAward = 100; // Base XP for achieving a goal

      if (goal.category) {
        switch (goal.category.toUpperCase()) {
          case "ACADEMIC":
            xpToAward = 150;
            break;
          case "SKILL":
            xpToAward = 100;
            break;
          case "PERSONAL":
            xpToAward = 75;
            break;
          default:
            xpToAward = 50;
        }
      }

      await prisma.xPTransaction.create({
        data: {
          userId: existing.studentId,
          amount: xpToAward,
          description: `Goal achieved: ${goal.goalText}`,
          source: "GOAL_COMPLETE",
        },
      });

      await prisma.gamificationProfile.update({
        where: { userId: existing.studentId },
        data: {
          totalXP: {
            increment: xpToAward,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    console.error("Error updating student goal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update student goal" },
      { status: 500 }
    );
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
