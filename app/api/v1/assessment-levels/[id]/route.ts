import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";

// GET /api/v1/assessment-levels/:id - Get a single assessment level with lesson plans and promotion tests
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const level = await prisma.assessmentAge.findUnique({
      where: { id },
      include: {
        lessons: {
          where: { isActive: true },
          orderBy: [{ subject: "asc" }, { lessonNumber: "asc" }],
        },
        promotionTests: {
          select: {
            id: true,
            subject: true,
            title: true,
            isActive: true,
            passingScore: true,
            excellenceScore: true,
            totalMarks: true,
            timeLimit: true,
            isAutoGraded: true,
          },
          orderBy: { subject: "asc" },
        },
      },
    });

    if (!level) {
      return NextResponse.json(
        { success: false, error: "Assessment level not found" },
        { status: 404 }
      );
    }

    // Group lessons by subject
    const lessonsBySubject: Record<string, typeof level.lessons> = {};
    for (const lesson of level.lessons) {
      if (!lessonsBySubject[lesson.subject]) {
        lessonsBySubject[lesson.subject] = [];
      }
      lessonsBySubject[lesson.subject].push(lesson);
    }

    // Group promotion tests by subject
    const promotionTestsBySubject: Record<string, typeof level.promotionTests> = {};
    for (const test of level.promotionTests) {
      if (!promotionTestsBySubject[test.subject]) {
        promotionTestsBySubject[test.subject] = [];
      }
      promotionTestsBySubject[test.subject].push(test);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: level.id,
        ageYear: level.ageYear,
        ageMonth: level.ageMonth,
        displayLabel: level.displayLabel,
        australianYear: level.australianYear,
        isActive: level.isActive,
        lessonsBySubject,
        promotionTestsBySubject,
      },
    });
  } catch (error) {
    console.error("Error fetching assessment level:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assessment level" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/assessment-levels/:id - Update an assessment level
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, Permissions.ASSESSMENT_LEVEL_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const level = await prisma.assessmentAge.findUnique({ where: { id } });

    if (!level) {
      return NextResponse.json(
        { success: false, error: "Assessment level not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { australianYear, description, isActive } = body;

    // Build update data (only update provided fields)
    const updateData: Record<string, unknown> = {};

    if (australianYear !== undefined) {
      updateData.australianYear = australianYear;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // description is not a field on AssessmentAge in the schema but handle gracefully if provided
    // Only update fields that exist on the model
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updated = await prisma.assessmentAge.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating assessment level:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update assessment level" },
      { status: 500 }
    );
  }
}
