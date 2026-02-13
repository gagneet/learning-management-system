import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/students/:id/next-content - Get next recommended content for student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: studentId } = await params;
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const sessionEnrollmentId = searchParams.get("sessionEnrollmentId");

  // Authorization
  if (user.role === "STUDENT" && user.id !== studentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (user.role === "PARENT") {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { parentId: true },
    });

    if (student?.parentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (!courseId) {
    return NextResponse.json(
      { success: false, error: "courseId is required" },
      { status: 400 }
    );
  }

  try {
    // Get student's subject assessment for this course
    const assessment = await prisma.subjectAssessment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      select: {
        assessedGradeLevel: true,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No assessment found for this student and course. Please complete an assessment first.",
        },
        { status: 404 }
      );
    }

    const assessedLevel = assessment.assessedGradeLevel;

    // Get all content units at the student's assessed level
    const contentUnits = await prisma.contentUnit.findMany({
      where: {
        courseId,
        gradeLevelId: {
          in: await prisma.gradeLevel
            .findMany({
              where: { level: assessedLevel },
              select: { id: true },
            })
            .then((levels) => levels.map((l) => l.id)),
        },
        isActive: true,
      },
      include: {
        lessons: {
          include: {
            exercises: {
              where: { isActive: true },
              select: {
                id: true,
                title: true,
                exerciseType: true,
                maxScore: true,
                timeLimit: true,
                difficulty: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        gradeLevel: {
          select: {
            level: true,
            label: true,
          },
        },
      },
      orderBy: { sequenceOrder: "asc" },
    });

    if (contentUnits.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No content available at assessed level ${assessedLevel}`,
        },
        { status: 404 }
      );
    }

    // Get student's completed exercises
    const completedAttempts = await prisma.exerciseAttempt.findMany({
      where: {
        studentId,
        status: {
          in: ["AUTO_GRADED", "GRADED"],
        },
      },
      select: {
        exerciseId: true,
        score: true,
      },
    });

    const completedExerciseIds = new Set(
      completedAttempts.map((a) => a.exerciseId)
    );

    // Get in-progress exercises
    const inProgressAttempts = await prisma.exerciseAttempt.findMany({
      where: {
        studentId,
        status: "IN_PROGRESS",
      },
      select: {
        exerciseId: true,
        startedAt: true,
      },
    });

    // Find next content to work on
    let nextLesson = null;
    let nextExercise = null;
    let unitProgress = null;

    // Strategy: Find first incomplete exercise in order
    for (const unit of contentUnits) {
      const totalExercises = unit.lessons.reduce(
        (sum, lesson) => sum + lesson.exercises.length,
        0
      );
      const completedInUnit = unit.lessons.reduce(
        (sum, lesson) =>
          sum +
          lesson.exercises.filter((ex) => completedExerciseIds.has(ex.id))
            .length,
        0
      );

      unitProgress = {
        unitId: unit.id,
        unitTitle: unit.title,
        totalExercises,
        completedExercises: completedInUnit,
        progressPct:
          totalExercises > 0 ? (completedInUnit / totalExercises) * 100 : 0,
      };

      // Look for incomplete exercises
      for (const lesson of unit.lessons) {
        for (const exercise of lesson.exercises) {
          if (!completedExerciseIds.has(exercise.id)) {
            nextLesson = {
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              order: lesson.order,
            };
            nextExercise = exercise;
            break;
          }
        }
        if (nextExercise) break;
      }
      if (nextExercise) break;
    }

    // If no incomplete exercises, student has completed this level
    if (!nextExercise) {
      return NextResponse.json({
        success: true,
        data: {
          status: "LEVEL_COMPLETE",
          message: `Congratulations! You've completed all exercises at Grade ${assessedLevel}.`,
          assessedLevel,
          recommendation:
            "Consider requesting a reassessment to move to the next level.",
        },
      });
    }

    // Check if there's an in-progress attempt for this exercise
    const resumeAttempt = inProgressAttempts.find(
      (a) => a.exerciseId === nextExercise.id
    );

    // Get recent performance metrics
    const recentAttempts = await prisma.exerciseAttempt.findMany({
      where: {
        studentId,
        status: {
          in: ["AUTO_GRADED", "GRADED"],
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 5,
      select: {
        score: true,
        exercise: {
          select: {
            maxScore: true,
          },
        },
      },
    });

    const recentPerformance =
      recentAttempts.length > 0
        ? recentAttempts.reduce(
            (sum, a) =>
              sum + (a.exercise.maxScore > 0 && a.score !== null ? a.score / a.exercise.maxScore : 0),
            0
          ) / recentAttempts.length
        : null;

    return NextResponse.json({
      success: true,
      data: {
        status: "CONTENT_AVAILABLE",
        assessedLevel,
        unitProgress,
        nextLesson,
        nextExercise,
        resumeAttempt: resumeAttempt
          ? {
              attemptId: resumeAttempt.exerciseId,
              startedAt: resumeAttempt.startedAt,
            }
          : null,
        metrics: {
          totalCompleted: completedExerciseIds.size,
          inProgress: inProgressAttempts.length,
          recentPerformance:
            recentPerformance !== null
              ? Math.round(recentPerformance * 100)
              : null,
        },
      },
    });
  } catch (error) {
    console.error("Error getting next content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get next content" },
      { status: 500 }
    );
  }
}
