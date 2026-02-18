/**
 * Session Attendance API - Bulk attendance marking
 *
 * POST /api/sessions/[sessionId]/attendance - Mark attendance for multiple students
 *
 * This endpoint allows teachers to mark attendance for all students in a session.
 * When a student is marked as ABSENT, it automatically generates a CatchUpPackage.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * POST /api/sessions/[sessionId]/attendance
 * Mark attendance for students in bulk
 *
 * Body:
 * - attendance: Array<{ studentId: string, status: AttendanceStatus, notes?: string }>
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - Teacher, Supervisor, or Admin
    if (!hasPermission(session, Permissions.ATTENDANCE_MARK)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { sessionId } = await params;
    const body = await request.json();

    // Validate attendance array
    if (!Array.isArray(body.attendance) || body.attendance.length === 0) {
      return NextResponse.json(
        { error: "attendance must be a non-empty array" },
        { status: 400 }
      );
    }

    // Get session details
    const liveSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        studentEnrollments: {
          include: {
            course: {
              select: {
                id: true,
                centerId: true,
              },
            },
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            centreId: true,
          },
        },
      },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Validate centre access using class centreId or first enrollment's course centreId
    const sessionCentreId = liveSession.class?.centreId ||
                            liveSession.studentEnrollments?.[0]?.course?.centerId;

    if (sessionCentreId) {
      validateCentreAccess(session, sessionCentreId);
    }

    // Process each attendance record
    const results = [];
    const catchUpPackages = [];

    for (const record of body.attendance) {
      if (!record.studentId || !record.status) {
        continue; // Skip invalid records
      }

      // Create or update attendance record
      const attendanceRecord = await prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: sessionId,
            studentId: record.studentId,
          },
        },
        update: {
          status: record.status,
          notes: record.notes,
          markedAt: new Date(),
          markedById: session.user.id,
        },
        create: {
          sessionId: sessionId,
          studentId: record.studentId,
          status: record.status,
          notes: record.notes,
          markedAt: new Date(),
          markedById: session.user.id,
          centreId: session.user.centerId || '',
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      results.push(attendanceRecord);

      // Auto-generate CatchUpPackage for ABSENT students
      if (record.status === "ABSENT") {
        // Check if catch-up already exists
        const existingCatchUp = await prisma.catchUpPackage.findFirst({
          where: {
            sessionId: sessionId,
            studentId: record.studentId,
          },
        });

        if (!existingCatchUp) {
          // Calculate due date (7 days from now)
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7);

          const catchUp = await prisma.catchUpPackage.create({
            data: {
              attendanceId: attendanceRecord.id,
              sessionId: sessionId,
              studentId: record.studentId,
              status: "PENDING",
              dueDate: dueDate,
              resources: [],
              notes: `Missed session on ${liveSession.startTime.toLocaleDateString()}. Please review the materials and complete the catch-up activities.`,
              centreId: session.user.centerId || '',
            },
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              session: {
                select: {
                  id: true,
                  title: true,
                  startTime: true,
                },
              },
            },
          });

          catchUpPackages.push(catchUp);

          // Audit log for catch-up creation
          await auditCreate(
            session.user.id,
            session.user.name || session.user.email || 'Unknown',
            session.user.role as Role,
            "CatchUpPackage",
            catchUp.id,
            {
              studentId: catchUp.studentId,
              sessionId: catchUp.sessionId,
              status: catchUp.status,
              dueDate: catchUp.dueDate,
            },
            session.user.centerId || '',
            request.headers.get("x-forwarded-for") || ''
          );
        }
      }

      // Audit log for attendance
      await auditCreate(
        session.user.id,
        session.user.name || session.user.email || 'Unknown',
        session.user.role as Role,
        "AttendanceRecord",
        attendanceRecord.id,
        {
          sessionId: attendanceRecord.sessionId,
          studentId: attendanceRecord.studentId,
          status: attendanceRecord.status,
          notes: attendanceRecord.notes,
        },
        session.user.centerId,
        request.headers.get("x-forwarded-for") || undefined
      );
    }

    return NextResponse.json({
      success: true,
      attendance: results,
      catchUpPackages: catchUpPackages,
      message: `Marked attendance for ${results.length} student(s). Generated ${catchUpPackages.length} catch-up package(s).`,
    });
  } catch (error: any) {
    console.error("Error marking attendance:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
