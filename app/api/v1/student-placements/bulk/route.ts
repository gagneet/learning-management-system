import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { TuitionSubject } from "@prisma/client";

interface BulkPlacementItem {
  studentId: string;
  subject: string;
  ageYear: number | string;
  ageMonth: number | string;
  placementMethod?: string;
  placementNotes?: string;
}

interface PlacementError {
  studentId: string;
  subject: string;
  error: string;
}

// POST /api/v1/student-placements/bulk - Place multiple students at assessment age levels
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only TEACHER, CENTER_ADMIN, CENTER_SUPERVISOR, SUPER_ADMIN may bulk-place
  if (!hasPermission(session, Permissions.STUDENT_PLACEMENT_CREATE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user } = session;

  let body: { placements: BulkPlacementItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { placements } = body;

  // Validate top-level structure
  if (!Array.isArray(placements) || placements.length === 0) {
    return NextResponse.json(
      { success: false, error: "placements must be a non-empty array" },
      { status: 400 }
    );
  }

  if (placements.length > 50) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many placements in a single request. Maximum is 50, received ${placements.length}.`,
      },
      { status: 400 }
    );
  }

  // Validate every item has the required fields before processing
  for (let i = 0; i < placements.length; i++) {
    const item = placements[i];
    if (
      !item.studentId ||
      !item.subject ||
      item.ageYear === undefined ||
      item.ageYear === null ||
      item.ageMonth === undefined ||
      item.ageMonth === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Item at index ${i} is missing one or more required fields: studentId, subject, ageYear, ageMonth`,
        },
        { status: 400 }
      );
    }
  }

  let created = 0;
  let updated = 0;
  const errors: PlacementError[] = [];

  for (const item of placements) {
    const { studentId, subject, placementMethod, placementNotes } = item;
    const parsedYear = parseInt(String(item.ageYear), 10);
    const parsedMonth = parseInt(String(item.ageMonth), 10);

    try {
      // Validate the student exists, is a STUDENT role, and belongs to the right centre
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, role: true, centerId: true, name: true },
      });

      if (!student) {
        errors.push({ studentId, subject, error: "Student not found" });
        continue;
      }

      if (student.role !== "STUDENT") {
        errors.push({ studentId, subject, error: "User is not a student" });
        continue;
      }

      // Enforce same-centre check (unless SUPER_ADMIN)
      if (user.role !== "SUPER_ADMIN" && student.centerId !== user.centerId) {
        errors.push({
          studentId,
          subject,
          error: "Student does not belong to this centre",
        });
        continue;
      }

      // Resolve the AssessmentAge record
      const assessmentAge = await prisma.assessmentAge.findFirst({
        where: { ageYear: parsedYear, ageMonth: parsedMonth },
      });

      if (!assessmentAge) {
        errors.push({
          studentId,
          subject,
          error: `No assessment age level found for ${parsedYear}.${parsedMonth}`,
        });
        continue;
      }

      // Determine centreId (from session unless SUPER_ADMIN placing cross-centre)
      const centreId =
        user.role === "SUPER_ADMIN" ? student.centerId! : user.centerId!;

      const subjectEnum = subject as TuitionSubject;

      // Check for an existing active placement (studentId + subject is @@unique)
      const existingPlacement = await prisma.studentAgeAssessment.findFirst({
        where: {
          studentId,
          subject: subjectEnum,
          status: { not: "ARCHIVED" },
        },
        select: { id: true, currentAgeId: true },
      });

      if (existingPlacement) {
        // Update existing placement (MANUAL_OVERRIDE)
        await prisma.$transaction(async (tx) => {
          const updatedPlacement = await tx.studentAgeAssessment.update({
            where: { id: existingPlacement.id },
            data: {
              currentAgeId: assessmentAge.id,
              placedById: user.id,
              placedAt: new Date(),
              placementMethod: placementMethod ?? "MANUAL_OVERRIDE",
              placementNotes: placementNotes ?? null,
            },
          });

          await tx.ageAssessmentHistory.create({
            data: {
              studentId,
              placementId: updatedPlacement.id,
              subject: subjectEnum,
              fromAgeId: existingPlacement.currentAgeId,
              toAgeId: assessmentAge.id,
              changeType: "MANUAL_OVERRIDE",
              reason: placementNotes ?? "Bulk placement override",
              testScore: null,
              changedById: user.id,
              centreId,
            },
          });
        });

        updated++;
      } else {
        // Create new placement (INITIAL_PLACEMENT)
        await prisma.$transaction(async (tx) => {
          const placement = await tx.studentAgeAssessment.create({
            data: {
              studentId,
              subject: subjectEnum,
              currentAgeId: assessmentAge.id,
              initialAgeId: assessmentAge.id,
              currentLessonNumber: 1,
              lessonsCompleted: 0,
              placedById: user.id,
              placedAt: new Date(),
              placementMethod: placementMethod ?? "MANUAL_OVERRIDE",
              placementNotes: placementNotes ?? null,
              status: "ACTIVE",
              readyForPromotion: false,
              centreId,
            },
          });

          await tx.ageAssessmentHistory.create({
            data: {
              studentId,
              placementId: placement.id,
              subject: subjectEnum,
              fromAgeId: null,
              toAgeId: assessmentAge.id,
              changeType: "INITIAL_PLACEMENT",
              reason: placementNotes ?? "Bulk initial placement",
              testScore: null,
              changedById: user.id,
              centreId,
            },
          });
        });

        created++;
      }
    } catch (itemError) {
      console.error(
        `Bulk placement error for studentId=${studentId} subject=${subject}:`,
        itemError
      );
      errors.push({
        studentId,
        subject,
        error: "Internal error processing this placement",
      });
    }
  }

  const statusCode = errors.length === placements.length ? 422 : 200;

  return NextResponse.json(
    {
      success: errors.length < placements.length,
      created,
      updated,
      errors,
    },
    { status: statusCode }
  );
}
