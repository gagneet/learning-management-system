import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/students/:id/assessments - Get all subject assessments for a student
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

  try {
    // Authorization: Teachers, Supervisors, Admins, Parents (own children), Students (self)
    if (user.role === "STUDENT" && user.id !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "PARENT") {
      // Check if this is their child
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { parentId: true },
      });

      if (student?.parentId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // For non-admins, enforce center scope
    if (!["SUPER_ADMIN"].includes(user.role)) {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { centerId: true },
      });

      if (student?.centerId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const assessments = await prisma.subjectAssessment.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        assessedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        profileLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            updatedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { lastAssessedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: assessments,
    });
  } catch (error) {
    console.error("Error fetching subject assessments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}

// POST /api/v1/students/:id/assessments - Create a new subject assessment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: studentId } = await params;

  // Only Assessors, Teachers, Supervisors, and Admins can create assessments
  if (!["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR", "TEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      courseId,
      assessedGradeLevel,
      readingAge,
      numeracyAge,
      comprehensionLevel,
      writingLevel,
      notes,
    } = body;

    // Validation
    if (!courseId || !assessedGradeLevel) {
      return NextResponse.json(
        {
          success: false,
          error: "courseId and assessedGradeLevel are required",
        },
        { status: 400 }
      );
    }

    if (assessedGradeLevel < 1 || assessedGradeLevel > 12) {
      return NextResponse.json(
        {
          success: false,
          error: "assessedGradeLevel must be between 1 and 12",
        },
        { status: 400 }
      );
    }

    // Check if assessment already exists
    const existing = await prisma.subjectAssessment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Assessment already exists for this student and course. Use PATCH to update.",
        },
        { status: 400 }
      );
    }

    // Create the assessment
    const assessment = await prisma.subjectAssessment.create({
      data: {
        studentId,
        courseId,
        assessedGradeLevel,
        readingAge,
        numeracyAge,
        comprehensionLevel,
        writingLevel,
        notes,
        assessedById: user.id,
        lastAssessedAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        assessedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Create initial profile log
    await prisma.academicProfileLog.create({
      data: {
        studentId,
        courseId,
        subjectAssessmentId: assessment.id,
        previousLevel: 0,
        newLevel: assessedGradeLevel,
        updateType: "DIAGNOSTIC_TEST",
        reason: notes || "Initial assessment",
        updatedById: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: assessment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating subject assessment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create assessment" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/students/:id/assessments - Update a subject assessment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: studentId } = await params;

  // Only Assessors, Teachers, Supervisors, and Admins can update assessments
  if (!["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR", "TEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      courseId,
      assessedGradeLevel,
      readingAge,
      numeracyAge,
      comprehensionLevel,
      writingLevel,
      notes,
      updateType, // ASSESSMENT_RESULT, TUTOR_OVERRIDE, DIAGNOSTIC_TEST, etc.
    } = body;

    if (!courseId) {
      return NextResponse.json(
        {
          success: false,
          error: "courseId is required",
        },
        { status: 400 }
      );
    }

    // Get existing assessment
    const existing = await prisma.subjectAssessment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Assessment not found. Use POST to create a new assessment.",
        },
        { status: 404 }
      );
    }

    // Update the assessment
    const updateData: any = {
      lastAssessedAt: new Date(),
      assessedById: user.id,
    };

    if (assessedGradeLevel !== undefined) updateData.assessedGradeLevel = assessedGradeLevel;
    if (readingAge !== undefined) updateData.readingAge = readingAge;
    if (numeracyAge !== undefined) updateData.numeracyAge = numeracyAge;
    if (comprehensionLevel !== undefined) updateData.comprehensionLevel = comprehensionLevel;
    if (writingLevel !== undefined) updateData.writingLevel = writingLevel;
    if (notes !== undefined) updateData.notes = notes;

    const assessment = await prisma.subjectAssessment.update({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        assessedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // If grade level changed, create a profile log
    if (assessedGradeLevel !== undefined && assessedGradeLevel !== existing.assessedGradeLevel) {
      await prisma.academicProfileLog.create({
        data: {
          studentId,
          courseId,
          subjectAssessmentId: existing.id,
          previousLevel: existing.assessedGradeLevel,
          newLevel: assessedGradeLevel,
          updateType: updateType || "ASSESSMENT_RESULT",
          reason: notes || "Assessment level updated",
          updatedById: user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error("Error updating subject assessment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update assessment" },
      { status: 500 }
    );
  }
}
