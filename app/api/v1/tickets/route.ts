import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/v1/tickets - List tickets (filtered by center)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = { centreId: user.centerId };
    if (status) where.status = status;

    // Students/Parents only see their own tickets
    if (user.role === "STUDENT" || user.role === "PARENT") {
      where.createdById = user.id;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        createdBy: { select: { name: true, role: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/v1/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    const body = await request.json();
    const { type, priority, subject, description } = body;

    if (!type || !priority || !subject || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate ticket number (e.g., TICK-2026-0001)
    const count = await prisma.ticket.count();
    const ticketNumber = `TICK-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    // Calculate SLA due date (mock logic: +48 hours)
    const slaDueAt = new Date();
    slaDueAt.setHours(slaDueAt.getHours() + 48);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        type,
        priority,
        subject,
        description,
        createdById: user.id,
        centreId: user.centerId,
        slaDueAt,
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        userId: user.id,
        userName: user.name || "Unknown",
        userRole: user.role as Role,
        action: "CREATE",
        resourceType: "Ticket",
        resourceId: ticket.id,
        afterState: ticket as any,
        centreId: user.centerId,
      }
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
