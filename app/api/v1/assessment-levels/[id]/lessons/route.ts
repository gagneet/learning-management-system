import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";

const VALID_SUBJECTS = [
  "ENGLISH",
  "MATHEMATICS",
  "SCIENCE",
  "STEM",
  "READING",
  "WRITING",
];

// GET /api/v1/assessment-levels/:id/lessons - Get lessons for an assessment level
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject");

  try {
    // Verify the level exists
    const level = await prisma.assessmentAge.findUnique({ where: { id } });
    if (!level) {
      return NextResponse.json(
        { success: false, error: "Assessment level not found" },
        { status: 404 }
      );
    }

    const where: Record<string, unknown> = { assessmentAgeId: id };

    if (subject) {
      if (!VALID_SUBJECTS.includes(subject)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid subject. Must be one of: ${VALID_SUBJECTS.join(", ")}`,
          },
          { status: 400 }
        );
      }
      where.subject = subject;
    }

    const lessons = await prisma.ageAssessmentLesson.findMany({
      where,
      orderBy: [{ subject: "asc" }, { lessonNumber: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: lessons,
      total: lessons.length,
    });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

// POST /api/v1/assessment-levels/:id/lessons - Create or update a lesson in a level
export async function POST(
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
    // Verify the level exists
    const level = await prisma.assessmentAge.findUnique({ where: { id } });
    if (!level) {
      return NextResponse.json(
        { success: false, error: "Assessment level not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      subject,
      lessonNumber,
      title,
      description,
      learningObjectives,
      difficultyScore,
      estimatedMinutes,
      curriculumCode,
      strandArea,
      exerciseIds,
      contentData,
    } = body;

    // Validate required fields
    if (!subject || lessonNumber === undefined || lessonNumber === null || !title) {
      return NextResponse.json(
        { success: false, error: "subject, lessonNumber, and title are required" },
        { status: 400 }
      );
    }

    if (!VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid subject. Must be one of: ${VALID_SUBJECTS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const parsedLessonNumber = parseInt(lessonNumber, 10);
    if (isNaN(parsedLessonNumber) || parsedLessonNumber < 1 || parsedLessonNumber > 25) {
      return NextResponse.json(
        { success: false, error: "lessonNumber must be between 1 and 25" },
        { status: 400 }
      );
    }

    // Auto-calculate difficultyScore if not provided: 30 to 100 scaled across 25 lessons
    const calculatedDifficultyScore =
      difficultyScore !== undefined && difficultyScore !== null
        ? difficultyScore
        : Math.round((parsedLessonNumber / 25) * 70 + 30);

    // Upsert the lesson based on [assessmentAgeId, subject, lessonNumber]
    const lesson = await prisma.ageAssessmentLesson.upsert({
      where: {
        assessmentAgeId_subject_lessonNumber: {
          assessmentAgeId: id,
          subject,
          lessonNumber: parsedLessonNumber,
        },
      },
      update: {
        title,
        description: description ?? null,
        learningObjectives: learningObjectives ?? null,
        difficultyScore: calculatedDifficultyScore,
        estimatedMinutes: estimatedMinutes ?? null,
        curriculumCode: curriculumCode ?? null,
        strandArea: strandArea ?? null,
        exerciseIds: exerciseIds ?? [],
        contentData: contentData ?? null,
      },
      create: {
        assessmentAgeId: id,
        subject,
        lessonNumber: parsedLessonNumber,
        title,
        description: description ?? null,
        learningObjectives: learningObjectives ?? null,
        difficultyScore: calculatedDifficultyScore,
        estimatedMinutes: estimatedMinutes ?? null,
        curriculumCode: curriculumCode ?? null,
        strandArea: strandArea ?? null,
        exerciseIds: exerciseIds ?? [],
        contentData: contentData ?? null,
        isActive: true,
      },
    });

    return NextResponse.json(
      { success: true, data: lesson },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating/updating lesson:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create or update lesson" },
      { status: 500 }
    );
  }
}
