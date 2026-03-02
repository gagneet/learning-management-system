import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, hasAnyPermission, Permissions } from "@/lib/rbac";

// GET /api/v1/student-placements/:id - Get single placement with full details
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
    const placement = await prisma.studentAgeAssessment.findUnique({
      where: { id: placementId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            centerId: true,
            parentId: true,
          },
        },
        currentAge: {
          select: {
            id: true,
            ageYear: true,
            ageMonth: true,
            displayLabel: true,
            australianYear: true,
            isActive: true,
          },
        },
        initialAge: {
          select: {
            id: true,
            ageYear: true,
            ageMonth: true,
            displayLabel: true,
            australianYear: true,
          },
        },
        placedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        lessonCompletions: {
          include: {
            lesson: {
              select: {
                id: true,
                subject: true,
                lessonNumber: true,
                title: true,
                difficultyScore: true,
                estimatedMinutes: true,
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
        },
        promotionAttempts: {
          include: {
            promotionTest: {
              select: {
                id: true,
                title: true,
                subject: true,
                passingScore: true,
                excellenceScore: true,
                totalMarks: true,
              },
            },
            promotedToAge: {
              select: {
                id: true,
                ageYear: true,
                ageMonth: true,
                displayLabel: true,
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
          orderBy: { startedAt: "desc" },
          take: 3,
        },
        historyLog: {
          include: {
            fromAge: {
              select: {
                id: true,
                ageYear: true,
                ageMonth: true,
                displayLabel: true,
              },
            },
            toAge: {
              select: {
                id: true,
                ageYear: true,
                ageMonth: true,
                displayLabel: true,
              },
            },
            changedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
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

    // Role-based access: STUDENT can only see own placements
    if (user.role === "STUDENT" && placement.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // PARENT can only see their children's placements
    if (user.role === "PARENT") {
      const isChild = placement.student?.parentId === user.id;
      if (!isChild) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: placement });
  } catch (error) {
    console.error("Error fetching student placement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student placement" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/student-placements/:id - Update a student placement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, Permissions.STUDENT_PLACEMENT_CREATE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user } = session;
  const { id: placementId } = await params;

  try {
    // Fetch the existing placement
    const existing = await prisma.studentAgeAssessment.findUnique({
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

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Placement not found" },
        { status: 404 }
      );
    }

    // Multi-tenancy check
    if (user.role !== "SUPER_ADMIN" && existing.centreId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      ageYear,
      ageMonth,
      currentLessonNumber,
      status,
      readyForPromotion,
      placementNotes,
    } = body;

    const updateData: Record<string, unknown> = {};
    let newAssessmentAge: { id: string; ageYear: number; ageMonth: number; displayLabel: string } | null = null;

    // If ageYear/ageMonth provided, resolve the AssessmentAge
    if (ageYear !== undefined || ageMonth !== undefined) {
      const targetYear =
        ageYear !== undefined ? parseInt(ageYear, 10) : existing.currentAge.ageYear;
      const targetMonth =
        ageMonth !== undefined ? parseInt(ageMonth, 10) : existing.currentAge.ageMonth;

      newAssessmentAge = await prisma.assessmentAge.findFirst({
        where: { ageYear: targetYear, ageMonth: targetMonth },
        select: {
          id: true,
          ageYear: true,
          ageMonth: true,
          displayLabel: true,
        },
      });

      if (!newAssessmentAge) {
        return NextResponse.json(
          {
            success: false,
            error: `No assessment age level found for ${targetYear}.${targetMonth}`,
          },
          { status: 404 }
        );
      }

      updateData.currentAgeId = newAssessmentAge.id;
    }

    if (currentLessonNumber !== undefined) {
      const parsedLesson = parseInt(currentLessonNumber, 10);
      if (isNaN(parsedLesson) || parsedLesson < 1 || parsedLesson > 25) {
        return NextResponse.json(
          { success: false, error: "currentLessonNumber must be between 1 and 25" },
          { status: 400 }
        );
      }
      updateData.currentLessonNumber = parsedLesson;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (placementNotes !== undefined) {
      updateData.placementNotes = placementNotes;
    }

    // Recalculate readyForPromotion if lessonsCompleted >= 25
    if (readyForPromotion !== undefined) {
      updateData.readyForPromotion = Boolean(readyForPromotion);
    } else if (existing.lessonsCompleted >= 25) {
      updateData.readyForPromotion = true;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    // If the age level is changing, create a history record
    const isLevelChange =
      newAssessmentAge !== null && newAssessmentAge.id !== existing.currentAgeId;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.studentAgeAssessment.update({
        where: { id: placementId },
        data: updateData,
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
          currentAge: {
            select: {
              id: true,
              ageYear: true,
              ageMonth: true,
              displayLabel: true,
            },
          },
          placedBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      if (isLevelChange && newAssessmentAge) {
        await tx.ageAssessmentHistory.create({
          data: {
            studentId: existing.studentId,
            placementId,
            subject: existing.subject,
            fromAgeId: existing.currentAgeId,
            toAgeId: newAssessmentAge.id,
            changeType: "MANUAL_OVERRIDE",
            reason: placementNotes ?? "Manual level update",
            testScore: null,
            changedById: user.id,
            centreId: existing.centreId,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating student placement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update student placement" },
      { status: 500 }
    );
  }
}
