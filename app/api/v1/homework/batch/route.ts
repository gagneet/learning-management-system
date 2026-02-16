import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const { assignments } = body;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { success: false, error: "Assignments array is required" },
        { status: 400 }
      );
    }

    // Prepare data for batch creation
    // Prepare data for batch creation
    const homeworkData = assignments.map((a: any) => {
      if (!a.studentId || !a.courseId || !a.exerciseId || !a.dueDate) {
        throw new Error("Missing required fields: studentId, courseId, exerciseId, and dueDate are required");
      }
      
      return {
        studentId: a.studentId,
        courseId: a.courseId,
        centreId: user.centerId!,
        exerciseId: a.exerciseId,
        sessionEnrollmentId: a.sessionEnrollmentId || null,
        notes: a.notes || null,
        dueDate: new Date(a.dueDate),
        assignedById: user.id,
        status: "NOT_STARTED" as const,
      };
    });

    // Perform batch creation
    const result = await prisma.homeworkAssignment.createMany({
      data: homeworkData,
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
