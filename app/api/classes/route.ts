/**
 * Classes API - List and Create Class Cohorts
 * 
 * GET /api/classes - List all classes (filtered by centre and role)
 * POST /api/classes - Create a new class cohort
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery, preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * GET /api/classes
 * List all class cohorts for the user's centre
 * 
 * Query params:
 * - status: Filter by status (ACTIVE, COMPLETED, CANCELLED)
 * - subject: Filter by subject
 * - teacherId: Filter by teacher
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const canViewAll = hasPermission(session, Permissions.CLASS_VIEW_ALL);
    const canViewOwn = hasPermission(session, Permissions.CLASS_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);
    const status = searchParams.get("status");
    const subject = searchParams.get("subject");
    const teacherId = searchParams.get("teacherId");

    // Build where clause
    const where: any = { centreId };

    if (status) {
      where.status = status;
    }

    if (subject) {
      where.subject = subject;
    }

    // Teachers can only see their own classes unless they have VIEW_ALL permission
    if (canViewOwn && !canViewAll) {
      where.teacherId = session.user.id;
    } else if (teacherId) {
      where.teacherId = teacherId;
    }

    const classes = await prisma.classCohort.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error("Error fetching classes:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/classes
 * Create a new class cohort
 * 
 * Body:
 * - name: string (required)
 * - subject: string (required)
 * - description: string (optional)
 * - startDate: string ISO date (required)
 * - endDate: string ISO date (optional)
 * - capacity: number (optional)
 * - teacherId: string (optional, defaults to current user for teachers)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, Permissions.CLASS_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    // Security: Prevent centreId injection
    preventCentreIdInjection(body);

    // Validate required fields
    if (!body.name || !body.subject || !body.startDate) {
      return NextResponse.json(
        { error: "Missing required fields: name, subject, startDate" },
        { status: 400 }
      );
    }

    // Get centreId from session
    const centreId = session.user.centreId;

    // Determine teacher
    let teacherId = body.teacherId;
    if (!teacherId) {
      // If teacher is creating, assign to themselves
      if (session.user.role === "TEACHER") {
        teacherId = session.user.id;
      } else {
        return NextResponse.json(
          { error: "teacherId is required" },
          { status: 400 }
        );
      }
    }

    // Create the class
    const classCohort = await prisma.classCohort.create({
      data: {
        name: body.name,
        subject: body.subject,
        description: body.description,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        capacity: body.capacity || null,
        status: "ACTIVE",
        centreId,
        teacherId,
      },
      include: {
        teacher: {
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
      session.user.name || session.user.email,
      session.user.role as Role,
      "ClassCohort",
      classCohort.id,
      {
        name: classCohort.name,
        subject: classCohort.subject,
        teacherId: classCohort.teacherId,
      },
      centreId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ class: classCohort }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating class:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
