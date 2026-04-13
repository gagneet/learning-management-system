import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, hasAnyPermission, Permissions } from "@/lib/rbac";
import { NOTIFICATION_TEMPLATES } from "@/lib/notifications";

// GET /api/v1/student-placements/:id/lesson-completions - Get lesson completions for a placement
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: placementId } = await params;

  const canViewAll = hasPermission(session, Permissions.STUDENT_PLACEMENT_VIEW);
  const canViewOwn = hasPermission(session, Permissions.STUDENT_PLACEMENT_VIEW_OWN);

  if (!canViewAll && !canViewOwn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch the placement to verify it exists and check access
    const placement = await prisma.studentAgeAssessment.findUnique({
      where: { id: placementId },
      select: {
        id: true,
        studentId: true,
        centreId: true,
        subject: true,
        student: {
          select: {
            parentId: true,
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

    // Multi-tenancy: non-SUPER_ADMIN must be in the same centre
    if (user.role !== "SUPER_ADMIN" && placement.centreId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // STUDENT: can only view their own placement completions
    if (user.role === "STUDENT" && placement.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // PARENT: can only view their children's completions
    if (user.role === "PARENT") {
      const isChild = placement.student?.parentId === user.id;
      if (!isChild) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const completions = await prisma.ageLessonCompletion.findMany({
      where: { placementId },
      include: {
        lesson: {
          select: {
            id: true,
            subject: true,
            lessonNumber: true,
            title: true,
            difficultyScore: true,
            estimatedMinutes: true,
            curriculumCode: true,
            strandArea: true,
          },
        },
        gradedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        lesson: { lessonNumber: "asc" },
      },
    });

    return NextResponse.json({
      success: true,
      data: completions,
      total: completions.length,
    });
  } catch (error) {
    console.error("Error fetching lesson completions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lesson completions" },
      { status: 500 }
    );
  }
}

// POST /api/v1/student-placements/:id/lesson-completions - Record or update a lesson completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: placementId } = await params;

  // Either a grader (teacher/admin) or the student themselves can submit
  const canGrade = hasPermission(session, Permissions.LESSON_GRADE);
  const canViewOwn = hasPermission(session, Permissions.STUDENT_PLACEMENT_VIEW_OWN);

  if (!canGrade && !canViewOwn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch the placement to verify it exists and check access
    const placement = await prisma.studentAgeAssessment.findUnique({
      where: { id: placementId },
      select: {
        id: true,
        studentId: true,
        centreId: true,
        subject: true,
        lessonsCompleted: true,
        readyForPromotion: true,
      },
    });

    if (!placement) {
      return NextResponse.json(
        { success: false, error: "Placement not found" },
        { status: 404 }
      );
    }

    // Multi-tenancy: non-SUPER_ADMIN must be in the same centre
    if (user.role !== "SUPER_ADMIN" && placement.centreId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // STUDENT: can only submit completions for their own placement, and cannot grade
    if (user.role === "STUDENT") {
      if (placement.studentId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { lessonId, status, score, feedback, timeSpentMinutes, sessionId } = body;

    // Validate required fields
    if (!lessonId || !status) {
      return NextResponse.json(
        { success: false, error: "lessonId and status are required" },
        { status: 400 }
      );
    }

    // Validate the lesson exists and belongs to the same subject/level as the placement
    const lesson = await prisma.ageAssessmentLesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        subject: true,
        lessonNumber: true,
        assessmentAgeId: true,
        difficultyScore: true,
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson not found" },
        { status: 404 }
      );
    }

    if (lesson.subject !== placement.subject) {
      return NextResponse.json(
        {
          success: false,
          error: `Lesson subject (${lesson.subject}) does not match placement subject (${placement.subject})`,
        },
        { status: 400 }
      );
    }

    // Determine grading fields - only teachers/admins can grade
    const isGrader = canGrade && user.role !== "STUDENT";

    // Build upsert data
    const completionData: Record<string, unknown> = {
      status,
      timeSpentMinutes: timeSpentMinutes ?? null,
      sessionId: sessionId ?? null,
    };

    if (score !== undefined) {
      completionData.score = score;
    }

    if (feedback !== undefined) {
      completionData.feedback = feedback;
    }

    // If status is MARKED (graded), record grading info
    if (status === "MARKED" && isGrader) {
      completionData.gradedById = user.id;
      completionData.gradedAt = new Date();
      if (!completionData.completedAt) {
        completionData.completedAt = new Date();
      }
    }

    // If student is submitting, mark startedAt/completedAt as appropriate
    if (status === "COMPLETED" || status === "SUBMITTED") {
      completionData.completedAt = new Date();
    }

    if (status === "IN_PROGRESS" && !completionData.startedAt) {
      completionData.startedAt = new Date();
    }

    // Upsert the lesson completion
    const completion = await prisma.ageLessonCompletion.upsert({
      where: {
        studentId_placementId_lessonId: {
          studentId: placement.studentId,
          placementId,
          lessonId,
        },
      },
      update: completionData,
      create: {
        studentId: placement.studentId,
        placementId,
        lessonId,
        centreId: placement.centreId,
        startedAt: new Date(),
        ...completionData,
      },
      include: {
        lesson: {
          select: {
            id: true,
            subject: true,
            lessonNumber: true,
            title: true,
            difficultyScore: true,
          },
        },
        gradedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // If the lesson is now MARKED or COMPLETED, update placement lessonsCompleted count
    // and check if all 25 lessons are done → set readyForPromotion = true
    if (status === "MARKED" || status === "COMPLETED") {
      // Count completed/marked lessons for this placement
      const completedCount = await prisma.ageLessonCompletion.count({
        where: {
          placementId,
          status: { in: ["MARKED", "COMPLETED"] },
        },
      });

      const placementUpdateData: Record<string, unknown> = {
        lessonsCompleted: completedCount,
      };

      const becameReady = completedCount >= 25 && !placement.readyForPromotion;
      if (becameReady) {
        placementUpdateData.readyForPromotion = true;
        placementUpdateData.status = "PROMOTION_PENDING";
      }

      await prisma.studentAgeAssessment.update({
        where: { id: placementId },
        data: placementUpdateData,
      });

      // ── Notify the placing teacher when student becomes ready for promotion ──
      if (becameReady) {
        const [updatedPlacement, studentUser] = await Promise.all([
          prisma.studentAgeAssessment.findUnique({
            where: { id: placementId },
            select: { placedById: true, currentAge: { select: { displayLabel: true, australianYear: true } } },
          }),
          prisma.user.findUnique({ where: { id: placement.studentId }, select: { name: true } }),
        ]);
        if (updatedPlacement?.placedById) {
          const tmpl = NOTIFICATION_TEMPLATES['ASSESSMENT_READY_FOR_PROMOTION'];
          const notifData = {
            studentName: studentUser?.name ?? "Student",
            studentId:   placement.studentId,
            subject:     placement.subject,
            levelLabel:  updatedPlacement.currentAge?.australianYear ?? updatedPlacement.currentAge?.displayLabel ?? placement.subject,
          };
          await prisma.notification.create({
            data: {
              type:     'ASSESSMENT_READY_FOR_PROMOTION',
              userId:   updatedPlacement.placedById,
              title:    tmpl.title,
              message:  tmpl.getMessage(notifData),
              link:     tmpl.getLink?.(notifData) ?? null,
              priority: tmpl.priority,
              read:     false,
              data:     notifData,
            },
          }).catch(() => {/* non-critical — swallow notification errors */});
        }
      }
    }

    // ── Notify tutor when student submits a lesson for marking ──────────────
    if (status === "SUBMITTED" && user.role === "STUDENT") {
      const [placingTeacher, studentUser] = await Promise.all([
        prisma.studentAgeAssessment.findUnique({
          where: { id: placementId },
          select: { placedById: true },
        }),
        prisma.user.findUnique({ where: { id: placement.studentId }, select: { name: true } }),
      ]);
      if (placingTeacher?.placedById) {
        const tmpl = NOTIFICATION_TEMPLATES['ASSESSMENT_LESSON_SUBMITTED'];
        const notifData = {
          studentName:  studentUser?.name ?? "Student",
          studentId:    placement.studentId,
          subject:      placement.subject,
          lessonTitle:  completion.lesson.title,
          lessonNumber: completion.lesson.lessonNumber,
        };
        await prisma.notification.create({
          data: {
            type:     'ASSESSMENT_LESSON_SUBMITTED',
            userId:   placingTeacher.placedById,
            title:    tmpl.title,
            message:  tmpl.getMessage(notifData),
            link:     tmpl.getLink?.(notifData) ?? null,
            priority: tmpl.priority,
            read:     false,
            data:     notifData,
          },
        }).catch(() => {/* non-critical */});
      }
    }

    return NextResponse.json(
      { success: true, data: completion },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording lesson completion:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record lesson completion" },
      { status: 500 }
    );
  }
}
