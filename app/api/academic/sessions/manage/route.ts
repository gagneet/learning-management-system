import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasPermission, Permissions } from "@/lib/rbac";
import { preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

// POST /api/sessions/manage - Create a new session with multiple student enrollments
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  if (!hasPermission(session, Permissions.SESSION_CREATE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    preventCentreIdInjection(body);

    const {
      title,
      description,
      provider,
      sessionMode,
      meetingLink,
      physicalLocation,
      startTime,
      endTime,
      tutorId,
      classId,
      studentEnrollments,
    } = body;

    // Validate required fields
    if (!title || !provider || !sessionMode || !startTime || !tutorId) {
      return NextResponse.json(
        { error: "Missing required fields: title, provider, sessionMode, startTime, tutorId" },
        { status: 400 }
      );
    }

    // Validate provider
    const validProviders = ["TEAMS", "ZOOM", "CHIME", "OTHER"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be one of: TEAMS, ZOOM, CHIME, OTHER" },
        { status: 400 }
      );
    }

    // Validate session mode
    const validModes = ["ONLINE", "PHYSICAL"];
    if (!validModes.includes(sessionMode)) {
      return NextResponse.json(
        { error: "Invalid sessionMode. Must be ONLINE or PHYSICAL" },
        { status: 400 }
      );
    }

    // Validate mode-specific fields
    if (sessionMode === "ONLINE" && !meetingLink) {
      return NextResponse.json(
        { error: "meetingLink is required for ONLINE sessions" },
        { status: 400 }
      );
    }

    if (sessionMode === "PHYSICAL" && !physicalLocation) {
      return NextResponse.json(
        { error: "physicalLocation is required for PHYSICAL sessions" },
        { status: 400 }
      );
    }

    // Verify tutor exists and belongs to same center
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
      select: { id: true, centerId: true, role: true },
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && tutor.centerId !== user.centerId) {
      return NextResponse.json(
        { error: "Tutor must belong to your center" },
        { status: 403 }
      );
    }

    // If classId provided, verify it exists and belongs to same center
    if (classId) {
      const classExists = await prisma.classCohort.findUnique({
        where: { id: classId },
        select: { centreId: true },
      });

      if (!classExists) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }

      if (user.role !== "SUPER_ADMIN" && classExists.centreId !== user.centerId) {
        return NextResponse.json(
          { error: "Class must belong to your center" },
          { status: 403 }
        );
      }
    }

    // Validate student enrollments if provided
    if (studentEnrollments && Array.isArray(studentEnrollments)) {
      for (const enrollment of studentEnrollments) {
        const student = await prisma.user.findUnique({
          where: { id: enrollment.studentId },
          select: { id: true, centerId: true, role: true },
        });

        if (!student) {
          return NextResponse.json(
            { error: `Student ${enrollment.studentId} not found` },
            { status: 404 }
          );
        }

        if (student.role !== "STUDENT") {
          return NextResponse.json(
            { error: `User ${enrollment.studentId} is not a student` },
            { status: 400 }
          );
        }

        if (user.role !== "SUPER_ADMIN" && student.centerId !== user.centerId) {
          return NextResponse.json(
            { error: "All students must belong to your center" },
            { status: 403 }
          );
        }

        // Validate course and lesson if provided
        if (enrollment.courseId) {
          const course = await prisma.course.findUnique({
            where: { id: enrollment.courseId },
            select: { centerId: true },
          });

          if (!course) {
            return NextResponse.json(
              { error: `Course ${enrollment.courseId} not found` },
              { status: 404 }
            );
          }

          if (user.role !== "SUPER_ADMIN" && course.centerId !== user.centerId) {
            return NextResponse.json(
              { error: "All courses must belong to your center" },
              { status: 403 }
            );
          }
        }

        if (enrollment.lessonId) {
          const lesson = await prisma.lesson.findUnique({
            where: { id: enrollment.lessonId },
          });

          if (!lesson) {
            return NextResponse.json(
              { error: `Lesson ${enrollment.lessonId} not found` },
              { status: 404 }
            );
          }
        }
      }
    }

    // Create session with student enrollments in a transaction
    const newSession = await prisma.$transaction(async (tx) => {
      const createdSession = await tx.session.create({
        data: {
          title,
          description,
          provider,
          sessionMode,
          meetingLink: sessionMode === "ONLINE" ? meetingLink : null,
          physicalLocation: sessionMode === "PHYSICAL" ? physicalLocation : null,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : null,
          tutorId,
          classId: classId || null,
          status: "SCHEDULED",
          centreId: user.centerId!,
        },
      });

      // Create student enrollments if provided
      if (studentEnrollments && Array.isArray(studentEnrollments) && studentEnrollments.length > 0) {
        await tx.studentSessionEnrollment.createMany({
          data: studentEnrollments.map((enrollment: any) => ({
            sessionId: createdSession.id,
            studentId: enrollment.studentId,
            courseId: enrollment.courseId || null,
            lessonId: enrollment.lessonId || null,
            exerciseContent: enrollment.exerciseContent || null,
            centreId: user.centerId!,
          })),
        });
      }

      // Fetch the complete session with enrollments
      return await tx.session.findUnique({
        where: { id: createdSession.id },
        include: {
          studentEnrollments: {
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
          },
          class: {
            select: { id: true, name: true },
          },
        },
      });
    });

    if (!newSession) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Create audit log
    await auditCreate(
      user.id,
      user.name || "Unknown",
      user.role as Role,
      "Session",
      newSession.id,
      {
        title: newSession.title,
        tutorId: newSession.tutorId,
        sessionMode: newSession.sessionMode,
        startTime: newSession.startTime,
        studentCount: newSession.studentEnrollments.length,
      },
      user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
