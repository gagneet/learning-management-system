import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/sessions/[sessionId] - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { sessionId } = await params;

  try {
    const liveSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            centreId: true,
          },
        },
        studentEnrollments: {
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
                centerId: true,
              },
            },
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        attendance: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check permissions using the session's own centreId as the authoritative tenant
    const sessionCentreId = liveSession.centreId;
    if (user.role !== "SUPER_ADMIN") {
      if (!sessionCentreId || sessionCentreId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json(liveSession);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[sessionId] - Update session details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { sessionId } = await params;

  // Only teachers and admins can update sessions
  if (!["TEACHER", "CENTER_SUPERVISOR", "CENTER_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      startTime,
      endTime,
      status,
      recordingUrl,
      transcriptUrl,
    } = body;

    // Get existing session
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          select: {
            centreId: true,
          },
        },
        studentEnrollments: {
          include: {
            course: {
              select: {
                centerId: true,
              },
            },
          },
        },
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check permissions using the session's own centreId as the authoritative tenant
    const sessionCentreId = existingSession.centreId;
    if (user.role !== "SUPER_ADMIN") {
      if (!sessionCentreId || sessionCentreId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        title,
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        status,
        recordingUrl,
        transcriptUrl,
      },
      include: {
        class: true,
        studentEnrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            course: true,
            lesson: true,
          },
        },
        attendance: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
