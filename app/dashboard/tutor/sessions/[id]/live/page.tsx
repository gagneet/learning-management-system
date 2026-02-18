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

  // Fetch session with all related data
  const sessionData = await prisma.session.findUnique({
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
  });

  if (!sessionData) {
    notFound();
  }

  // Verify tutor owns this session
  if (sessionData.tutorId !== user.id) {
    redirect("/dashboard");
  }

  // Fetch help requests for this session
  const helpRequests = await prisma.helpRequest.findMany({
    where: {
      sessionId: id,
      status: { in: ["PENDING", "ACKNOWLEDGED", "IN_PROGRESS"] },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
        },
      },
      exercise: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch student goals for enrolled students
  const studentIds = sessionData.studentEnrollments.map((e) => e.studentId);
  const studentGoals = await prisma.studentGoal.findMany({
    where: {
      studentId: { in: studentIds },
      isAchieved: false,
    },
    take: 3,
  });

  // Fetch recent assessments for enrolled students
  const assessments = await prisma.subjectAssessment.findMany({
    where: {
      studentId: { in: studentIds },
    },
    orderBy: {
      lastAssessedAt: "desc",
    },
    take: 5,
  });

  // Fetch recent exercise attempts with timing data
  const exerciseAttempts = await prisma.exerciseAttempt.findMany({
    where: {
      studentId: { in: studentIds },
      sessionEnrollmentId: { in: sessionData.studentEnrollments.map(e => e.id) }
    },
    include: {
      exercise: {
        select: { title: true }
      }
    },
    orderBy: {
      submittedAt: "desc"
    }
  });

  // Fetch session notes
  const tutorNotes = await prisma.tutorNote.findMany({
    where: {
      enrollmentId: { in: sessionData.studentEnrollments.map((e) => e.id) },
    },
    include: {
      tutor: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

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
