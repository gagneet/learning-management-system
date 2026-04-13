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
 * GET /api/v1/promotion-tests/:id
 *
 * Returns a promotion test by ID.
 * - STUDENT role: correctAnswer is stripped from each question (only text + options shown)
 * - TEACHER / ADMIN: full question data including correct answers
 *
 * Permission: STUDENT_PLACEMENT_VIEW or STUDENT_PLACEMENT_VIEW_OWN
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

  // Both broad-view staff and students/parents (own-view) may access test details
  const canViewAll = hasPermission(session, Permissions.STUDENT_PLACEMENT_VIEW);
  const canViewOwn = hasPermission(
    session,
    Permissions.STUDENT_PLACEMENT_VIEW_OWN
  );

  if (!canViewAll && !canViewOwn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const test = await prisma.agePromotionTest.findUnique({
      where: { id },
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
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: "Promotion test not found" },
        { status: 404 }
      );
    }

    // For STUDENT role: strip correctAnswer from every question so the answer
    // key is not exposed to the client.
    const isStudent = user.role === "STUDENT";

    let questions = test.questions as any[];

    if (isStudent) {
      questions = questions.map((q: any) => {
        // Destructure out correctAnswer and keep the rest
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctAnswer, ...safeQuestion } = q;
        return safeQuestion;
      });
    }

    const responseData = {
      ...test,
      questions,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error fetching promotion test:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/promotion-tests/:id
 *
 * Update an existing promotion test.
 * Permission: PROMOTION_TEST_CREATE
 *
 * Body (all optional):
 *   title, description, questions, totalMarks, passingScore,
 *   excellenceScore, timeLimit, isAutoGraded, isActive
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, Permissions.PROMOTION_TEST_CREATE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Ensure the test exists
    const existing = await prisma.agePromotionTest.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Promotion test not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      questions,
      totalMarks,
      passingScore,
      excellenceScore,
      timeLimit,
      isAutoGraded,
      isActive,
    } = body;

    // Build update payload from provided fields only
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return NextResponse.json(
          { success: false, error: "title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ?? null;
    }

    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { success: false, error: "questions must be a non-empty array" },
          { status: 400 }
        );
      }
      updateData.questions = questions;

      // Recompute totalMarks from questions if totalMarks is not explicitly provided
      if (totalMarks === undefined) {
        updateData.totalMarks = questions.reduce(
          (sum: number, q: any) => sum + (q.marks ?? q.points ?? 1),
          0
        );
      }
    }

    if (totalMarks !== undefined) {
      if (typeof totalMarks !== "number" || totalMarks < 1) {
        return NextResponse.json(
          { success: false, error: "totalMarks must be a positive number" },
          { status: 400 }
        );
      }
      updateData.totalMarks = totalMarks;
    }

    if (passingScore !== undefined) {
      if (
        typeof passingScore !== "number" ||
        passingScore < 0 ||
        passingScore > 100
      ) {
        return NextResponse.json(
          { success: false, error: "passingScore must be between 0 and 100" },
          { status: 400 }
        );
      }
      updateData.passingScore = passingScore;
    }

    if (excellenceScore !== undefined) {
      if (
        typeof excellenceScore !== "number" ||
        excellenceScore < 0 ||
        excellenceScore > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "excellenceScore must be between 0 and 100",
          },
          { status: 400 }
        );
      }
      updateData.excellenceScore = excellenceScore;
    }

    if (timeLimit !== undefined) {
      updateData.timeLimit = timeLimit ?? null;
    }

    if (isAutoGraded !== undefined) {
      updateData.isAutoGraded = Boolean(isAutoGraded);
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updated = await prisma.agePromotionTest.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating promotion test:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
