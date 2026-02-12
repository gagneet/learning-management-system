import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission, Permissions } from "@/lib/rbac";
import { preventCentreIdInjection } from "@/lib/tenancy";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

// GET /api/sessions/[sessionId]/students - Get all students enrolled in a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { sessionId } = await params;

  if (!hasPermission(session, Permissions.SESSION_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get session first to check permissions
    const liveSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, tutorId: true },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Teachers can only view students in their own sessions
    if (
      user.role === "TEACHER" &&
      liveSession.tutorId !== user.id
    ) {
      return NextResponse.json(
        { error: "You can only view students in your own sessions" },
        { status: 403 }
      );
    }

    // Get all student enrollments for this session
    const enrollments = await prisma.studentSessionEnrollment.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            centerId: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Filter by center for non-super-admins
    const filteredEnrollments = user.role === "SUPER_ADMIN"
      ? enrollments
      : enrollments.filter((e) => e.student.centerId === user.centerId);

    return NextResponse.json(filteredEnrollments);
  } catch (error) {
    console.error("Error fetching session students:", error);
    return NextResponse.json(
      { error: "Failed to fetch session students" },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[sessionId]/students - Add a student to an existing session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { sessionId } = await params;

  if (!hasPermission(session, Permissions.SESSION_MANAGE_STUDENTS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    preventCentreIdInjection(body);

    const { studentId, courseId, lessonId, exerciseContent } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

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

    // Verify student exists and is a student
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, centerId: true, role: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { error: "User is not a student" },
        { status: 400 }
      );
    }

    if (user.role !== "SUPER_ADMIN" && student.centerId !== user.centerId) {
      return NextResponse.json(
        { error: "Student must belong to your center" },
        { status: 403 }
      );
    }

    // Verify course if provided
    if (courseId) {
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

    // Verify lesson if provided
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.studentSessionEnrollment.findUnique({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Student is already enrolled in this session" },
        { status: 409 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.studentSessionEnrollment.create({
      data: {
        sessionId,
        studentId,
        courseId: courseId || null,
        lessonId: lessonId || null,
        exerciseContent: exerciseContent || null,
      },
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
    await createAuditLog(
      user.id,
      user.name || "Unknown",
      user.role as Role,
      "StudentSessionEnrollment",
      enrollment.id,
      "CREATE",
      null,
      {
        sessionId,
        studentId,
        studentName: enrollment.student.name,
        courseId,
        lessonId,
      },
      user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error("Error adding student to session:", error);
    return NextResponse.json(
      { error: "Failed to add student to session" },
      { status: 500 }
    );
  }
}
