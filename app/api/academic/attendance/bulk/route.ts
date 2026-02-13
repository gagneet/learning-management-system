import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

/**
 * POST /api/academic/attendance/bulk
 *
 * Mark attendance for multiple students in a session
 * Auto-generates CatchUpPackage when marking student as ABSENT
 *
 * Body: {
 *   sessionId: string,
 *   attendanceRecords: [
 *     {
 *       studentId: string,
 *       status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED',
 *       notes?: string
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only tutors can mark attendance
    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId, attendanceRecords } = body;

    if (!sessionId || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json(
        { error: 'sessionId and attendanceRecords array are required' },
        { status: 400 }
      );
    }

    // Verify session exists and belongs to tutor
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        studentEnrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (sessionData.tutorId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized for this session' }, { status: 403 });
    }

    const results = {
      created: [] as any[],
      catchUpsGenerated: [] as any[],
      errors: [] as any[],
    };

    // Process each attendance record
    for (const record of attendanceRecords) {
      try {
        const { studentId, status, notes } = record;

        if (!studentId || !status) {
          results.errors.push({
            studentId,
            error: 'studentId and status are required',
          });
          continue;
        }

        // Check if student is enrolled in this session
        const enrollment = sessionData.studentEnrollments.find(
          (e) => e.studentId === studentId
        );

        if (!enrollment) {
          results.errors.push({
            studentId,
            error: 'Student not enrolled in this session',
          });
          continue;
        }

        // Create or update attendance record
        const attendanceRecord = await prisma.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId,
              studentId,
            },
          },
          create: {
            sessionId,
            studentId,
            status,
            notes,
            markedAt: new Date(),
            markedById: session.user.id,
            centreId: session.user.centerId!,
          },
          update: {
            status,
            notes,
            markedAt: new Date(),
            markedById: session.user.id,
          },
        });

        results.created.push(attendanceRecord);

        // CRITICAL BUSINESS LOGIC: Auto-generate Catch-Up Package for ABSENT students
        if (status === 'ABSENT') {
          // Check if catch-up already exists for this session/student
          const existingCatchUp = await prisma.catchUpPackage.findFirst({
            where: {
              sessionId,
              studentId,
            },
          });

          if (!existingCatchUp) {
            // Get session content to assign as catch-up work
            // This could be the exercises that were planned for the session
            const catchUpData: any = {
              sessionTitle: sessionData.title,
              missedDate: sessionData.startTime,
              courseId: enrollment.courseId,
              courseName: enrollment.course?.title || 'N/A',
            };

            // Create catch-up package
            const catchUpPackage = await prisma.catchUpPackage.create({
              data: {
                sessionId,
                studentId,
                attendanceId: attendanceRecord.id,
                status: 'PENDING',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                resources: [], // Empty array - tutor can add resources later
                notes: `Auto-generated catch-up for missed session: ${sessionData.title}`,
                centreId: session.user.centerId!,
              },
            });

            results.catchUpsGenerated.push({
              catchUpPackageId: catchUpPackage.id,
              studentId,
              studentName: enrollment.student.name,
            });

            // Log audit trail
            await createAuditLog({
              userId: session.user.id,
              userName: session.user.name!,
              userRole: session.user.role as any,
              action: 'CREATE',
              resourceType: 'CatchUpPackage',
              resourceId: catchUpPackage.id,
              beforeState: null,
              afterState: catchUpData,
              centreId: session.user.centerId!,
            });
          }
        }

        // Log attendance marking
        await createAuditLog({
          userId: session.user.id,
          userName: session.user.name!,
          userRole: session.user.role as any,
          action: 'CREATE',
          resourceType: 'AttendanceRecord',
          resourceId: attendanceRecord.id,
          beforeState: null,
          afterState: { sessionId, studentId, status },
          centreId: session.user.centerId!,
        });
      } catch (error: any) {
        results.errors.push({
          studentId: record.studentId,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        totalProcessed: attendanceRecords.length,
        successful: results.created.length,
        failed: results.errors.length,
        catchUpsGenerated: results.catchUpsGenerated.length,
      },
      details: results,
    });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Failed to mark attendance', details: error.message },
      { status: 500 }
    );
  }
}
