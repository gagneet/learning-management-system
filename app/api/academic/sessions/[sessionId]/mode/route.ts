/**
 * Session Mode API - Update session mode (ONLINE/PHYSICAL)
 *
 * PATCH /api/sessions/[sessionId]/mode - Update session mode
 *
 * This endpoint allows teachers/supervisors to switch a session between
 * ONLINE and PHYSICAL modes and set the appropriate meeting link or location.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess } from "@/lib/tenancy";
import { auditUpdate } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * PATCH /api/sessions/[sessionId]/mode
 * Update session mode and related fields
 *
 * Body:
 * - sessionMode: "ONLINE" | "PHYSICAL" (required)
 * - meetingLink: string (optional, for ONLINE mode)
 * - physicalLocation: string (optional, for PHYSICAL mode)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - Only Teacher, Supervisor, and Admins can update session mode
    if (!hasPermission(session, Permissions.SESSION_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { sessionId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.sessionMode || !["ONLINE", "PHYSICAL"].includes(body.sessionMode)) {
      return NextResponse.json(
        { error: "Invalid sessionMode. Must be ONLINE or PHYSICAL" },
        { status: 400 }
      );
    }

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

    // Validate centre access using session.centreId directly and fail closed if missing
    const sessionCentreId = existingSession.centreId;
    if (!sessionCentreId) {
      return NextResponse.json(
        { error: "Session centre is not configured" },
        { status: 403 }
      );
    }
    validateCentreAccess(session, sessionCentreId);

    // Prepare update data based on mode
    const updateData: any = {
      sessionMode: body.sessionMode,
    };

    if (body.sessionMode === "ONLINE") {
      // For ONLINE mode, set meeting link and clear physical location
      updateData.meetingLink = body.meetingLink || existingSession.meetingLink;
      updateData.physicalLocation = null;

      // Basic URL validation for meeting link if provided
      if (body.meetingLink) {
        try {
          new URL(body.meetingLink);
        } catch {
          return NextResponse.json(
            { error: "Invalid meeting link URL" },
            { status: 400 }
          );
        }
      }
    } else if (body.sessionMode === "PHYSICAL") {
      // For PHYSICAL mode, set location and clear meeting link
      updateData.physicalLocation = body.physicalLocation || existingSession.physicalLocation;
      updateData.meetingLink = null;
    }

    // Capture before state for audit
    const beforeState = {
      sessionMode: existingSession.sessionMode,
      meetingLink: existingSession.meetingLink,
      physicalLocation: existingSession.physicalLocation,
    };

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
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

    // Audit log
    await auditUpdate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "Session",
      updatedSession.id,
      beforeState,
      {
        sessionMode: updatedSession.sessionMode,
        meetingLink: updatedSession.meetingLink,
        physicalLocation: updatedSession.physicalLocation,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ session: updatedSession });
  } catch (error: any) {
    console.error("Error updating session mode:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
