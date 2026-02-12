/**
 * Tickets API - Operations Support Ticketing System
 * 
 * GET /api/tickets - List tickets with filters
 * POST /api/tickets - Create a new ticket (all users can create)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery, preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * GET /api/tickets
 * List tickets with filters
 * 
 * Query params:
 * - status: Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED, ESCALATED)
 * - type: Filter by type
 * - priority: Filter by priority
 * - assignedToId: Filter by assigned user
 * - createdById: Filter by creator
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const canViewAll = hasPermission(session, Permissions.TICKET_VIEW_ALL);
    const canViewOwn = hasPermission(session, Permissions.TICKET_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const assignedToId = searchParams.get("assignedToId");
    const createdById = searchParams.get("createdById");

    // Build where clause
    const where: any = { centreId };

    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (createdById) where.createdById = createdById;

    // Users with VIEW_OWN can only see tickets they created or are assigned to
    if (canViewOwn && !canViewAll) {
      where.OR = [
        { createdById: session.user.id },
        { assignedToId: session.user.id },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
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
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' }, // HIGH priority first
        { slaDueAt: 'asc' }, // Soonest due first
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    return NextResponse.json({ tickets });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/tickets
 * Create a new ticket
 * Anyone can create a ticket, including students
 * 
 * Body:
 * - title: string (required)
 * - description: string (required)
 * - type: TicketType (required)
 * - priority: TicketPriority (required)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Everyone can create tickets
    if (!hasPermission(session, Permissions.TICKET_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Security: Prevent centreId injection
    preventCentreIdInjection(body);

    // Validate required fields
    if (!body.title || !body.description || !body.type || !body.priority) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, type, priority" },
        { status: 400 }
      );
    }

    // Get SLA config for this ticket type and priority
    const slaConfig = await prisma.sLAConfig.findFirst({
      where: {
        centreId: session.user.centerId,
        ticketType: body.type,
        priority: body.priority,
      },
    });

    // Calculate SLA due date
    const slaDueAt = slaConfig
      ? new Date(Date.now() + slaConfig.resolutionTimeHours * 60 * 60 * 1000)  // Convert hours to ms
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

    // Generate ticket number (TICK-YYYY-NNNN)
    const year = new Date().getFullYear();
    const count = await prisma.ticket.count({
      where: { centreId: session.user.centerId }
    });
    const ticketNumber = `TICK-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: body.subject,  // Correct field name
        description: body.description,
        type: body.type,
        priority: body.priority,
        status: "OPEN",
        slaDueAt,
        centreId: session.user.centerId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await auditCreate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "Ticket",
      ticket.id,
      {
        subject: ticket.subject,  // Correct field name
        type: ticket.type,
        priority: ticket.priority,
        status: ticket.status,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
