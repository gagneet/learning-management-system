/**
 * Class Detail API - GET, UPDATE, DELETE a specific class
 * 
 * GET /api/classes/[id] - Get class details
 * PUT /api/classes/[id] - Update class
 * DELETE /api/classes/[id] - Delete (archive) class
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess, preventCentreIdInjection } from "@/lib/tenancy";
import { auditUpdate, auditDelete } from "@/lib/audit";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/classes/[id]
 * Get detailed information about a specific class
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: classId } = await params;

    // Fetch the class
    const classCohort = await prisma.classCohort.findUnique({
      where: { id: classId },
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
          where: {
            status: "ACTIVE",
          },
        },
        sessions: {
          orderBy: {
            startTime: 'desc',  // Correct field name
          },
          take: 10, // Latest 10 sessions
        },
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
    });

    if (!classCohort) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Validate centre access
    validateCentreAccess(session, classCohort.centreId);  // Database field uses British spelling

    // Check if user can view this class
    const canViewAll = hasPermission(session, Permissions.CLASS_VIEW_ALL);
    const canViewOwn = hasPermission(session, Permissions.CLASS_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If can only view own, check if they are the teacher
    if (canViewOwn && !canViewAll && classCohort.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ class: classCohort });
  } catch (error: any) {
    console.error("Error fetching class:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/classes/[id]
 * Update class details
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, Permissions.CLASS_UPDATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: classId } = await params;
    const body = await request.json();

    // Security: Prevent centreId injection
    preventCentreIdInjection(body);

    // Fetch the existing class
    const existingClass = await prisma.classCohort.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Validate centre access
    validateCentreAccess(session, existingClass.centreId);

    // Teachers can only update their own classes
    if (session.user.role === "TEACHER" && existingClass.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.status !== undefined) updateData.status = body.status;

    // Update the class
    const updatedClass = await prisma.classCohort.update({
      where: { id: classId },
      data: updateData,
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
    await auditUpdate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "ClassCohort",
      updatedClass.id,
      existingClass,
      updatedClass,
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ class: updatedClass });
  } catch (error: any) {
    console.error("Error updating class:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/classes/[id]
 * Delete (archive) a class
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, Permissions.CLASS_DELETE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: classId } = await params;

    // Fetch the existing class
    const existingClass = await prisma.classCohort.findUnique({
      where: { id: classId },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Validate centre access
    validateCentreAccess(session, existingClass.centreId);

    // Soft delete by setting status to CANCELLED
    const deletedClass = await prisma.classCohort.update({
      where: { id: classId },
      data: {
        status: "CANCELLED",
      },
    });

    // Audit log
    await auditDelete(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "ClassCohort",
      deletedClass.id,
      existingClass,
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ message: "Class archived successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting class:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
