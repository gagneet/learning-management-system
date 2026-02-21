import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

// GET /api/v1/homework - List homework assignments
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);

  const studentId = searchParams.get("studentId");
  const sessionEnrollmentId = searchParams.get("sessionEnrollmentId");
  const status = searchParams.get("status");
  const courseId = searchParams.get("courseId");

  try {
    // Build where clause based on role and filters
    const where: any = {};

    // Authorization
    if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      // Parents can see their children's homework
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });

      where.studentId = {
        in: children.map((child) => child.id),
      };
    } else if (user.role !== "SUPER_ADMIN") {
      // ⚡ Bolt Optimization: Use direct centreId filter for multi-tenancy.
      // This ensures data isolation and avoids unnecessary joins or extra DB calls.
      where.centreId = user.centerId;

      if (studentId) {
        // Still ensure the requested student belongs to the same center
        const student = await prisma.user.findUnique({
          where: { id: studentId },
          select: { centerId: true },
        });

        if (!student || student.centerId !== user.centerId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    // Apply filters
    if (studentId && user.role !== "STUDENT") {
      where.studentId = studentId;
    }

    if (sessionEnrollmentId) {
      where.sessionEnrollmentId = sessionEnrollmentId;
    }

    if (status) {
      where.status = status;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    const homework = await prisma.homeworkAssignment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        sessionEnrollment: {
          select: {
            id: true,
            session: {
              select: {
                id: true,
                title: true,
                startTime: true,
              },
            },
          },
        },
        exercise: {
          select: {
            id: true,
            title: true,
            exerciseType: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: homework,
    });
  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch homework" },
      { status: 500 }
    );
  }
}

// POST /api/v1/homework - Create homework assignment
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only teachers, supervisors, and admins can create homework
  if (
    ![
      "SUPER_ADMIN",
      "CENTER_ADMIN",
      "CENTER_SUPERVISOR",
      "TEACHER",
    ].includes(user.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Security check: Prevent centreId injection
    preventCentreIdInjection(body);

    const {
      studentId,
      courseId,
      sessionEnrollmentId,
      exerciseId,
      notes,
      dueDate,
    } = body;

    // Validation
    if (!studentId || !courseId || !exerciseId || !dueDate) {
      return NextResponse.json(
        {
          success: false,
          error: "studentId, courseId, exerciseId, and dueDate are required",
        },
        { status: 400 }
      );
    }

    // Verify student exists and access
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { centerId: true, role: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "User is not a student" },
        { status: 400 }
      );
    }

    if (user.role !== "SUPER_ADMIN" && student.centerId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: {
        id: true,
        title: true,
        maxScore: true,
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: "Exercise not found" },
        { status: 404 }
      );
    }

    // Create homework assignment
    const homework = await prisma.homeworkAssignment.create({
      data: {
        studentId,
        courseId,
        centreId: student.centerId, // Derived from student
        exerciseId,
        sessionEnrollmentId,
        notes,
        dueDate: new Date(dueDate),
        assignedById: user.id,
        status: "NOT_STARTED",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        exercise: {
          select: {
            id: true,
            title: true,
            exerciseType: true,
            maxScore: true,
          },
        },
      },
    });

    // Audit logging
    await auditCreate(
      user.id,
      user.name || "Unknown",
      user.role as Role,
      "HomeworkAssignment",
      homework.id,
      {
        studentId,
        courseId,
        exerciseId,
        dueDate: homework.dueDate,
      },
      student.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(
      {
        success: true,
        data: homework,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating homework:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create homework" },
      { status: 500 }
    );
  }
}
