/**
 * Single Ticket API - GET, PUT, DELETE operations
 * 
 * GET /api/tickets/[id] - Fetch single ticket with comments and attachments
 * PUT /api/tickets/[id] - Update ticket (status, priority, assignedToId)
 * DELETE /api/tickets/[id] - Delete ticket (only if creator or admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess, preventCentreIdInjection } from "@/lib/tenancy";
import { auditUpdate, auditDelete } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * GET /api/tickets/[id]
 * Fetch single ticket with comments and attachments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    validateCentreAccess(session, ticket.centreId);

    const canViewAll = hasPermission(session, Permissions.TICKET_VIEW_ALL);
    const canViewOwn = hasPermission(session, Permissions.TICKET_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (canViewOwn && !canViewAll) {
      if (ticket.createdById !== session.user.id && ticket.assignedToId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/tickets/[id]
 * Update ticket (status, priority, assignedToId)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.TICKET_UPDATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    preventCentreIdInjection(body);

    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    validateCentreAccess(session, existingTicket.centreId);

    const updateData: any = {};

    if (body.status) {
      updateData.status = body.status;
    }
    if (body.priority) {
      updateData.priority = body.priority;
    }
    if (body.assignedToId !== undefined) {
      updateData.assignedToId = body.assignedToId;
    }
    if (body.resolution !== undefined) {
      updateData.resolution = body.resolution;
    }

    const beforeState = {
      status: existingTicket.status,
      priority: existingTicket.priority,
      assignedToId: existingTicket.assignedToId,
      resolution: existingTicket.resolution,
    };

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await auditUpdate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "Ticket",
      updatedTicket.id,
      beforeState,
      {
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        assignedToId: updatedTicket.assignedToId,
        resolution: updatedTicket.resolution,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error: any) {
    console.error("Error updating ticket:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/tickets/[id]
 * Delete ticket (only if creator or admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    validateCentreAccess(session, ticket.centreId);

    const isAdmin = hasPermission(session, Permissions.TICKET_VIEW_ALL);
    const isCreator = ticket.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const beforeState = {
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      type: ticket.type,
      priority: ticket.priority,
    };

    await prisma.ticket.delete({
      where: { id },
    });

    await auditDelete(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "Ticket",
      ticket.id,
      beforeState,
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ message: "Ticket deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting ticket:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
