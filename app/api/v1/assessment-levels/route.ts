import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";

// GET /api/v1/assessment-levels - List all assessment age levels
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const ageYear = searchParams.get("ageYear");
  const subject = searchParams.get("subject");
  const isActive = searchParams.get("isActive");
  const includeLessonCount = searchParams.get("includeLessonCount") === "true";

  try {
    const where: Record<string, unknown> = {};

    if (ageYear !== null) {
      const parsed = parseInt(ageYear, 10);
      if (!isNaN(parsed)) {
        where.ageYear = parsed;
      }
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    // If filtering by subject, we need a different approach - we check if lessons exist for that subject
    // Assessment levels themselves don't have a subject field; lessons do
    // We include a lesson count breakdown per subject if requested

    const needLessons = includeLessonCount || !!subject;

    // Use separate queries to keep TypeScript types clean
    const levels: any[] = needLessons
      ? await prisma.assessmentAge.findMany({
          where,
          include: {
            lessons: {
              where: subject
                ? { subject: subject as any, isActive: true }
                : { isActive: true },
            },
          },
          orderBy: [{ ageYear: "asc" }, { ageMonth: "asc" }],
        })
      : await prisma.assessmentAge.findMany({
          where,
          orderBy: [{ ageYear: "asc" }, { ageMonth: "asc" }],
        });

    // If subject filter is provided, only return levels that have lessons for that subject
    let filteredLevels = levels;
    if (subject) {
      filteredLevels = levels.filter(
        (level: any) => level.lessons && level.lessons.length > 0
      );
    }

    // Build response data with lesson counts per subject if requested
    const data = filteredLevels.map((level: any) => {
      const base = {
        id: level.id,
        ageYear: level.ageYear,
        ageMonth: level.ageMonth,
        displayLabel: level.displayLabel,
        australianYear: level.australianYear,
        isActive: level.isActive,
      };

      if (includeLessonCount && level.lessons) {
        const lessonCountBySubject: Record<string, number> = {};
        for (const lesson of level.lessons) {
          lessonCountBySubject[lesson.subject] =
            (lessonCountBySubject[lesson.subject] || 0) + 1;
        }
        return { ...base, lessonCountBySubject };
      }

      return base;
    });

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error("Error fetching assessment levels:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assessment levels" },
      { status: 500 }
    );
  }
}

// POST /api/v1/assessment-levels - Create a new assessment age level
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(session, Permissions.ASSESSMENT_LEVEL_MANAGE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { ageYear, ageMonth, australianYear, description } = body;

    // Validate required fields
    if (ageYear === undefined || ageYear === null || ageMonth === undefined || ageMonth === null) {
      return NextResponse.json(
        { success: false, error: "ageYear and ageMonth are required" },
        { status: 400 }
      );
    }

    const parsedYear = parseInt(ageYear, 10);
    const parsedMonth = parseInt(ageMonth, 10);

    if (isNaN(parsedYear) || parsedYear < 5 || parsedYear > 18) {
      return NextResponse.json(
        { success: false, error: "ageYear must be between 5 and 18" },
        { status: 400 }
      );
    }

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return NextResponse.json(
        { success: false, error: "ageMonth must be between 1 and 12" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.assessmentAge.findFirst({
      where: { ageYear: parsedYear, ageMonth: parsedMonth },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Assessment level ${parsedYear}.${parsedMonth} already exists`,
        },
        { status: 409 }
      );
    }

    // Auto-calculate displayLabel
    const displayLabel = `${parsedYear}.${parsedMonth}`;

    const level = await prisma.assessmentAge.create({
      data: {
        ageYear: parsedYear,
        ageMonth: parsedMonth,
        displayLabel,
        australianYear: australianYear ?? null,
        isActive: true,
      },
    });

    return NextResponse.json(
      { success: true, data: level },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating assessment level:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create assessment level" },
      { status: 500 }
    );
  }
}
