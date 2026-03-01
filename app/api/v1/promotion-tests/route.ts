import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission, Permissions } from "@/lib/rbac";

const VALID_SUBJECTS = [
  "ENGLISH",
  "MATHEMATICS",
  "SCIENCE",
  "STEM",
  "READING",
  "WRITING",
] as const;

type TuitionSubject = (typeof VALID_SUBJECTS)[number];

/**
 * GET /api/v1/promotion-tests
 *
 * List promotion tests, optionally filtered by assessmentAgeId, subject, isActive.
 * Permission: STUDENT_PLACEMENT_VIEW
 *
 * Query params:
 *   assessmentAgeId? - filter by assessment age level
 *   subject?         - filter by TuitionSubject
 *   isActive?        - "true" | "false"
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, Permissions.STUDENT_PLACEMENT_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);

  const assessmentAgeId = searchParams.get("assessmentAgeId");
  const subjectFilter = searchParams.get("subject");
  const isActiveParam = searchParams.get("isActive");

  if (subjectFilter && !VALID_SUBJECTS.includes(subjectFilter as TuitionSubject)) {
    return NextResponse.json(
      { error: `Invalid subject. Must be one of: ${VALID_SUBJECTS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const where: any = {};

    if (assessmentAgeId) {
      where.assessmentAgeId = assessmentAgeId;
    }

    if (subjectFilter) {
      where.subject = subjectFilter;
    }

    if (isActiveParam !== null) {
      where.isActive = isActiveParam === "true";
    }

    const tests = await prisma.agePromotionTest.findMany({
      where,
      include: {
        assessmentAge: {
          select: {
            id: true,
            ageYear: true,
            ageMonth: true,
            displayLabel: true,
            australianYear: true,
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: [
        { assessmentAge: { ageYear: "asc" } },
        { assessmentAge: { ageMonth: "asc" } },
        { subject: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: tests,
      total: tests.length,
    });
  } catch (error) {
    console.error("Error fetching promotion tests:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/promotion-tests
 *
 * Create a new promotion test.
 * Permission: PROMOTION_TEST_CREATE
 *
 * Body:
 *   assessmentAgeId  (required) - the AssessmentAge this test promotes FROM
 *   subject          (required) - TuitionSubject
 *   title            (required)
 *   description?
 *   questions        (required) - JSON array of question objects
 *   totalMarks?      - defaults to sum of question marks or questions.length
 *   passingScore?    - percentage (0-100), defaults to 60
 *   excellenceScore? - percentage (0-100), defaults to 85
 *   timeLimit?       - minutes
 *   isAutoGraded?    - boolean, defaults to false
 *
 * Returns 409 if a test already exists for [assessmentAgeId, subject].
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, Permissions.PROMOTION_TEST_CREATE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user } = session;

  try {
    const body = await request.json();
    const {
      assessmentAgeId,
      subject,
      title,
      description,
      questions,
      totalMarks,
      passingScore,
      excellenceScore,
      timeLimit,
      isAutoGraded,
    } = body;

    // Required field validation
    if (!assessmentAgeId || !subject || !title || !questions) {
      return NextResponse.json(
        {
          success: false,
          error:
            "assessmentAgeId, subject, title, and questions are required",
        },
        { status: 400 }
      );
    }

    if (!VALID_SUBJECTS.includes(subject as TuitionSubject)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid subject. Must be one of: ${VALID_SUBJECTS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "questions must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate score percentages
    if (
      passingScore !== undefined &&
      (passingScore < 0 || passingScore > 100)
    ) {
      return NextResponse.json(
        { success: false, error: "passingScore must be between 0 and 100" },
        { status: 400 }
      );
    }
    if (
      excellenceScore !== undefined &&
      (excellenceScore < 0 || excellenceScore > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "excellenceScore must be between 0 and 100",
        },
        { status: 400 }
      );
    }

    // Verify the AssessmentAge exists
    const assessmentAge = await prisma.assessmentAge.findUnique({
      where: { id: assessmentAgeId },
    });

    if (!assessmentAge) {
      return NextResponse.json(
        { success: false, error: "AssessmentAge not found" },
        { status: 404 }
      );
    }

    // Check for duplicate: one test per [assessmentAgeId, subject]
    const existing = await prisma.agePromotionTest.findFirst({
      where: { assessmentAgeId, subject },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `A promotion test already exists for this assessment age and subject (id: ${existing.id})`,
        },
        { status: 409 }
      );
    }

    // Compute totalMarks if not provided (sum of question marks, fallback to count)
    let resolvedTotalMarks = totalMarks;
    if (resolvedTotalMarks === undefined || resolvedTotalMarks === null) {
      resolvedTotalMarks = questions.reduce(
        (sum: number, q: any) => sum + (q.marks ?? q.points ?? 1),
        0
      );
    }

    const test = await prisma.agePromotionTest.create({
      data: {
        assessmentAgeId,
        subject,
        title,
        description: description ?? null,
        questions,
        totalMarks: resolvedTotalMarks,
        passingScore: passingScore ?? 60,
        excellenceScore: excellenceScore ?? 85,
        timeLimit: timeLimit ?? null,
        isAutoGraded: isAutoGraded ?? false,
        isActive: true,
      },
      include: {
        assessmentAge: {
          select: {
            id: true,
            ageYear: true,
            ageMonth: true,
            displayLabel: true,
            australianYear: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: test },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating promotion test:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
