import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/academic/classes - List class cohorts
 * POST /api/academic/classes - Create a new class cohort
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);
  const centreId = searchParams.get("centreId") || user.centerId;

  // Authorization: Only admins and tutors can list classes for a center
  if (user.role === "STUDENT" || user.role === "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Cross-center access restricted to SUPER_ADMIN
  if (centreId !== user.centerId && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const classes = await prisma.classCohort.findMany({
      where: {
        centreId,
        isActive: true,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ success: true, data: classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Authorization: Only admins can create classes
  if (!["CENTER_ADMIN", "SUPER_ADMIN", "CENTER_SUPERVISOR"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name,
      subject,
      subjectEnum,
      description,
      startDate,
      endDate,
      teacherId,
      maxCapacity,
      gradeMin,
      gradeMax,
    } = body;

    if (!name || !subject || !startDate || !teacherId) {
      return NextResponse.json(
        { error: "Missing required fields: name, subject, startDate, teacherId" },
        { status: 400 }
      );
    }

    // Verify teacher exists and belongs to the same center
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { centerId: true, role: true }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    if (teacher.role !== "TEACHER") {
      return NextResponse.json({ error: "User is not a teacher" }, { status: 400 });
    }

    if (user.role !== "SUPER_ADMIN" && teacher.centerId !== user.centerId) {
      return NextResponse.json({ error: "Teacher must belong to your center" }, { status: 403 });
    }

    const newClass = await prisma.classCohort.create({
      data: {
        name,
        subject,
        subjectEnum,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        teacherId,
        maxCapacity: maxCapacity || 20,
        gradeMin,
        gradeMax,
        centreId: user.centerId!,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, data: newClass }, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
