import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { videoService } from "@/lib/video-service";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sessions/[id]/video/token
 * Generate a video meeting token for a user to join a session
 * 
 * Authorization: TEACHER (tutor) or STUDENT (enrolled in session)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: sessionId } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the session
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tutor: {
          select: { id: true, name: true },
        },
        studentEnrollments: {
          select: {
            studentId: true,
          },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if video room exists
    if (!sessionData.videoRoomId || !sessionData.videoRoomUrl) {
      return NextResponse.json(
        { error: "Video room not created for this session" },
        { status: 404 }
      );
    }

    // Check authorization: user must be tutor or enrolled student
    const isTutor = sessionData.tutorId === session.user.id;
    const isEnrolledStudent = sessionData.studentEnrollments.some(
      (enrollment) => enrollment.studentId === session.user.id
    );
    const isSuperAdmin = session.user.role === "SUPER_ADMIN";

    if (!isTutor && !isEnrolledStudent && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to join this session" },
        { status: 403 }
      );
    }

    // Generate token
    const token = await videoService.generateToken({
      sessionId: sessionData.id,
      userId: session.user.id,
      userName: session.user.name || "Unknown User",
      isTutor,
      enableRecording: isTutor, // Only tutors can control recording
      expiresIn: 7200, // 2 hours
    });

    // Track participant join - create a new record each time they request a token
    // (participants may join multiple times; each join is a separate record)
    const existingParticipant = await prisma.videoParticipant.findFirst({
      where: {
        sessionId: sessionData.id,
        userId: session.user.id,
        leftAt: null, // Only look for active (not yet left) participants
      },
    });

    if (!existingParticipant) {
      await prisma.videoParticipant.create({
        data: {
          sessionId: sessionData.id,
          userId: session.user.id,
          participantId: `${session.user.id}-${Date.now()}`, // Temporary, updated when they actually join via Daily.co
          joinedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      token,
      roomUrl: sessionData.videoRoomUrl,
      roomId: sessionData.videoRoomId,
      isTutor,
      userName: session.user.name,
      userId: session.user.id,
    });
  } catch (error) {
    console.error("Error generating video token:", error);
    return NextResponse.json(
      {
        error: "Failed to generate video token",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
