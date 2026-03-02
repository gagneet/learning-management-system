import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission, Permissions } from "@/lib/rbac";
import { NOTIFICATION_TEMPLATES } from "@/lib/notifications";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the next AssessmentAge that is `monthsAhead` calendar months
 * ahead of the given (ageYear, ageMonth) combination.
 *
 * AssessmentAge months are stored as 1–12 within a year, so we roll over at 12.
 */
async function findNextAssessmentAge(
  currentAgeYear: number,
  currentAgeMonth: number,
  monthsAhead: number
): Promise<{ id: string; ageYear: number; ageMonth: number; displayLabel: string } | null> {
  let targetMonth = currentAgeMonth + monthsAhead;
  let targetYear = currentAgeYear;

  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }

  return prisma.assessmentAge.findFirst({
    where: { ageYear: targetYear, ageMonth: targetMonth, isActive: true },
    select: {
      id: true,
      ageYear: true,
      ageMonth: true,
      displayLabel: true,
    },
  });
}

/**
 * Auto-grade a set of student answers against the promotion test questions.
 * Returns { score, percentageScore }.
 *
 * Each question in the test's `questions` JSON array is expected to have:
 *   { id, text, type, options?, correctAnswer?, marks }
 *
 * Each student answer is expected to have:
 *   { questionId, answer }
 */
function autoGrade(
  questions: any[],
  answers: any[],
  totalMarks: number
): { score: number; percentageScore: number; gradedAnswers: any[] } {
  const answerMap = new Map<string, string>(
    answers.map((a: any) => [a.questionId, a.answer])
  );

  let rawScore = 0;
  const gradedAnswers: any[] = [];

  for (const question of questions) {
    const studentAnswer = answerMap.get(question.id) ?? null;
    const correctAnswer = question.correctAnswer ?? null;
    const marks = question.marks ?? question.points ?? 1;

    let isCorrect = false;

    if (studentAnswer !== null && correctAnswer !== null) {
      // Normalise to string and compare case-insensitively
      const normalised = String(studentAnswer).trim().toLowerCase();
      const expected = String(correctAnswer).trim().toLowerCase();
      isCorrect = normalised === expected;
    }

    const marksAwarded = isCorrect ? marks : 0;
    rawScore += marksAwarded;

    gradedAnswers.push({
      questionId: question.id,
      answer: studentAnswer,
      isCorrect,
      marksAwarded,
      correctAnswer,
    });
  }

  const percentageScore =
    totalMarks > 0 ? Math.round((rawScore / totalMarks) * 100 * 10) / 10 : 0;

  return { score: rawScore, percentageScore, gradedAnswers };
}

// ---------------------------------------------------------------------------
// GET /api/v1/promotion-tests/:id/attempts
// ---------------------------------------------------------------------------

/**
 * List attempts for a promotion test.
 *
 * - STUDENT: only their own attempts are returned (no permission check beyond auth).
 * - TEACHER / ADMIN (STUDENT_PLACEMENT_VIEW): all attempts for the test, with
 *   student information included.
 * - PARENT (STUDENT_PLACEMENT_VIEW_OWN): attempts for their children.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: promotionTestId } = await params;

  const canViewAll = hasPermission(session, Permissions.STUDENT_PLACEMENT_VIEW);
  const canViewOwn = hasPermission(
    session,
    Permissions.STUDENT_PLACEMENT_VIEW_OWN
  );

  if (!canViewAll && !canViewOwn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Verify the promotion test exists
    const test = await prisma.agePromotionTest.findUnique({
      where: { id: promotionTestId },
      select: { id: true },
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: "Promotion test not found" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = {
      promotionTestId,
    };

    // Multi-tenancy: always scope by centreId for non-super-admin
    if (user.role !== "SUPER_ADMIN") {
      where.centreId = user.centerId;
    }

    // Role-based scoping of which attempts are visible
    if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      // Parents may only see attempts belonging to their children
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      const childIds = children.map((c: { id: string }) => c.id);
      where.studentId = { in: childIds };
    }
    // TEACHER / ADMIN with STUDENT_PLACEMENT_VIEW may see all attempts in centre

    const attempts = await prisma.agePromotionAttempt.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        placement: {
          select: {
            id: true,
            subject: true,
            currentLessonNumber: true,
            lessonsCompleted: true,
            status: true,
          },
        },
        gradedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    // For STUDENT role: remove correctAnswer from answers array
    const responseAttempts =
      user.role === "STUDENT"
        ? attempts.map((attempt) => ({
            ...attempt,
            answers: Array.isArray(attempt.answers)
              ? (attempt.answers as any[]).map(
                  ({ correctAnswer: _ca, ...rest }: any) => rest
                )
              : attempt.answers,
          }))
        : attempts;

    return NextResponse.json({
      success: true,
      data: responseAttempts,
      total: responseAttempts.length,
    });
  } catch (error) {
    console.error("Error listing promotion test attempts:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/promotion-tests/:id/attempts
// ---------------------------------------------------------------------------

/**
 * Submit a promotion test attempt.
 *
 * Body:
 *   placementId  (required) - StudentAgeAssessment.id
 *   studentId?   (optional) - required when a TEACHER submits on behalf of student
 *   answers      (required) - [{questionId, answer}]
 *
 * Validation:
 *   - The placement must exist, be ACTIVE, and readyForPromotion must be true.
 *   - If the submitting user is a STUDENT, studentId is inferred from session.
 *   - If the submitting user is a TEACHER/ADMIN, studentId must be provided.
 *
 * Auto-grading:
 *   - Performed immediately if test.isAutoGraded is true.
 *   - Outcome: PROMOTED (>= passingScore), LEVEL_SKIPPED (>= excellenceScore), FAILED (< passingScore).
 *   - If PROMOTED: advance 1 month in AssessmentAge.
 *   - If LEVEL_SKIPPED: advance 2 months in AssessmentAge.
 *   - Creates AgeAssessmentHistory record on promotion.
 *   - Awards XP to student on promotion (QUIZ_PERFECT if LEVEL_SKIPPED, QUIZ_COMPLETION if PROMOTED).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: promotionTestId } = await params;

  // Only students can self-submit; teachers/admins may submit on behalf of students
  const isStudent = user.role === "STUDENT";
  const isStaff = [
    "SUPER_ADMIN",
    "CENTER_ADMIN",
    "CENTER_SUPERVISOR",
    "TEACHER",
  ].includes(user.role);

  if (!isStudent && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { placementId, studentId: bodyStudentId, answers } = body;

    // Determine the actual studentId
    const studentId = isStudent ? user.id : bodyStudentId;

    // Validate required fields
    if (!placementId || !studentId || !answers) {
      return NextResponse.json(
        {
          success: false,
          error: isStudent
            ? "placementId and answers are required"
            : "placementId, studentId, and answers are required",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: "answers must be a non-empty array" },
        { status: 400 }
      );
    }

    // Fetch the promotion test
    const test = await prisma.agePromotionTest.findUnique({
      where: { id: promotionTestId },
      include: {
        assessmentAge: {
          select: {
            id: true,
            ageYear: true,
            ageMonth: true,
            displayLabel: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: "Promotion test not found" },
        { status: 404 }
      );
    }

    if (!test.isActive) {
      return NextResponse.json(
        { success: false, error: "This promotion test is not currently active" },
        { status: 400 }
      );
    }

    // Fetch and validate the placement
    const placement = await prisma.studentAgeAssessment.findUnique({
      where: { id: placementId },
      include: {
        currentAge: {
          select: {
            id: true,
            ageYear: true,
            ageMonth: true,
            displayLabel: true,
          },
        },
      },
    });

    if (!placement) {
      return NextResponse.json(
        { success: false, error: "Placement not found" },
        { status: 404 }
      );
    }

    // Ownership check: the placement must belong to the correct student
    if (placement.studentId !== studentId) {
      return NextResponse.json(
        { success: false, error: "Placement does not belong to this student" },
        { status: 400 }
      );
    }

    // Multi-tenancy guard for staff submissions
    if (isStaff && user.role !== "SUPER_ADMIN") {
      if (placement.centreId !== user.centerId) {
        return NextResponse.json(
          {
            success: false,
            error: "Placement does not belong to your centre",
          },
          { status: 403 }
        );
      }
    }

    // The placement must be ACTIVE
    if (placement.status !== "ACTIVE" && placement.status !== "PROMOTION_PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Placement is not active (current status: ${placement.status})`,
        },
        { status: 400 }
      );
    }

    // The student must have completed all 25 lessons (readyForPromotion flag)
    if (!placement.readyForPromotion) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Student has not completed all required lessons for this level and is not ready for promotion",
        },
        { status: 400 }
      );
    }

    // Determine centreId for the attempt record
    const centreId =
      user.role === "SUPER_ADMIN" ? placement.centreId : user.centerId!;

    // ---------------------------------------------------------------------------
    // Create the initial attempt record
    // ---------------------------------------------------------------------------
    let attempt = await prisma.agePromotionAttempt.create({
      data: {
        studentId,
        placementId,
        promotionTestId,
        answers,
        outcome: "PENDING",
        startedAt: new Date(),
        submittedAt: new Date(),
        centreId,
      },
    });

    // ---------------------------------------------------------------------------
    // Auto-grading (if test.isAutoGraded)
    // ---------------------------------------------------------------------------
    if (test.isAutoGraded) {
      const questions = test.questions as any[];
      const { score, percentageScore, gradedAnswers } = autoGrade(
        questions,
        answers,
        test.totalMarks
      );

      // Determine outcome
      let outcome: "PROMOTED" | "LEVEL_SKIPPED" | "FAILED" | "BORDERLINE";

      if (percentageScore >= test.excellenceScore) {
        outcome = "LEVEL_SKIPPED";
      } else if (percentageScore >= test.passingScore) {
        outcome = "PROMOTED";
      } else {
        outcome = "FAILED";
      }

      // Determine the next age level if promoted
      let nextAge: { id: string; ageYear: number; ageMonth: number; displayLabel: string } | null =
        null;

      if (outcome === "PROMOTED" || outcome === "LEVEL_SKIPPED") {
        const monthsAhead = outcome === "LEVEL_SKIPPED" ? 2 : 1;
        nextAge = await findNextAssessmentAge(
          placement.currentAge.ageYear,
          placement.currentAge.ageMonth,
          monthsAhead
        );
      }

      // Run all state updates in a transaction
      const updated = await prisma.$transaction(async (tx) => {
        // Update the attempt with grading results
        const gradedAttempt = await tx.agePromotionAttempt.update({
          where: { id: attempt.id },
          data: {
            answers: gradedAnswers,
            score,
            percentageScore,
            outcome,
            promotedToAgeId: nextAge?.id ?? null,
            gradedAt: new Date(),
          },
        });

        if ((outcome === "PROMOTED" || outcome === "LEVEL_SKIPPED") && nextAge) {
          // Advance the student's placement to the next assessment age
          await tx.studentAgeAssessment.update({
            where: { id: placementId },
            data: {
              currentAgeId: nextAge.id,
              currentLessonNumber: 1,
              lessonsCompleted: 0,
              readyForPromotion: false,
              status: "ACTIVE",
              placedAt: new Date(),
              placedById: user.id,
            },
          });

          // Record the promotion in the audit history
          await tx.ageAssessmentHistory.create({
            data: {
              studentId,
              placementId,
              subject: placement.subject,
              fromAgeId: placement.currentAge.id,
              toAgeId: nextAge.id,
              changeType: outcome === "LEVEL_SKIPPED" ? "LEVEL_SKIPPED" : "PROMOTED",
              reason: `Auto-graded promotion test. Score: ${percentageScore}%`,
              testScore: score,
              changedById: user.id,
              centreId,
            },
          });

          // Award XP to the student
          const xpSource =
            outcome === "LEVEL_SKIPPED" ? "QUIZ_PERFECT" : "QUIZ_COMPLETION";
          const xpAmount = outcome === "LEVEL_SKIPPED" ? 100 : 50;

          await tx.xPTransaction.create({
            data: {
              userId: studentId,
              amount: xpAmount,
              source: xpSource,
              sourceId: gradedAttempt.id,
              description:
                outcome === "LEVEL_SKIPPED"
                  ? `Level skipped! Promoted from ${placement.currentAge.displayLabel} to ${nextAge.displayLabel}`
                  : `Promoted from ${placement.currentAge.displayLabel} to ${nextAge.displayLabel}`,
            },
          });

          // Update gamification profile XP totals
          await tx.gamificationProfile.updateMany({
            where: { userId: studentId },
            data: {
              xp: { increment: xpAmount },
              totalXP: { increment: xpAmount },
            },
          });
        }

        return gradedAttempt;
      });

      attempt = updated;
    }

    // ── Notify student of promotion outcome ─────────────────────────────────
    if (attempt.outcome === "PROMOTED" || attempt.outcome === "LEVEL_SKIPPED") {
      try {
        // Fetch placement for fromLevel/toLevel info
        const promotionPlacement = await prisma.studentAgeAssessment.findUnique({
          where: { id: attempt.placementId },
          select: {
            subject: true,
            currentAge: { select: { displayLabel: true } },
            initialAge: { select: { displayLabel: true } },
          },
        });
        const tmpl = NOTIFICATION_TEMPLATES['ASSESSMENT_PROMOTED'];
        const notifData = {
          subject:   promotionPlacement?.subject ?? "",
          fromLevel: attempt.outcome === "LEVEL_SKIPPED" ? "previous level" : (promotionPlacement?.initialAge?.displayLabel ?? "previous level"),
          toLevel:   promotionPlacement?.currentAge?.displayLabel ?? "new level",
        };
        await prisma.notification.create({
          data: {
            type:     'ASSESSMENT_PROMOTED',
            userId:   attempt.studentId,
            title:    tmpl.title,
            message:  tmpl.getMessage(notifData),
            link:     tmpl.getLink?.(notifData) ?? null,
            priority: tmpl.priority,
            read:     false,
            data:     notifData,
          },
        });
      } catch {
        /* non-critical — swallow notification errors */
      }
    }

    // Reload the attempt with relations for the response
    const fullAttempt = await prisma.agePromotionAttempt.findUnique({
      where: { id: attempt.id },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        placement: {
          select: {
            id: true,
            subject: true,
            currentLessonNumber: true,
            lessonsCompleted: true,
            status: true,
            readyForPromotion: true,
            currentAge: {
              select: {
                id: true,
                ageYear: true,
                ageMonth: true,
                displayLabel: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: fullAttempt },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting promotion test attempt:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
