import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, hasAnyPermission, Permissions } from "@/lib/rbac";

// GET /api/v1/student-placements - List student placements for the centre
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Must have either a broad view permission or the own-data permission
  const canViewAll = hasPermission(session, Permissions.ASSESSMENT_GRID_VIEW);
  const canViewOwn = hasPermission(session, Permissions.STUDENT_PLACEMENT_VIEW_OWN);

  if (!canViewAll && !canViewOwn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const studentIdParam = searchParams.get("studentId");
  const subject = searchParams.get("subject");
  const status = searchParams.get("status");

  try {
    const where: Record<string, unknown> = {};

    // Multi-tenancy: scope by centre unless SUPER_ADMIN
    if (user.role !== "SUPER_ADMIN") {
      where.centreId = user.centerId;
    }

    // Role-based scoping
    if (user.role === "STUDENT") {
      // Students can only see their own placements
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      // Parents can only see their children's placements
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      const childIds = children.map((c: { id: string }) => c.id);

      if (studentIdParam && childIds.includes(studentIdParam)) {
        where.studentId = studentIdParam;
      } else if (studentIdParam) {
        // Requested a student that isn't their child
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else {
        where.studentId = { in: childIds };
      }
    } else if (studentIdParam) {
      // Staff/admin can filter by a specific student
      where.studentId = studentIdParam;
    }

    if (subject) {
      where.subject = subject;
    }

    if (status) {
      where.status = status;
    }

    const placements = await prisma.studentAgeAssessment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        currentAge: {
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
      },
      orderBy: [{ student: { name: "asc" } }, { subject: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: placements,
      total: placements.length,
    });
  } catch (error) {
    console.error("Error fetching student placements:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student placements" },
      { status: 500 }
    );
  }
}

// POST /api/v1/student-placements - Place a student at an assessment age level
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, Permissions.STUDENT_PLACEMENT_CREATE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user } = session;

  try {
    const body = await request.json();
    const {
      studentId,
      subject,
      ageYear,
      ageMonth,
      placementMethod,
      placementNotes,
    } = body;

    // Validate required fields
    if (!studentId || !subject || ageYear === undefined || ageMonth === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "studentId, subject, ageYear, and ageMonth are required",
        },
        { status: 400 }
      );
    }

    // Validate the student exists, is a STUDENT role, and is in the same centre
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, centerId: true, name: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "User is not a student" },
        { status: 400 }
      );
    }

    // Enforce same-centre check (unless SUPER_ADMIN)
    if (user.role !== "SUPER_ADMIN" && student.centerId !== user.centerId) {
      return NextResponse.json(
        { success: false, error: "Student does not belong to this centre" },
        { status: 403 }
      );
    }

    // Find the AssessmentAge by ageYear and ageMonth
    const parsedYear = parseInt(ageYear, 10);
    const parsedMonth = parseInt(ageMonth, 10);

    const assessmentAge = await prisma.assessmentAge.findFirst({
      where: { ageYear: parsedYear, ageMonth: parsedMonth },
    });

    if (!assessmentAge) {
      return NextResponse.json(
        {
          success: false,
          error: `No assessment age level found for ${parsedYear}.${parsedMonth}`,
        },
        { status: 404 }
      );
    }

    // Check for existing placement for this student + subject
    const existingPlacement = await prisma.studentAgeAssessment.findFirst({
      where: {
        studentId,
        subject,
        status: { not: "ARCHIVED" },
      },
    });

    if (existingPlacement) {
      return NextResponse.json(
        {
          success: false,
          error: `Student already has an active placement for ${subject}`,
        },
        { status: 409 }
      );
    }

    // Determine the centreId to use (from session, respecting SUPER_ADMIN cross-centre)
    const centreId = user.role === "SUPER_ADMIN" ? student.centerId! : user.centerId!;

    // Create the placement and history record in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const placement = await tx.studentAgeAssessment.create({
        data: {
          studentId,
          subject,
          currentAgeId: assessmentAge.id,
          initialAgeId: assessmentAge.id,
          currentLessonNumber: 1,
          lessonsCompleted: 0,
          placedById: user.id,
          placedAt: new Date(),
          placementMethod: placementMethod ?? "MANUAL",
          placementNotes: placementNotes ?? null,
          status: "ACTIVE",
          readyForPromotion: false,
          centreId,
        },
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
            select: { id: true, name: true },
          },
        },
      });

      // Create initial history record
      await tx.ageAssessmentHistory.create({
        data: {
          studentId,
          placementId: placement.id,
          subject,
          fromAgeId: null,
          toAgeId: assessmentAge.id,
          changeType: "INITIAL_PLACEMENT",
          reason: placementNotes ?? "Initial placement",
          testScore: null,
          changedById: user.id,
          centreId,
        },
      });

      return placement;
    });

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating student placement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create student placement" },
      { status: 500 }
    );
  }
}
