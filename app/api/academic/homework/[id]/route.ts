import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/homework/:id - Get homework assignment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: homeworkId } = await params;

  try {
    const homework = await prisma.homeworkAssignment.findUnique({
      where: { id: homeworkId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            centerId: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        sessionEnrollment: {
          select: {
            id: true,
            session: {
              select: {
                id: true,
                title: true,
                startTime: true,
                sessionMode: true,
              },
            },
          },
        },
        exercise: {
          select: {
            id: true,
            title: true,
            exerciseType: true,
            maxScore: true,
            timeLimit: true,
          },
        },
        attempts: {
          select: {
            id: true,
            exerciseId: true,
            status: true,
            score: true,
            autoGraded: true,
            startedAt: true,
            submittedAt: true,
            timeSpent: true,
          },
          orderBy: {
            startedAt: "desc",
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json(
        { success: false, error: "Homework not found" },
        { status: 404 }
      );
    }

    // Authorization
    if (user.role === "STUDENT" && homework.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "PARENT") {
      // Check if this is their child
      const student = await prisma.user.findUnique({
        where: { id: homework.studentId },
        select: { parentId: true },
      });

      if (student?.parentId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      !["STUDENT", "PARENT"].includes(user.role) &&
      homework.student.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: homework,
    });
  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch homework" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/homework/:id - Update homework assignment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: homeworkId } = await params;

  // Only teachers, supervisors, and admins can update homework
  if (
    ![
      "SUPER_ADMIN",
      "CENTER_ADMIN",
      "CENTER_SUPERVISOR",
      "TEACHER",
    ].includes(user.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      dueDate,
      estimatedTime,
      status,
      totalScore,
      feedback,
    } = body;

    // Get existing homework
    const existing = await prisma.homeworkAssignment.findUnique({
      where: { id: homeworkId },
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
        { success: false, error: "Homework not found" },
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

    // Build update data
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime;
    if (feedback !== undefined) updateData.feedback = feedback;

    // Status updates
    if (status !== undefined) {
      updateData.status = status;

      if (status === "GRADED" && totalScore !== undefined) {
        updateData.totalScore = totalScore;
        updateData.gradedAt = new Date();
        updateData.gradedById = user.id;
      }
    }

    // Update homework
    const homework = await prisma.homeworkAssignment.update({
      where: { id: homeworkId },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        exercise: {
          select: {
            id: true,
            title: true,
            exerciseType: true,
            maxScore: true,
          },
        },
      },
    });

    // Award XP if homework is graded and student scored well
    if (status === "GRADED" && totalScore !== undefined) {
      const percentageScore = (totalScore / existing.totalMaxScore) * 100;

      let xpToAward = 0;
      if (percentageScore >= 90) {
        xpToAward = 100; // Excellent homework
      } else if (percentageScore >= 70) {
        xpToAward = 60; // Good homework
      } else if (percentageScore >= 50) {
        xpToAward = 30; // Pass
      }

      if (xpToAward > 0) {
        await prisma.xPTransaction.create({
          data: {
            userId: existing.studentId,
            amount: xpToAward,
            description: `Homework graded: ${homework.exercise.title}`,
            source: "HOMEWORK_SUBMISSION",
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
    }

    return NextResponse.json({
      success: true,
      data: homework,
    });
  } catch (error) {
    console.error("Error updating homework:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update homework" },
      { status: 500 }
    );
  }
}
