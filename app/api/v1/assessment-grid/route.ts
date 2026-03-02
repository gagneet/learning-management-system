import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission, Permissions } from "@/lib/rbac";

/**
 * Calculate chronological age in decimal years from a date of birth to today.
 */
function calculateChronologicalAge(dateOfBirth: Date): number {
  const today = new Date();
  const diffMs = today.getTime() - dateOfBirth.getTime();
  // Average ms in a year (365.25 days)
  return diffMs / (365.25 * 24 * 60 * 60 * 1000);
}

/**
 * Calculate assessment age in decimal years from ageYear and ageMonth.
 * e.g. ageYear=9, ageMonth=3 => 9.25 (3 months = 0.25 year)
 */
function assessmentAgeToDecimal(ageYear: number, ageMonth: number): number {
  return ageYear + ageMonth / 12;
}

/**
 * Classify the age gap into an age band label.
 */
function classifyAgeBand(
  ageGap: number
): "ABOVE" | "ON_LEVEL" | "SLIGHTLY_BELOW" | "BELOW" | "SIGNIFICANTLY_BELOW" {
  if (ageGap >= 0.5) return "ABOVE";
  if (ageGap >= -0.5) return "ON_LEVEL";
  if (ageGap >= -1.0) return "SLIGHTLY_BELOW";
  if (ageGap >= -2.0) return "BELOW";
  return "SIGNIFICANTLY_BELOW";
}

const VALID_SUBJECTS = [
  "ENGLISH",
  "MATHEMATICS",
  "SCIENCE",
  "STEM",
  "READING",
  "WRITING",
] as const;

type TuitionSubject = (typeof VALID_SUBJECTS)[number];

type AgeBand =
  | "ABOVE"
  | "ON_LEVEL"
  | "SLIGHTLY_BELOW"
  | "BELOW"
  | "SIGNIFICANTLY_BELOW";

/**
 * GET /api/v1/assessment-grid
 *
 * Returns the full assessment grid for the centre showing all students × all
 * subjects and their current assessment-age placements.
 *
 * Query params:
 *   classId?  - filter students by ClassCohort membership
 *   subject?  - return placement data for one subject only
 *   ageBand?  - filter students who have at least one placement matching the band
 *   search?   - filter students by name (case-insensitive)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  if (!hasPermission(session, Permissions.ASSESSMENT_GRID_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const subjectFilter = searchParams.get("subject");
  const ageBandFilter = searchParams.get("ageBand") as AgeBand | null;
  const search = searchParams.get("search");

  // Validate optional subject param
  if (
    subjectFilter &&
    !VALID_SUBJECTS.includes(subjectFilter as TuitionSubject)
  ) {
    return NextResponse.json(
      {
        error: `Invalid subject. Must be one of: ${VALID_SUBJECTS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Validate optional ageBand param
  const VALID_AGE_BANDS: AgeBand[] = [
    "ABOVE",
    "ON_LEVEL",
    "SLIGHTLY_BELOW",
    "BELOW",
    "SIGNIFICANTLY_BELOW",
  ];
  if (ageBandFilter && !VALID_AGE_BANDS.includes(ageBandFilter)) {
    return NextResponse.json(
      {
        error: `Invalid ageBand. Must be one of: ${VALID_AGE_BANDS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    // Determine the centreId scope
    const centreId =
      user.role === "SUPER_ADMIN" ? undefined : user.centerId;

    // Build the student query
    const studentWhere: any = {
      role: "STUDENT",
      isActive: true,
    };

    if (centreId) {
      studentWhere.centerId = centreId;
    }

    if (search) {
      studentWhere.name = { contains: search, mode: "insensitive" };
    }

    // If classId filter provided, restrict to students who are members of that class
    if (classId) {
      // Validate the class belongs to this centre
      const classCohort = await prisma.classCohort.findFirst({
        where: {
          id: classId,
          ...(centreId ? { centreId } : {}),
        },
        select: { id: true },
      });

      if (!classCohort) {
        return NextResponse.json(
          { error: "Class not found or not in your centre" },
          { status: 404 }
        );
      }

      studentWhere.classEnrollments = {
        some: {
          classId,
          status: "ACTIVE",
        },
      };
    }

    // Fetch students with dateOfBirth (on User model) and their placements
    const students = await prisma.user.findMany({
      where: studentWhere,
      select: {
        id: true,
        name: true,
        dateOfBirth: true,
      },
      orderBy: { name: "asc" },
    });

    // Fetch all StudentAgeAssessment records for these students in one query
    const studentIds = students.map((s) => s.id);

    const placementWhere: any = {
      studentId: { in: studentIds },
      status: { not: "ARCHIVED" },
    };

    if (subjectFilter) {
      placementWhere.subject = subjectFilter;
    }

    if (centreId) {
      placementWhere.centreId = centreId;
    }

    const placements = await prisma.studentAgeAssessment.findMany({
      where: placementWhere,
      include: {
        currentAge: {
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

    // Index placements by studentId -> subject for O(1) lookup
    const placementMap = new Map<
      string,
      Map<string, (typeof placements)[number]>
    >();
    for (const placement of placements) {
      if (!placementMap.has(placement.studentId)) {
        placementMap.set(placement.studentId, new Map());
      }
      placementMap.get(placement.studentId)!.set(placement.subject, placement);
    }

    const today = new Date();

    // Build result rows
    const subjectsToReturn: TuitionSubject[] = subjectFilter
      ? [subjectFilter as TuitionSubject]
      : [...VALID_SUBJECTS];

    type PlacementSummary = {
      id: string;
      ageYear: number;
      ageMonth: number;
      displayLabel: string;
      australianYear: string | null;
      currentLessonNumber: number;
      lessonsCompleted: number;
      status: string;
      readyForPromotion: boolean;
      ageGap: number;
      ageBand: AgeBand;
    } | null;

    type StudentRow = {
      id: string;
      name: string;
      dateOfBirth: string | null;
      chronologicalAge: number | null;
      placements: Record<TuitionSubject, PlacementSummary>;
    };

    const studentRows: StudentRow[] = [];

    for (const student of students) {
      const dob = student.dateOfBirth ?? null;

      let chronologicalAge: number | null = null;
      if (dob) {
        const diffMs = today.getTime() - new Date(dob).getTime();
        chronologicalAge =
          Math.round((diffMs / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;
      }

      const subjectMap = placementMap.get(student.id);

      const placementsForStudent: Record<TuitionSubject, PlacementSummary> =
        {} as Record<TuitionSubject, PlacementSummary>;

      let matchesAgeBandFilter = !ageBandFilter;

      for (const subject of subjectsToReturn) {
        const placement = subjectMap?.get(subject) ?? null;

        if (!placement || !placement.currentAge) {
          placementsForStudent[subject] = null;
          continue;
        }

        const assessmentAgeDecimal = assessmentAgeToDecimal(
          placement.currentAge.ageYear,
          placement.currentAge.ageMonth
        );

        let ageGap: number | null = null;
        let ageBand: AgeBand = "ON_LEVEL";

        if (chronologicalAge !== null) {
          ageGap =
            Math.round((assessmentAgeDecimal - chronologicalAge) * 10) / 10;
          ageBand = classifyAgeBand(ageGap);
        }

        if (ageBandFilter && ageBand === ageBandFilter) {
          matchesAgeBandFilter = true;
        }

        placementsForStudent[subject] = {
          id: placement.id,
          ageYear: placement.currentAge.ageYear,
          ageMonth: placement.currentAge.ageMonth,
          displayLabel: placement.currentAge.displayLabel,
          australianYear: placement.currentAge.australianYear ?? null,
          currentLessonNumber: placement.currentLessonNumber,
          lessonsCompleted: placement.lessonsCompleted,
          status: placement.status,
          readyForPromotion: placement.readyForPromotion,
          ageGap: ageGap ?? 0,
          ageBand,
        };
      }

      // If ageBand filter is active, skip students who don't match
      if (ageBandFilter && !matchesAgeBandFilter) {
        continue;
      }

      studentRows.push({
        id: student.id,
        name: student.name ?? "",
        dateOfBirth: dob ? new Date(dob).toISOString().split("T")[0] : null,
        chronologicalAge,
        placements: placementsForStudent,
      });
    }

    return NextResponse.json({
      students: studentRows,
      subjects: subjectsToReturn,
      totalStudents: studentRows.length,
      lastUpdated: today.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching assessment grid:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
