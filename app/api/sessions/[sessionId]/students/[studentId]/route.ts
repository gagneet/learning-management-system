import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission, Permissions } from "@/lib/rbac";
import { preventCentreIdInjection } from "@/lib/tenancy";
import { auditUpdate, auditDelete } from "@/lib/audit";
import { Role } from "@prisma/client";

// PATCH /api/sessions/[sessionId]/students/[studentId] - Update student enrollment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; studentId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { sessionId, studentId } = await params;

  if (!hasPermission(session, Permissions.SESSION_MANAGE_STUDENTS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    preventCentreIdInjection(body);

    const { courseId, lessonId, exerciseContent, assessmentData, notes, completed } = body;

    // Verify session exists
    const liveSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, tutorId: true },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Teachers can only manage students in their own sessions
    if (
      user.role === "TEACHER" &&
      liveSession.tutorId !== user.id
    ) {
      return NextResponse.json(
        { error: "You can only manage students in your own sessions" },
        { status: 403 }
      );
    }

    // Get existing enrollment
    const existingEnrollment = await prisma.studentSessionEnrollment.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
      include: {
        student: {
          select: { id: true, name: true, centerId: true },
        },
      },
    });

    if (!existingEnrollment) {
      return NextResponse.json(
        { error: "Student enrollment not found" },
        { status: 404 }
      );
    }

    // Check center access
    if (
      user.role !== "SUPER_ADMIN" &&
      existingEnrollment.student.centerId !== user.centerId
    ) {
      return NextResponse.json(
        { error: "Student must belong to your center" },
        { status: 403 }
      );
    }

    // Verify course if provided
    if (courseId !== undefined) {
      if (courseId !== null) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          select: { centerId: true },
        });

        if (!course) {
          return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        if (user.role !== "SUPER_ADMIN" && course.centerId !== user.centerId) {
          return NextResponse.json(
            { error: "Course must belong to your center" },
            { status: 403 }
          );
        }
      }
    }

    // Verify lesson if provided
    if (lessonId !== undefined && lessonId !== null) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }
    }

    // Build update data object
    const updateData: any = {};
    if (courseId !== undefined) updateData.courseId = courseId;
    if (lessonId !== undefined) updateData.lessonId = lessonId;
    if (exerciseContent !== undefined) updateData.exerciseContent = exerciseContent;
    if (assessmentData !== undefined) updateData.assessmentData = assessmentData;
    if (notes !== undefined) updateData.notes = notes;
    if (completed !== undefined) updateData.completed = completed;

    // Update enrollment
    const updatedEnrollment = await prisma.studentSessionEnrollment.update({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
      data: updateData,
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        course: {
          select: { id: true, title: true, slug: true },
        },
        lesson: {
          select: { id: true, title: true, order: true },
        },
      },
    });

    // Create audit log
    await auditUpdate(
      user.id,
      user.name || "Unknown",
      user.role as Role,
      "StudentSessionEnrollment",
      updatedEnrollment.id,
      {
        courseId: existingEnrollment.courseId,
        lessonId: existingEnrollment.lessonId,
        completed: existingEnrollment.completed,
      },
      updateData,
      user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(updatedEnrollment);
  } catch (error) {
    console.error("Error updating student enrollment:", error);
    return NextResponse.json(
      { error: "Failed to update student enrollment" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[sessionId]/students/[studentId] - Remove student from session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; studentId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { sessionId, studentId } = await params;

  if (!hasPermission(session, Permissions.SESSION_MANAGE_STUDENTS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Verify session exists
    const liveSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, tutorId: true },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Teachers can only manage students in their own sessions
    if (
      user.role === "TEACHER" &&
      liveSession.tutorId !== user.id
    ) {
      return NextResponse.json(
        { error: "You can only manage students in your own sessions" },
        { status: 403 }
      );
    }

    // Get existing enrollment
    const existingEnrollment = await prisma.studentSessionEnrollment.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
      include: {
        student: {
          select: { id: true, name: true, centerId: true },
        },
      },
    });

    if (!existingEnrollment) {
      return NextResponse.json(
        { error: "Student enrollment not found" },
        { status: 404 }
      );
    }

    // Check center access
    if (
      user.role !== "SUPER_ADMIN" &&
      existingEnrollment.student.centerId !== user.centerId
    ) {
      return NextResponse.json(
        { error: "Student must belong to your center" },
        { status: 403 }
      );
    }

    // Delete enrollment
    await prisma.studentSessionEnrollment.delete({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
    });

    // Create audit log
    await auditDelete(
      user.id,
      user.name || "Unknown",
      user.role as Role,
      "StudentSessionEnrollment",
      existingEnrollment.id,
      {
        sessionId,
        studentId,
        studentName: existingEnrollment.student.name,
        courseId: existingEnrollment.courseId,
        lessonId: existingEnrollment.lessonId,
      },
      user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ message: "Student removed from session successfully" });
  } catch (error) {
    console.error("Error removing student from session:", error);
    return NextResponse.json(
      { error: "Failed to remove student from session" },
      { status: 500 }
    );
  }
}
