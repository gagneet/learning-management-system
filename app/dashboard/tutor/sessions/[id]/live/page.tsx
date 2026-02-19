import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LiveSessionDashboard from "./LiveSessionDashboard";

interface LiveSessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LiveSessionPage({ params }: LiveSessionPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // ⚡ Bolt Optimization: Parallelize session data and help requests as they only depend on id
  // This reduces the number of sequential database round-trips.
  const [sessionData, helpRequests] = await Promise.all([
    prisma.session.findUnique({
      where: { id },
      include: {
        studentEnrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                academicProfile: true,
                gamificationProfile: true,
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
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.helpRequest.findMany({
      where: {
        sessionId: id,
        status: { in: ["PENDING", "ACKNOWLEDGED", "IN_PROGRESS"] },
      },
      include: {
        student: { select: { id: true, name: true } },
        exercise: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!sessionData) {
    notFound();
  }

  // Verify tutor owns this session
  if (sessionData.tutorId !== user.id) {
    redirect("/dashboard");
  }

  const studentIds = sessionData.studentEnrollments.map((e) => e.studentId);
  const enrollmentIds = sessionData.studentEnrollments.map((e) => e.id);

  // ⚡ Bolt Optimization: Parallelize remaining related data fetching.
  // These queries depend on studentIds or enrollmentIds which we now have.
  const [studentGoals, assessments, exerciseAttempts, tutorNotes] = await Promise.all([
    // 1. Fetch student goals for enrolled students
    prisma.studentGoal.findMany({
      where: {
        studentId: { in: studentIds },
        isAchieved: false,
      },
      take: 3,
    }),

    // 2. Fetch recent assessments for enrolled students
    prisma.subjectAssessment.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { lastAssessedAt: "desc" },
      take: 5,
    }),

    // 3. Fetch recent exercise attempts with timing data
    prisma.exerciseAttempt.findMany({
      where: {
        studentId: { in: studentIds },
        sessionEnrollmentId: { in: enrollmentIds },
      },
      include: { exercise: { select: { title: true } } },
      orderBy: { submittedAt: "desc" },
    }),

    // 4. Fetch session notes
    prisma.tutorNote.findMany({
      where: { enrollmentId: { in: enrollmentIds } },
      include: { tutor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Calculate duration
  const duration = sessionData.duration ||
    (sessionData.endTime
      ? Math.round((new Date(sessionData.endTime).getTime() - new Date(sessionData.startTime).getTime()) / (1000 * 60))
      : 60);

  return (
    <LiveSessionDashboard
      exerciseAttempts={exerciseAttempts.map(a => ({
        id: a.id,
        studentId: a.studentId,
        title: a.exercise.title,
        completedAt: a.submittedAt || a.updatedAt,
        score: a.score || 0,
        timeSpent: a.timeSpent || 0,
        questionTimes: a.questionTimes as any
      }))}
      session={{
        id: sessionData.id,
        title: sessionData.title,
        status: sessionData.status,
        startTime: sessionData.startTime,
        duration,
        students: sessionData.studentEnrollments.map((enrollment) => ({
          id: enrollment.student.id,
          name: enrollment.student.name || "Unknown",
          email: enrollment.student.email,
          gradeLevel: "Student",
          enrollmentId: enrollment.id,
          courseTitle: enrollment.course?.title || "Unknown Course",
          academicProfile: {
            ...enrollment.student.academicProfile,
            activeMs: enrollment.activeMs,
          },
        })),
      }}
      helpRequests={helpRequests.map((req) => ({
        id: req.id,
        studentId: req.studentId,
        studentName: req.student.name || "Unknown",
        priority: req.priority as "URGENT" | "HIGH" | "MEDIUM" | "LOW",
        message: req.message || "No message provided",
        exerciseTitle: req.exercise?.title,
        timestamp: req.createdAt,
        status: req.status as "PENDING" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED",
      }))}
      studentGoals={studentGoals}
      assessments={assessments}
      tutorNotes={tutorNotes.map((note) => ({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        createdBy: note.tutor.name || "Unknown",
        visibility: note.visibility as "INTERNAL" | "EXTERNAL",
      }))}
      tutorId={user.id}
      tutorName={user.name || "Unknown"}
    />
  );
}
