import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/help-requests/:id - Get specific help request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: helpRequestId } = await params;

  try {
    const helpRequest = await prisma.helpRequest.findUnique({
      where: { id: helpRequestId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            centerId: true,
            parentId: true,
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
                sessionMode: true,
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
    });

    if (!helpRequest) {
      return NextResponse.json(
        { success: false, error: "Help request not found" },
        { status: 404 }
      );
    }

    // Authorization
    if (user.role === "STUDENT" && helpRequest.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "PARENT") {
      if (helpRequest.student.parentId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      !["STUDENT", "PARENT"].includes(user.role)
    ) {
      if (helpRequest.student.centerId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: helpRequest,
    });
  } catch (error) {
    console.error("Error fetching help request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch help request" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/help-requests/:id - Update help request status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: helpRequestId } = await params;

  try {
    const body = await request.json();
    const { status, responseText } = body;

    // Get existing help request
    const existing = await prisma.helpRequest.findUnique({
      where: { id: helpRequestId },
      include: {
        student: {
          select: {
            id: true,
            centerId: true,
          },
        },
        enrollment: {
          select: {
            session: {
              select: {
                tutorId: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Help request not found" },
        { status: 404 }
      );
    }

    // Authorization
    // Students can only cancel their own requests
    if (user.role === "STUDENT") {
      if (existing.studentId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Students can only change status to CANCELLED
      if (status && status !== "CANCELLED") {
        return NextResponse.json(
          { error: "Students can only cancel help requests" },
          { status: 403 }
        );
      }
    }

    // Teachers/tutors/admins can update any help request in their center
    if (
      !["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR", "TEACHER"].includes(
        user.role
      ) &&
      user.role !== "STUDENT"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "STUDENT" &&
      existing.student.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};

    if (status !== undefined) {
      const validStatuses = [
        "PENDING",
        "ACKNOWLEDGED",
        "IN_PROGRESS",
        "RESOLVED",
        "CANCELLED",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.status = status;

      // Set timestamps based on status transitions
      if (status === "ACKNOWLEDGED" && !existing.acknowledgedAt) {
        updateData.acknowledgedAt = new Date();
        updateData.resolvedById = user.id;
      }

      if (
        status === "IN_PROGRESS" &&
        existing.status === "ACKNOWLEDGED"
      ) {
        updateData.resolvedById = user.id;
      }

      if (status === "RESOLVED") {
        updateData.resolvedAt = new Date();
        if (!updateData.resolvedById && !existing.resolvedById) {
          updateData.resolvedById = user.id;
        }
      }
    }

    if (responseText !== undefined) {
      updateData.responseText = responseText;
      if (!existing.resolvedById) {
        updateData.resolvedById = user.id;
      }
    }

    // Update help request
    const helpRequest = await prisma.helpRequest.update({
      where: { id: helpRequestId },
      data: updateData,
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
        resolvedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // TODO: Trigger real-time notification to student via WebSocket

    return NextResponse.json({
      success: true,
      data: helpRequest,
    });
  } catch (error) {
    console.error("Error updating help request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update help request" },
      { status: 500 }
    );
  }
}
