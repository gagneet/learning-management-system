/**
 * Ticket Escalation API
 * 
 * POST /api/tickets/[id]/escalate - Manually escalate a ticket to higher priority
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess } from "@/lib/tenancy";
import { auditEscalate } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * POST /api/tickets/[id]/escalate
 * Manually escalate a ticket to higher priority
 */
export async function POST(
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

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    validateCentreAccess(session, ticket.centreId);

    const beforeState = {
      status: ticket.status,
      priority: ticket.priority,
    };

    let newPriority = ticket.priority;
    if (ticket.priority === "LOW") {
      newPriority = "MEDIUM";
    } else if (ticket.priority === "MEDIUM") {
      newPriority = "HIGH";
    } else if (ticket.priority === "HIGH") {
      newPriority = "URGENT";
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: "ESCALATED",
        priority: newPriority,
      },
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

    await prisma.ticketComment.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        userName: session.user.name || session.user.email || 'Unknown',
        text: `Ticket escalated from ${ticket.priority} to ${newPriority} priority`,
        isInternal: false,
        isSystem: true,
      },
    });

    await auditEscalate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "Ticket",
      updatedTicket.id,
      beforeState,
      {
        status: updatedTicket.status,
        priority: updatedTicket.priority,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error: any) {
    console.error("Error escalating ticket:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
