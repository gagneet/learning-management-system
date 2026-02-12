/**
 * Single Class Cohort API - CRUD operations
 * 
 * GET /api/cohorts/[id] - Get cohort details
 * PUT /api/cohorts/[id] - Update cohort
 * DELETE /api/cohorts/[id] - Delete cohort
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess, preventCentreIdInjection } from "@/lib/tenancy";
import { auditUpdate, auditDelete } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * GET /api/cohorts/[id]
 * Get cohort details with members and sessions
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

    if (!hasPermission(session, Permissions.CLASS_VIEW_ALL)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const cohort = await prisma.classCohort.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        sessions: {
          include: {
            studentEnrollments: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
                lesson: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
          orderBy: {
            startTime: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    // Validate centre access
    validateCentreAccess(session, cohort.centreId);

    return NextResponse.json({ cohort });
  } catch (error: any) {
    console.error("Error fetching cohort:", error);
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
 * PUT /api/cohorts/[id]
 * Update cohort details
 * 
 * Body:
 * - name: string (optional)
 * - description: string (optional)
 * - subject: AgeTier (optional)
 * - teacherId: string (optional)
 * - maxCapacity: number (optional)
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

    if (!hasPermission(session, Permissions.CLASS_UPDATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    preventCentreIdInjection(body);

    // Get existing cohort
    const existingCohort = await prisma.classCohort.findUnique({
      where: { id },
    });

    if (!existingCohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    // Validate centre access
    validateCentreAccess(session, existingCohort.centreId);

    // If changing tutor, verify new tutor
    if (body.teacherId && body.teacherId !== existingCohort.teacherId) {
      const tutor = await prisma.user.findUnique({
        where: { id: body.teacherId },
        select: { id: true, centerId: true, role: true },
      });

      if (!tutor) {
        return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
      }

      if (tutor.centerId !== existingCohort.centreId && session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Tutor must belong to the same centre" }, { status: 403 });
      }

      if (tutor.role !== "TEACHER") {
        return NextResponse.json({ error: "User must be a teacher" }, { status: 400 });
      }
    }

    // Capture before state
    const beforeState = {
      name: existingCohort.name,
      subject: existingCohort.subject,
      description: existingCohort.description,
      teacherId: existingCohort.teacherId,
      maxCapacity: existingCohort.maxCapacity,
      status: existingCohort.status,
    };

    // Update cohort
    const cohort = await prisma.classCohort.update({
      where: { id },
      data: {
        name: body.name,
        subject: body.subject,
        description: body.description,
        teacherId: body.teacherId,
        maxCapacity: body.maxCapacity,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      },
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
    });

    // Audit log
    await auditUpdate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "ClassCohort",
      cohort.id,
      beforeState,
      {
        name: cohort.name,
        description: cohort.description,
        subject: cohort.subject,
        teacherId: cohort.teacherId,
        maxCapacity: cohort.maxCapacity,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ cohort });
  } catch (error: any) {
    console.error("Error updating cohort:", error);
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
 * DELETE /api/cohorts/[id]
 * Delete a cohort
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

    if (!hasPermission(session, Permissions.CLASS_DELETE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Get existing cohort
    const existingCohort = await prisma.classCohort.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
    });

    if (!existingCohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    // Validate centre access
    validateCentreAccess(session, existingCohort.centreId);

    // Check if cohort has members or sessions
    if (existingCohort._count.members > 0 || existingCohort._count.sessions > 0) {
      return NextResponse.json(
        { error: "Cannot delete cohort with existing members or sessions" },
        { status: 400 }
      );
    }

    // Delete cohort
    await prisma.classCohort.delete({
      where: { id },
    });

    // Audit log
    await auditDelete(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "ClassCohort",
      id,
      {
        name: existingCohort.name,
        subject: existingCohort.subject,
        teacherId: existingCohort.teacherId,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ success: true, message: "Cohort deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting cohort:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
