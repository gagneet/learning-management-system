import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/v1/exercises/:id/submit - Submit an exercise attempt
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

  // Only students can submit exercises (or admins for testing)
  if (!["STUDENT", "SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { attemptId, answers, timeSpent } = body;

    // Validation
    if (!attemptId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        {
          success: false,
          error: "attemptId and answers array are required",
        },
        { status: 400 }
      );
    }

    // Get the attempt
    const attempt = await prisma.exerciseAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            exerciseType: true,
            expectedAnswers: true,
            maxScore: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Attempt not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (attempt.studentId !== user.id && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify attempt is in progress
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          success: false,
          error: "Attempt is not in progress",
        },
        { status: 400 }
      );
    }

    // Verify exercise ID matches
    if (attempt.exerciseId !== exerciseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Exercise ID mismatch",
        },
        { status: 400 }
      );
    }

    // Determine if auto-gradable
    const autoGradableTypes = ["MULTIPLE_CHOICE", "FILL_IN_BLANK", "NUMERICAL"];
    const isAutoGradable = autoGradableTypes.includes(
      attempt.exercise.exerciseType
    );

    let score = 0;
    let status: "AUTO_GRADED" | "SUBMITTED" = "SUBMITTED";

    // Auto-grading logic
    if (isAutoGradable && attempt.exercise.expectedAnswers) {
      const expectedAnswers = attempt.exercise.expectedAnswers as any[];

      // Calculate score by comparing answers
      answers.forEach((answer: any, index: number) => {
        const expected = expectedAnswers[index];
        if (!expected) return;

        let isCorrect = false;

        if (attempt.exercise.exerciseType === "MULTIPLE_CHOICE") {
          // Compare selected option
          isCorrect = answer.selectedOption === expected.correctOption;
        } else if (attempt.exercise.exerciseType === "FILL_IN_BLANK") {
          // Compare text answer (case-insensitive, trimmed)
          const studentAnswer = (answer.answer || "").trim().toLowerCase();
          const correctAnswer = (expected.correctAnswer || "")
            .trim()
            .toLowerCase();
          isCorrect = studentAnswer === correctAnswer;
        } else if (attempt.exercise.exerciseType === "NUMERICAL") {
          // Compare numerical answer with tolerance
          const studentAnswer = parseFloat(answer.answer);
          const correctAnswer = parseFloat(expected.correctAnswer);
          const tolerance = expected.tolerance || 0.01;

          if (!isNaN(studentAnswer) && !isNaN(correctAnswer)) {
            isCorrect =
              Math.abs(studentAnswer - correctAnswer) <= tolerance;
          }
        }

        if (isCorrect) {
          score += expected.points || 1;
        }
      });

      status = "AUTO_GRADED";
    }

    // Update the attempt
    const updatedAttempt = await prisma.exerciseAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score: isAutoGradable ? score : null,
        status,
        autoGraded: isAutoGradable,
        timeSpent: timeSpent || 0,
        submittedAt: new Date(),
      },
      include: {
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

    // Update session activity if applicable
    if (attempt.sessionEnrollmentId) {
      await prisma.studentSessionActivity.updateMany({
        where: {
          enrollmentId: attempt.sessionEnrollmentId,
          exerciseId: attempt.exerciseId,
          status: "WORKING",
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          progressPct: 100,
        },
      });
    }

    // Update homework assignment if applicable
    if (attempt.homeworkAssignmentId) {
      // Check if all exercises in the homework are completed
      const allAttempts = await prisma.exerciseAttempt.findMany({
        where: {
          homeworkAssignmentId: attempt.homeworkAssignmentId,
        },
        select: {
          status: true,
        },
      });

      const allCompleted = allAttempts.every((a) =>
        ["AUTO_GRADED", "GRADED", "SUBMITTED"].includes(a.status)
      );

      if (allCompleted) {
        await prisma.homeworkAssignment.update({
          where: { id: attempt.homeworkAssignmentId },
          data: {
            status: "SUBMITTED",
            submittedAt: new Date(),
          },
        });
      }
    }

    // Award XP if auto-graded and student passed
    if (isAutoGradable && score > 0) {
      const percentageScore = (score / attempt.exercise.maxScore) * 100;

      // Award XP based on performance
      let xpToAward = 0;
      if (percentageScore >= 90) {
        xpToAward = 50; // Excellent
      } else if (percentageScore >= 70) {
        xpToAward = 30; // Good
      } else if (percentageScore >= 50) {
        xpToAward = 15; // Pass
      }

      if (xpToAward > 0) {
        await prisma.xPTransaction.create({
          data: {
            userId: user.id,
            amount: xpToAward,
            description: `Completed exercise: ${attempt.exercise.title}`,
            source: "EXERCISE_COMPLETE",
          },
        });

        // Update user's total XP
        await prisma.gamificationProfile.update({
          where: { userId: user.id },
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
      data: {
        attempt: updatedAttempt,
        autoGraded: isAutoGradable,
        score: isAutoGradable ? score : null,
        maxScore: attempt.exercise.maxScore,
        percentageScore: isAutoGradable
          ? (score / attempt.exercise.maxScore) * 100
          : null,
      },
    });
  } catch (error) {
    console.error("Error submitting exercise:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit exercise" },
      { status: 500 }
    );
  }
}
