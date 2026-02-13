import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/tutor-notes - List tutor notes
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);

  const studentId = searchParams.get("studentId");
  const sessionId = searchParams.get("sessionId");
  const noteType = searchParams.get("noteType");
  const visibility = searchParams.get("visibility");
  const tutorId = searchParams.get("tutorId");

  try {
    // Build where clause based on role and filters
    const where: any = {};

    // Authorization: Parents can only see EXTERNAL notes for their children
    if (user.role === "PARENT") {
      // Get parent's children
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });

      where.studentId = {
        in: children.map((child) => child.id),
      };
      where.visibility = "EXTERNAL";
    } else if (user.role === "STUDENT") {
      // Students can only see EXTERNAL notes about themselves
      where.studentId = user.id;
      where.visibility = "EXTERNAL";
    } else if (user.role !== "SUPER_ADMIN") {
      // Teachers, supervisors, admins - filter by center
      const student = studentId
        ? await prisma.user.findUnique({
            where: { id: studentId },
            select: { centerId: true },
          })
        : null;

      if (student && student.centerId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Apply filters
    if (studentId && !["PARENT", "STUDENT"].includes(user.role)) {
      where.studentId = studentId;
    }

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (noteType) {
      where.noteType = noteType;
    }

    if (visibility && !["PARENT", "STUDENT"].includes(user.role)) {
      where.visibility = visibility;
    }

    if (tutorId) {
      where.tutorId = tutorId;
    }

    const notes = await prisma.tutorNote.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        enrollment: {
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
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error("Error fetching tutor notes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tutor notes" },
      { status: 500 }
    );
  }
}

// POST /api/v1/tutor-notes - Create a new tutor note
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only teachers, supervisors, and admins can create notes
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
    const {
      studentId,
      courseId,
      enrollmentId,
      visibility,
      content,
    } = body;

    // Validation
    if (!studentId || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "studentId and content are required",
        },
        { status: 400 }
      );
    }

    // Verify valid visibility
    const validVisibility = ["INTERNAL", "EXTERNAL"];
    const finalVisibility = visibility || "INTERNAL";
    if (!validVisibility.includes(finalVisibility)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid visibility. Must be one of: ${validVisibility.join(", ")}`,
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

    // Verify enrollment if provided
    if (enrollmentId) {
      const enrollmentExists = await prisma.studentSessionEnrollment.findUnique({
        where: { id: enrollmentId },
        select: { id: true },
      });

      if (!enrollmentExists) {
        return NextResponse.json(
          { success: false, error: "Session enrollment not found" },
          { status: 404 }
        );
      }
    }

    // Create tutor note
    const note = await prisma.tutorNote.create({
      data: {
        studentId,
        tutorId: user.id,
        courseId,
        enrollmentId,
        visibility: finalVisibility,
        content,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        enrollment: {
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
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: note,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tutor note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tutor note" },
      { status: 500 }
    );
  }
}
