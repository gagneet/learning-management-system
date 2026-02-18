import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/sessions/create - Create a new live session
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only teachers and admins can create sessions
  if (!["TEACHER", "CENTER_SUPERVISOR", "CENTER_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      lessonId,
      title,
      description,
      provider,
      startTime,
      endTime,
      tutorId,
    } = body;

    if (!title || !provider || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields: title, provider, startTime" },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ["TEAMS", "ZOOM", "CHIME", "OTHER"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    // Optional: Check if lesson exists (for backwards compatibility)
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
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

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }

      // Check permissions
      if (
        user.role !== "SUPER_ADMIN" &&
        lesson.module.course.centerId !== user.centerId
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Create session (without lessonId - use new multi-student model)
    // Note: Integration with actual Teams/Zoom APIs would happen here
    // For now, we're just creating the database record
    const newSession = await prisma.session.create({
      data: {
        title,
        description,
        provider,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        tutorId: tutorId || user.id,
        centreId: user.centerId!,
        status: "SCHEDULED",
        // These would be populated by the integration service
        providerMeetingId: null,
        joinUrl: null,
      },
      include: {
        studentEnrollments: {
          include: {
            student: true,
            course: true,
            lesson: true,
          },
        },
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
