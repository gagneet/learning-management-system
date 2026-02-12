/**
 * Catch-Up Packages API
 * 
 * GET /api/catchups - List catch-up packages (filtered by role)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery } from "@/lib/tenancy";

/**
 * GET /api/catchups
 * List catch-up packages for students
 * 
 * Query params:
 * - studentId: Filter by student (admin/teacher only)
 * - status: Filter by status (PENDING, IN_PROGRESS, COMPLETED, OVERDUE)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const canViewAll = hasPermission(session, Permissions.CATCHUP_VIEW_ALL);
    const canViewOwn = hasPermission(session, Permissions.CATCHUP_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {};

    // Filter by centre through student
    where.student = {
      centreId,
    };

    if (status) {
      where.status = status;
    }

    // Students can only view their own catch-ups
    if (canViewOwn && !canViewAll) {
      if (session.user.role === "STUDENT") {
        where.studentId = session.user.id;
      } else if (session.user.role === "TEACHER") {
        // Teachers can view catch-ups for their students (through classes)
        where.student = {
          ...where.student,
          classMemberships: {
            some: {
              classCohort: {
                teacherId: session.user.id,
              },
            },
          },
        };
      } else if (session.user.role === "PARENT") {
        // Parents can view their children's catch-ups
        where.student = {
          ...where.student,
          parentId: session.user.id,
        };
      }
    } else if (studentId) {
      where.studentId = studentId;
    }

    // Update overdue status
    await prisma.catchUpPackage.updateMany({
      where: {
        dueDate: {
          lt: new Date(),
        },
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    const catchUps = await prisma.catchUpPackage.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        attendanceRecord: {
          include: {
            session: {
              select: {
                id: true,
                title: true,
                startDate: true,
                classCohort: {
                  select: {
                    id: true,
                    name: true,
                    subject: true,
                    teacher: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { dueDate: 'asc' }, // Earliest due date first
      ],
      take: 100, // Limit results
    });

    return NextResponse.json({ catchUps });
  } catch (error: any) {
    console.error("Error fetching catch-ups:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
