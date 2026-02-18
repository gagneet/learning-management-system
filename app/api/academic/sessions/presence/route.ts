import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * POST /api/academic/sessions/presence
 *
 * Records student presence events (JOIN, LEAVE, HEARTBEAT)
 * and updates accumulated active time.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  try {
    const body = await request.json();
    const { sessionId, enrollmentId, event } = body;

    if (!sessionId || !enrollmentId || !event) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const now = new Date();

    // Fetch current enrollment state
    const enrollment = await prisma.studentSessionEnrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        id: true,
        studentId: true,
        lastActiveAt: true,
        activeMs: true,
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Ensure user is authorized
    if (user.role === "STUDENT" && enrollment.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let updatedActiveMs = enrollment.activeMs;
    const lastActive = enrollment.lastActiveAt ? new Date(enrollment.lastActiveAt) : null;

    // Logic for updating active time based on heartbeats
    if (event === "HEARTBEAT" && lastActive) {
      const diffMs = now.getTime() - lastActive.getTime();

      // If the gap is reasonable (e.g. < 2 minutes), accumulate it
      // This handles network jitters while preventing massive jumps from stale sessions
      if (diffMs < 120000) {
        updatedActiveMs += diffMs;
      }
    }

    // Record the event in the presence log
    await prisma.sessionPresenceLog.create({
      data: {
        sessionId,
        studentId: enrollment.studentId,
        enrollmentId,
        event,
        timestamp: now,
        centreId: user.centerId!,
      }
    });

    // Update enrollment state
    const updatedEnrollment = await prisma.studentSessionEnrollment.update({
      where: { id: enrollmentId },
      data: {
        lastActiveAt: now,
        activeMs: updatedActiveMs,
        // Update joinedAt if first join
        joinedAt: event === "JOIN" && !enrollment.lastActiveAt ? now : undefined,
      }
    });

    return NextResponse.json({
      success: true,
      activeMs: updatedActiveMs,
      timestamp: now,
    });

  } catch (error) {
    console.error("Error recording presence:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
