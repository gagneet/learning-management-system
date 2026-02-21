import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { preventCentreIdInjection } from "@/lib/tenancy";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * ⚡ Bolt Optimization: Batch Homework Creation
 * Reduces multiple sequential API calls to a single database transaction.
 * Improves performance when assigning multiple exercises to multiple students.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only teachers, supervisors, and admins can create homework
  if (!["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR", "TEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Security check: Prevent centreId injection
    preventCentreIdInjection(body);

    const { assignments } = body;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Assignments array is required" },
        { status: 400 }
      );
    }

    // Security check: Verify all students and courses belong to the same center
    const uniqueStudentIds = Array.from(new Set(assignments.map((a: any) => a.studentId).filter(Boolean)));
    const uniqueCourseIds = Array.from(new Set(assignments.map((a: any) => a.courseId).filter(Boolean)));

    const [students, courses] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { in: uniqueStudentIds as string[] },
          role: "STUDENT"
        },
        select: { id: true, centerId: true }
      }),
      prisma.course.findMany({
        where: { id: { in: uniqueCourseIds as string[] } },
        select: { id: true, centerId: true }
      })
    ]);

    if (students.length !== uniqueStudentIds.length) {
      return NextResponse.json({ success: false, error: "One or more students not found or invalid" }, { status: 404 });
    }

    if (courses.length !== uniqueCourseIds.length) {
      return NextResponse.json({ success: false, error: "One or more courses not found" }, { status: 404 });
    }

    const studentMap = new Map(students.map(s => [s.id, s.centerId]));
    const courseMap = new Map(courses.map(c => [c.id, c.centerId]));

    // Batch must belong to a single center for data integrity and audit logging
    const targetCenterId = students[0].centerId;

    if (user.role !== "SUPER_ADMIN" && targetCenterId !== user.centerId) {
      return NextResponse.json({ success: false, error: "Forbidden: Target center mismatch" }, { status: 403 });
    }

    for (const a of assignments) {
      const studentCenterId = studentMap.get(a.studentId);
      const courseCenterId = courseMap.get(a.courseId);

      if (studentCenterId !== targetCenterId) {
        return NextResponse.json({ success: false, error: "Batch assignments must belong to the same center" }, { status: 400 });
      }

      if (courseCenterId !== studentCenterId) {
        return NextResponse.json({
          success: false,
          error: `Conflict: Student ${a.studentId} and course ${a.courseId} belong to different centers`
        }, { status: 400 });
      }
    }

    // Prepare data for batch creation
    const homeworkData = assignments.map((a: any) => ({
      studentId: a.studentId,
      courseId: a.courseId,
      centreId: targetCenterId, // Derived from assignments
      exerciseId: a.exerciseId,
      sessionEnrollmentId: a.sessionEnrollmentId || null,
      notes: a.notes || null,
      dueDate: new Date(a.dueDate),
      assignedById: user.id,
      status: "NOT_STARTED" as const,
    }));

    // Perform batch creation
    const result = await prisma.homeworkAssignment.createMany({
      data: homeworkData,
    });

    // Create audit log for the batch operation
    await createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      userRole: user.role as Role,
      action: "CREATE",
      resourceType: "HomeworkAssignment",
      resourceId: "batch",
      afterState: { count: result.count, studentCount: assignments.length },
      centreId: targetCenterId, // Derived from assignments
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      metadata: { isBatch: true }
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating batch homework:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create batch homework" },
      { status: 500 }
    );
  }
}
