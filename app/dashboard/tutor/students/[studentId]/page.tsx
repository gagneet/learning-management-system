import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { StudentProfileClient } from "./StudentProfileClient";

interface StudentProfilePageProps {
  params: Promise<{
    studentId: string;
  }>;
}

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER" && user.role !== "CENTER_ADMIN" && user.role !== "CENTER_SUPERVISOR") {
    redirect("/dashboard");
  }

  const { studentId } = await params;

  // Fetch comprehensive student data
  const [
    student,
    academicProfile,
    gamificationProfile,
    enrollments,
    assessments,
    goals,
    awards,
    notes,
    sessions,
    homeworkAssignments,
    attendance,
    traits,
  ] = await Promise.all([
    // Basic student info
    prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        dateOfBirth: true,
        ageTier: true,
        createdAt: true,
      },
    }),

    // Academic Profile
    prisma.academicProfile.findUnique({
      where: { userId: studentId },
    }),

    // Gamification Profile with awards
    prisma.gamificationProfile.findUnique({
      where: { userId: studentId },
      include: {
        badges: {
          orderBy: { earnedAt: "desc" },
        },
        achievements: {
          orderBy: { earnedAt: "desc" },
        },
      },
    }),

    // Enrollments with progress
    prisma.enrollment.findMany({
      where: { userId: studentId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            teacher: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    }),

    // Student Assessments (subject-level assessments)
    prisma.subjectAssessment.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        lastAssessedAt: "desc",
      },
      take: 20,
    }),

    // Student Goals
    prisma.studentGoal.findMany({
      where: { studentId },
      orderBy: {
        createdAt: "desc",
      },
    }),

    // Award Redemptions
    prisma.awardRedemption.findMany({
      where: {
        studentId,
      },
      include: {
        award: true,
      },
      orderBy: {
        redeemedAt: "desc",
      },
      take: 20,
    }),

    // Tutor Notes
    prisma.tutorNote.findMany({
      where: { studentId },
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
      take: 50,
    }),

    // Session History
    prisma.studentSessionEnrollment.findMany({
      where: { studentId },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true,
            sessionMode: true,
            tutor: {
              select: {
                name: true,
              },
            },
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        session: {
          startTime: "desc",
        },
      },
      take: 30,
    }),

    // Homework History
    prisma.homeworkAssignment.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            title: true,
          },
        },
        exercise: {
          select: {
            title: true,
          },
        },
        assignedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),

    // Attendance Records
    prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startTime: true,
          },
        },
        markedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        session: {
          startTime: "desc",
        },
      },
      take: 50,
    }),

    // Student Strengths & Weaknesses
    prisma.studentStrengthWeakness.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            title: true,
          },
        },
        identifier: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  if (!student) {
    notFound();
  }

  // Only allow tutors to view their own students
  if (user.role === "TEACHER") {
    const hasEnrollment = enrollments.some((e) => e.course.teacher.name === user.name);
    if (!hasEnrollment) {
      redirect("/dashboard");
    }
  }

  // Calculate statistics
  const totalSessions = sessions.length;
  const attendanceRate =
    attendance.length > 0
      ? (attendance.filter((a) => a.status === "PRESENT").length / attendance.length) * 100
      : 0;

  const avgProgress =
    enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
      : 0;

  const pendingHomework = homeworkAssignments.filter(
    (h) => h.status === "NOT_STARTED" || h.status === "IN_PROGRESS"
  ).length;

  const completedHomework = homeworkAssignments.filter((h) => h.status === "GRADED").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title={`Student Profile: ${student.name}`}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <StudentProfileClient
          student={student}
          academicProfile={academicProfile}
          gamificationProfile={gamificationProfile}
          enrollments={enrollments}
          assessments={assessments}
          goals={goals}
          awards={awards}
          notes={notes}
          sessions={sessions}
          homeworkAssignments={homeworkAssignments}
          attendance={attendance}
          traits={traits}
          stats={{
            totalSessions,
            attendanceRate,
            avgProgress,
            pendingHomework,
            completedHomework,
          }}
        />
      </main>
    </div>
  );
}
