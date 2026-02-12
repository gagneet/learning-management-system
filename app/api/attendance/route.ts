/**
 * Attendance API - Bulk mark attendance and generate catch-up packages
 * 
 * POST /api/attendance - Bulk mark attendance for a session
 * GET /api/attendance - List attendance records with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * POST /api/attendance
 * Bulk mark attendance for multiple students in a session
 * Auto-generates catch-up packages for ABSENT students
 * 
 * Body:
 * - sessionId: string (required)
 * - records: Array<{studentId: string, status: "PRESENT" | "ABSENT" | "LATE"}>
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, Permissions.ATTENDANCE_MARK)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.sessionId || !Array.isArray(body.records) || body.records.length === 0) {
      return NextResponse.json(
        { error: "sessionId and records array are required" },
        { status: 400 }
      );
    }

    // Fetch the session
    const sessionRecord = await prisma.session.findUnique({
      where: { id: body.sessionId },
      include: {
        classCohort: true,
        lesson: {
          include: {
            contents: true,
          },
        },
      },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Validate centre access
    if (session.user.role !== "SUPER_ADMIN" && sessionRecord.centreId !== session.user.centreId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Teachers can only mark attendance for their own sessions
    if (session.user.role === "TEACHER" && sessionRecord.classCohort?.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results = [];
    const absentStudents = [];

    // Process each attendance record
    for (const record of body.records) {
      if (!record.studentId || !record.status) {
        continue; // Skip invalid records
      }

      // Upsert attendance record
      const attendanceRecord = await prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: {
            sessionId: body.sessionId,
            studentId: record.studentId,
          },
        },
        create: {
          sessionId: body.sessionId,
          studentId: record.studentId,
          status: record.status,
          markedById: session.user.id,
          markedAt: new Date(),
          notes: record.notes || null,
        },
        update: {
          status: record.status,
          markedById: session.user.id,
          markedAt: new Date(),
          notes: record.notes || null,
        },
      });

      results.push(attendanceRecord);

      // Track absent students for catch-up generation
      if (record.status === "ABSENT") {
        absentStudents.push({
          studentId: record.studentId,
          attendanceRecordId: attendanceRecord.id,
        });
      }
    }

    // Generate catch-up packages for absent students
    const catchUpPackages = [];
    for (const absent of absentStudents) {
      // Check if catch-up already exists
      const existing = await prisma.catchUpPackage.findFirst({
        where: {
          studentId: absent.studentId,
          attendanceRecordId: absent.attendanceRecordId,
        },
      });

      if (!existing) {
        // Create catch-up package
        const catchUp = await prisma.catchUpPackage.create({
          data: {
            studentId: absent.studentId,
            attendanceRecordId: absent.attendanceRecordId,
            title: `Catch-up for ${sessionRecord.title || "Session"}`,
            description: sessionRecord.description || undefined,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            status: "PENDING",
            resources: sessionRecord.lesson?.contents?.map((c) => ({
              id: c.id,
              title: c.title,
              type: c.type,
              url: c.url,
            })) || [],
          },
        });

        catchUpPackages.push(catchUp);

        // Audit log for catch-up creation
        await auditCreate(
          session.user.id,
          session.user.name || session.user.email,
          session.user.role as Role,
          "CatchUpPackage",
          catchUp.id,
          {
            studentId: absent.studentId,
            sessionId: body.sessionId,
            status: "PENDING",
          },
          session.user.centreId,
          request.headers.get("x-forwarded-for") || undefined
        );
      }
    }

    // Audit log for attendance marking
    await auditCreate(
      session.user.id,
      session.user.name || session.user.email,
      session.user.role as Role,
      "AttendanceRecord",
      body.sessionId,
      {
        sessionId: body.sessionId,
        recordCount: results.length,
        absentCount: absentStudents.length,
      },
      session.user.centreId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({
      message: "Attendance marked successfully",
      records: results,
      catchUpPackages,
    });
  } catch (error: any) {
    console.error("Error marking attendance:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/attendance
 * List attendance records with filters
 * 
 * Query params:
 * - sessionId: Filter by session
 * - studentId: Filter by student
 * - classId: Filter by class
 * - status: Filter by status (PRESENT, ABSENT, LATE)
 * - startDate: Filter from date
 * - endDate: Filter to date
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const canViewAll = hasPermission(session, Permissions.ATTENDANCE_VIEW_ALL);
    const canViewOwn = hasPermission(session, Permissions.ATTENDANCE_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);
    const sessionId = searchParams.get("sessionId");
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where: any = {};

    // Add centre filter through session relation
    if (sessionId) {
      where.sessionId = sessionId;
    } else {
      // Filter by centre through session
      where.session = {
        centreId,
      };
    }

    if (status) {
      where.status = status;
    }

    // Students and parents can only view their own/children's attendance
    if (canViewOwn && !canViewAll) {
      if (session.user.role === "STUDENT") {
        where.studentId = session.user.id;
      } else if (session.user.role === "TEACHER") {
        // Teachers can view attendance for sessions they teach
        where.session = {
          ...where.session,
          classCohort: {
            teacherId: session.user.id,
          },
        };
      }
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (classId) {
      where.session = {
        ...where.session,
        classId,
      };
    }

    if (startDate || endDate) {
      where.markedAt = {};
      if (startDate) {
        where.markedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.markedAt.lte = new Date(endDate);
      }
    }

    const attendance = await prisma.attendanceRecord.findMany({
      where,
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
            startDate: true,
            endDate: true,
            classCohort: {
              select: {
                id: true,
                name: true,
                subject: true,
              },
            },
          },
        },
        markedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        catchUpPackage: {
          select: {
            id: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        markedAt: 'desc',
      },
      take: 100, // Limit results
    });

    return NextResponse.json({ attendance });
  } catch (error: any) {
    console.error("Error fetching attendance:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
