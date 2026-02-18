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
    // ⚡ Bolt Optimization: Parallelize assessment and attempt fetching
    // ⚡ Bolt Optimization: Consolidate multiple ExerciseAttempt queries into one to reduce RTT
    const [assessment, allAttempts] = await Promise.all([
      prisma.subjectAssessment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId,
          },
        },
        select: {
          assessedGradeLevel: true,
        },
      }),
      prisma.exerciseAttempt.findMany({
        where: {
          studentId,
          status: {
            in: ["AUTO_GRADED", "GRADED", "IN_PROGRESS"],
          },
        },
        select: {
          id: true,
          exerciseId: true,
          status: true,
          score: true,
          startedAt: true,
          submittedAt: true,
          exercise: {
            select: {
              maxScore: true,
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      }),
    ]);

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

    // ⚡ Bolt Optimization: Use nested relation filter instead of sequential sub-query
    // This reduces database round-trips and allows the database to optimize the join.
    const contentUnits = await prisma.contentUnit.findMany({
      where: {
        courseId,
        gradeLevel: {
          level: assessedLevel,
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

    // ⚡ Bolt Optimization: Process attempts in-memory from the consolidated query
    const completedExerciseIds = new Set<string>();
    const inProgressAttempts: any[] = [];
    const recentGradedAttempts: any[] = [];

    allAttempts.forEach((attempt) => {
      if (attempt.status === "IN_PROGRESS") {
        inProgressAttempts.push(attempt);
      } else {
        // COMPLETED (AUTO_GRADED or GRADED)
        completedExerciseIds.add(attempt.exerciseId);
        // Take the 5 most recent graded attempts for performance metrics
        if (recentGradedAttempts.length < 5) {
          recentGradedAttempts.push(attempt);
        }
      }
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

    // ⚡ Bolt Optimization: Calculate recent performance from in-memory data
    const recentPerformance =
      recentGradedAttempts.length > 0
        ? recentGradedAttempts.reduce(
            (sum, a) =>
              sum +
              (a.exercise.maxScore > 0 && a.score !== null
                ? a.score / a.exercise.maxScore
                : 0),
            0
          ) / recentGradedAttempts.length
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
              // ⚡ Bolt Optimization: Return the actual attempt ID for correct resumption
              attemptId: resumeAttempt.id,
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
