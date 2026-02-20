import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/v1/assessments - Record a new subject assessment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    if (user.role !== "TEACHER" && user.role !== "CENTER_ADMIN" && user.role !== "CENTER_SUPERVISOR" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      studentId,
      courseId,
      assessedGradeLevel,
      readingAge,
      numeracyAge,
      comprehensionLevel,
      writingLevel,
      notes
    } = body;

    if (!studentId || !courseId || assessedGradeLevel === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Multi-tenant authorization check
    if (user.role !== "SUPER_ADMIN") {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { centerId: true },
      });

      if (!student || student.centerId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden: Student not in your center" }, { status: 403 });
      }
    }

    // Fetch existing assessment to get previousLevel
    const existingAssessment = await prisma.subjectAssessment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    const previousLevel = existingAssessment ? existingAssessment.assessedGradeLevel : 0;

    // Upsert assessment (one per student-course)
    const assessment = await prisma.subjectAssessment.upsert({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      update: {
        assessedGradeLevel: parseInt(assessedGradeLevel),
        readingAge: readingAge ? parseFloat(readingAge) : null,
        numeracyAge: numeracyAge ? parseFloat(numeracyAge) : null,
        comprehensionLevel: comprehensionLevel ? parseFloat(comprehensionLevel) : null,
        writingLevel: writingLevel ? parseFloat(writingLevel) : null,
        notes,
        lastAssessedAt: new Date(),
        assessedById: user.id,
      },
      create: {
        studentId,
        courseId,
        assessedGradeLevel: parseInt(assessedGradeLevel),
        readingAge: readingAge ? parseFloat(readingAge) : null,
        numeracyAge: numeracyAge ? parseFloat(numeracyAge) : null,
        comprehensionLevel: comprehensionLevel ? parseFloat(comprehensionLevel) : null,
        writingLevel: writingLevel ? parseFloat(writingLevel) : null,
        notes,
        assessedById: user.id,
      },
    });

    // Create a log entry for the assessment change
    await prisma.academicProfileLog.create({
      data: {
        studentId,
        courseId,
        subjectAssessmentId: assessment.id,
        previousLevel,
        newLevel: parseInt(assessedGradeLevel),
        updateType: "ASSESSMENT_RESULT",
        reason: notes || "Regular assessment",
        updatedById: user.id,
      }
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/v1/assessments - Get assessments for a student
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    // Multi-tenant authorization check
    if (user.role !== "SUPER_ADMIN") {
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { centerId: true },
      });

      if (!student || student.centerId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const assessments = await prisma.subjectAssessment.findMany({
      where: { studentId },
      include: {
        course: {
          select: { title: true }
        },
        assessedBy: {
          select: { name: true }
        }
      },
      orderBy: { lastAssessedAt: "desc" }
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
