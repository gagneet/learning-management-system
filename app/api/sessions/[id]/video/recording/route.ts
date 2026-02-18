import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { videoService } from "@/lib/video-service";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sessions/[id]/video/recording
 * Start recording a session
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
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is the tutor
    if (sessionData.tutorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only the tutor can start recording" },
        { status: 403 }
      );
    }

    // Check if video room exists
    if (!sessionData.videoRoomId) {
      return NextResponse.json(
        { error: "No video room exists for this session" },
        { status: 404 }
      );
    }

    // Check if recording already started
    if (sessionData.recordingStartedAt) {
      return NextResponse.json(
        { error: "Recording already started" },
        { status: 409 }
      );
    }

    // Start recording
    const recording = await videoService.startRecording(sessionData.id);

    // Update session
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        recordingStartedAt: new Date(),
      },
    });

    // Create VideoRecording record
    await prisma.videoRecording.create({
      data: {
        sessionId: sessionData.id,
        recordingId: recording.id,
        startedAt: new Date(),
        status: "PROCESSING",
        centreId: sessionData.centreId,
      },
    });

    return NextResponse.json({
      success: true,
      recordingId: recording.id,
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error starting recording:", error);
    return NextResponse.json(
      {
        error: "Failed to start recording",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[id]/video/recording
 * Stop recording a session
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
        { error: "Only the tutor can stop recording" },
        { status: 403 }
      );
    }

    // Check if recording is active
    if (!sessionData.recordingStartedAt) {
      return NextResponse.json(
        { error: "No active recording" },
        { status: 404 }
      );
    }

    // Stop recording
    const recording = await videoService.stopRecording(sessionData.id);

    // Update session
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        recordingStartedAt: null,
      },
    });

    // Update VideoRecording record
    const videoRecording = await prisma.videoRecording.findFirst({
      where: {
        sessionId: sessionData.id,
        recordingId: recording.id,
      },
    });

    if (videoRecording) {
      await prisma.videoRecording.update({
        where: { id: videoRecording.id },
        data: {
          endedAt: new Date(),
          durationMs: recording.duration,
          status: recording.status === "finished" ? "PROCESSING" : "FAILED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      recordingId: recording.id,
      endedAt: new Date().toISOString(),
      duration: recording.duration,
    });
  } catch (error) {
    console.error("Error stopping recording:", error);
    return NextResponse.json(
      {
        error: "Failed to stop recording",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[id]/video/recording
 * Get recordings for a session
 * 
 * Authorization: TEACHER (tutor of session) or CENTER_ADMIN
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
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check authorization
    const isTutor = sessionData.tutorId === session.user.id;
    const isAdmin = ["SUPER_ADMIN", "CENTER_ADMIN"].includes(session.user.role);

    if (!isTutor && !isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to view recordings" },
        { status: 403 }
      );
    }

    // Get recordings from database
    const recordings = await prisma.videoRecording.findMany({
      where: { sessionId: sessionData.id },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      recordings: recordings.map((rec) => ({
        id: rec.id,
        recordingId: rec.recordingId,
        startedAt: rec.startedAt,
        endedAt: rec.endedAt,
        durationMs: rec.durationMs,
        status: rec.status,
        downloadUrl: rec.downloadUrl,
        streamUrl: rec.streamUrl,
        transcriptionUrl: rec.transcriptionUrl,
      })),
    });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recordings",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
