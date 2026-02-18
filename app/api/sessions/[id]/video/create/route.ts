import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { videoService } from "@/lib/video-service";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sessions/[id]/video/create
 * Create a video room for a session
 * 
 * Authorization: TEACHER (tutor of session only)
 */
export async function POST(
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
          include: {
            student: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is the tutor
    if (sessionData.tutorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only the tutor can create a video room" },
        { status: 403 }
      );
    }

    // Check if video room already exists
    if (sessionData.videoRoomId) {
      return NextResponse.json(
        {
          error: "Video room already exists",
          roomUrl: sessionData.videoRoomUrl,
          roomId: sessionData.videoRoomId,
        },
        { status: 409 }
      );
    }

    // Parse request body for optional configuration
    const body = await request.json().catch(() => ({}));
    const {
      maxParticipants = 10,
      enableRecording = true,
      enableTranscription = true,
    } = body;

    // Create video room via Daily.co
    const room = await videoService.createRoom({
      sessionId: sessionData.id,
      maxParticipants,
      enableRecording,
      enableTranscription,
      expiresAt: sessionData.endTime || undefined,
    });

    // Update session with video room details
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        videoRoomId: room.name,
        videoRoomUrl: room.url,
        videoProvider: "DAILY",
      },
    });

    return NextResponse.json({
      success: true,
      roomId: room.name,
      roomUrl: room.url,
      session: {
        id: updatedSession.id,
        videoRoomId: updatedSession.videoRoomId,
        videoRoomUrl: updatedSession.videoRoomUrl,
      },
    });
  } catch (error) {
    console.error("Error creating video room:", error);
    return NextResponse.json(
      {
        error: "Failed to create video room",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[id]/video/create
 * Delete a video room for a session
 * 
 * Authorization: TEACHER (tutor of session only)
 */
export async function DELETE(
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
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is the tutor
    if (sessionData.tutorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only the tutor can delete a video room" },
        { status: 403 }
      );
    }

    if (!sessionData.videoRoomId) {
      return NextResponse.json(
        { error: "No video room exists for this session" },
        { status: 404 }
      );
    }

    // Delete video room from Daily.co
    await videoService.deleteRoom(sessionData.videoRoomId);

    // Update session to remove video room details
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        videoRoomId: null,
        videoRoomUrl: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Video room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting video room:", error);
    return NextResponse.json(
      {
        error: "Failed to delete video room",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
