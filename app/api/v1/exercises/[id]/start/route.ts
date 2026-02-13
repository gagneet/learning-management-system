import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/v1/exercises/:id/start - Start an exercise attempt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: exerciseId } = await params;

  // Only students can start exercises (or admins for testing)
  if (!["STUDENT", "SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { sessionEnrollmentId, homeworkAssignmentId } = body;

    // Get exercise details
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: {
        id: true,
        maxScore: true,
        isActive: true,
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: "Exercise not found" },
        { status: 404 }
      );
    }

    if (!exercise.isActive) {
      return NextResponse.json(
        { success: false, error: "Exercise is not active" },
        { status: 400 }
      );
    }

    // Check for existing in-progress attempt
    const existingAttempt = await prisma.exerciseAttempt.findFirst({
      where: {
        studentId: user.id,
        exerciseId,
        status: "IN_PROGRESS",
      },
    });

    if (existingAttempt) {
      return NextResponse.json({
        success: true,
        data: existingAttempt,
        message: "Resuming existing attempt",
      });
    }

    // Create new attempt
    const attempt = await prisma.exerciseAttempt.create({
      data: {
        studentId: user.id,
        exerciseId,
        sessionEnrollmentId,
        homeworkAssignmentId,
        answers: [],
        maxScore: exercise.maxScore,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        autoGraded: false,
      },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            exerciseType: true,
            maxScore: true,
            timeLimit: true,
          },
        },
      },
    });

    // Update session activity if in a session
    if (sessionEnrollmentId) {
      await prisma.studentSessionActivity.create({
        data: {
          enrollmentId: sessionEnrollmentId,
          exerciseId,
          status: "WORKING",
          startedAt: new Date(),
          progressPct: 0,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: attempt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error starting exercise:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start exercise" },
      { status: 500 }
    );
  }
}
