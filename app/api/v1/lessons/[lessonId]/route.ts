import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";

// ---------------------------------------------------------------------------
// PATCH /api/v1/lessons/:lessonId
// Updates editable fields on an AgeAssessmentLesson:
//   exerciseIds, curriculumCode, strandArea, description
//
// Required roles: TEACHER, CENTER_ADMIN, CENTER_SUPERVISOR, SUPER_ADMIN
// (enforced via ASSESSMENT_LEVEL_MANAGE permission)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, Permissions.ASSESSMENT_LEVEL_MANAGE)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient permissions to update lessons" },
      { status: 403 }
    );
  }

  const { lessonId } = await params;

  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { exerciseIds, curriculumCode, strandArea, description } = body as {
    exerciseIds?: string[];
    curriculumCode?: string | null;
    strandArea?: string | null;
    description?: string | null;
  };

  // At least one field must be provided
  const hasUpdate =
    exerciseIds !== undefined ||
    curriculumCode !== undefined ||
    strandArea !== undefined ||
    description !== undefined;

  if (!hasUpdate) {
    return NextResponse.json(
      { error: "At least one of exerciseIds, curriculumCode, strandArea, or description must be provided" },
      { status: 400 }
    );
  }

  // Validate exerciseIds if provided
  if (exerciseIds !== undefined) {
    if (!Array.isArray(exerciseIds)) {
      return NextResponse.json(
        { error: "exerciseIds must be an array of strings" },
        { status: 400 }
      );
    }
    for (const id of exerciseIds) {
      if (typeof id !== "string" || !id.trim()) {
        return NextResponse.json(
          { error: "All exerciseIds must be non-empty strings" },
          { status: 400 }
        );
      }
    }
  }

  try {
    // Verify the lesson exists
    const existing = await prisma.ageAssessmentLesson.findUnique({
      where: { id: lessonId },
      select: { id: true, assessmentAgeId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Build update payload — only include fields that were explicitly provided
    const updateData: {
      exerciseIds?: string[];
      curriculumCode?: string | null;
      strandArea?: string | null;
      description?: string | null;
    } = {};

    if (exerciseIds !== undefined) {
      updateData.exerciseIds = exerciseIds.map((id) => id.trim()).filter(Boolean);
    }
    if (curriculumCode !== undefined) {
      updateData.curriculumCode = curriculumCode?.trim() || null;
    }
    if (strandArea !== undefined) {
      updateData.strandArea = strandArea?.trim() || null;
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const updated = await prisma.ageAssessmentLesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/lessons/:lessonId — fetch a single lesson (no auth required for
// read-only lesson detail; access to this page is already protected by the UI)
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  try {
    const lesson = await prisma.ageAssessmentLesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: lesson });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
  }
}
