import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/help-requests - List help requests
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);

  const studentId = searchParams.get("studentId");
  const sessionEnrollmentId = searchParams.get("sessionEnrollmentId");
  const sessionId = searchParams.get("sessionId");
  const status = searchParams.get("status");

  try {
    // Build where clause based on role and filters
    const where: any = {};

    // Authorization
    if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      // Parents can see their children's help requests
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });

      where.studentId = {
        in: children.map((child) => child.id),
      };
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
    if (studentId && user.role !== "STUDENT") {
      where.studentId = studentId;
    }

    if (sessionEnrollmentId) {
      where.sessionEnrollmentId = sessionEnrollmentId;
    }

    if (sessionId) {
      where.sessionEnrollment = {
        sessionId,
      };
    }

    if (status) {
      where.status = status;
    }


    const helpRequests = await prisma.helpRequest.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
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
                tutorId: true,
              },
            },
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "asc" }, // Oldest first
      ],
    });

    return NextResponse.json({
      success: true,
      data: helpRequests,
    });
  } catch (error) {
    console.error("Error fetching help requests:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch help requests" },
      { status: 500 }
    );
  }
}

// POST /api/v1/help-requests - Create a new help request
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only students can create help requests (or admins for testing)
  if (!["STUDENT", "SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { sessionEnrollmentId, helpText } = body;

    // Validation
    if (!sessionEnrollmentId) {
      return NextResponse.json(
        {
          success: false,
          error: "sessionEnrollmentId is required",
        },
        { status: 400 }
      );
    }

    // Verify session enrollment exists and belongs to student
    const enrollment = await prisma.studentSessionEnrollment.findUnique({
      where: { id: sessionEnrollmentId },
      select: {
        studentId: true,
        session: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "Session enrollment not found" },
        { status: 404 }
      );
    }

    if (
      user.role === "STUDENT" &&
      enrollment.studentId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify session is active
    if (enrollment.session.status !== "LIVE") {
      return NextResponse.json(
        {
          success: false,
          error: "Can only request help during live sessions",
        },
        { status: 400 }
      );
    }

    // Check if there's already a pending request for this student in this session
    const existingRequest = await prisma.helpRequest.findFirst({
      where: {
        studentId: user.role === "STUDENT" ? user.id : enrollment.studentId,
        sessionId: enrollment.session.id,
        status: {
          in: ["PENDING", "ACKNOWLEDGED"],
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You already have an active help request. Please wait for it to be resolved.",
        },
        { status: 400 }
      );
    }

    // Create help request
    const helpRequest = await prisma.helpRequest.create({
      data: {
        studentId: user.role === "STUDENT" ? user.id : enrollment.studentId,
        sessionId: enrollment.session.id,
        enrollmentId: sessionEnrollmentId,
        message: helpText,
        status: "PENDING",
        centreId: user.centerId!,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },
    });

    // TODO: Trigger real-time notification to tutor via WebSocket

    return NextResponse.json(
      {
        success: true,
        data: helpRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating help request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create help request" },
      { status: 500 }
    );
  }
}
