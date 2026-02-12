/**
 * Class Cohorts API - Full CRUD operations
 * 
 * GET /api/cohorts - List all cohorts
 * POST /api/cohorts - Create a new cohort
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery, preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * GET /api/cohorts
 * List all cohorts (filtered by centre)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.CLASS_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);

    const cohorts = await prisma.classCohort.findMany({
      where: { centreId },
      include: {
        tutor: {
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
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ cohorts });
  } catch (error: any) {
    console.error("Error fetching cohorts:", error);
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
 * POST /api/cohorts
 * Create a new cohort
 * 
 * Body:
 * - name: string (required)
 * - description: string (optional)
 * - ageTier: AgeTier (required)
 * - tutorId: string (required)
 * - capacity: number (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.CLASS_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    preventCentreIdInjection(body);

    // Validate required fields
    if (!body.name || !body.ageTier || !body.tutorId) {
      return NextResponse.json(
        { error: "Missing required fields: name, ageTier, tutorId" },
        { status: 400 }
      );
    }

    // Verify tutor exists and belongs to the same centre
    const tutor = await prisma.user.findUnique({
      where: { id: body.tutorId },
      select: { id: true, centerId: true, role: true },
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    if (tutor.centerId !== session.user.centerId && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Tutor must belong to your centre" }, { status: 403 });
    }

    if (tutor.role !== "TEACHER") {
      return NextResponse.json({ error: "User must be a teacher" }, { status: 400 });
    }

    // Create cohort
    const cohort = await prisma.classCohort.create({
      data: {
        name: body.name,
        description: body.description,
        ageTier: body.ageTier,
        tutorId: body.tutorId,
        capacity: body.capacity || 30,
        centreId: session.user.centerId,
      },
      include: {
        tutor: {
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
      "ClassCohort",
      cohort.id,
      {
        name: cohort.name,
        ageTier: cohort.ageTier,
        tutorId: cohort.tutorId,
        capacity: cohort.capacity,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ cohort }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating cohort:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
