import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SessionPlannerClient from "./SessionPlannerClient";

export default async function SessionPlannerPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch tutor's sessions for the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const sessions = await prisma.session.findMany({
    where: {
      tutorId: user.id,
      startTime: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
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
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });

  // Fetch available students for this tutor (students from their courses/sessions)
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      centerId: user.centerId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      academicProfile: true,
    },
    take: 50,
  });

  // Fetch tutor's courses
  const courses = await prisma.course.findMany({
    where: {
      teacherId: user.id,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
    },
  });

  // Fetch exercises for recommendations
  const exercises = await prisma.exercise.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      exerciseType: true,
      difficulty: true,
      timeLimit: true,
    },
    take: 20,
    orderBy: {
      createdAt: "desc",
    },
  });

  const sessionData = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status as "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | "DRAFT",
    startTime: s.startTime,
    duration: s.duration || 60,
    studentCount: s.studentEnrollments.length,
    courseTitle:
      s.studentEnrollments[0]?.course?.title || "No course assigned",
  }));

  const studentData = students.map((s) => ({
    id: s.id,
    name: s.name || "Unknown",
    email: s.email,
    gradeLevel: "Student",
    recentPerformance: [], // TODO: Add real performance data
    currentGoals: [], // TODO: Add real goals
  }));

  const exerciseData = exercises.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.exerciseType,
    difficulty: e.difficulty === "EASY" ? 1 : e.difficulty === "MEDIUM" ? 2 : e.difficulty === "HARD" ? 3 : e.difficulty === "CHALLENGE" ? 4 : 2,
    estimatedTime: e.timeLimit || 30,
    isRecommended: Math.random() > 0.5, // TODO: Add real recommendation logic
  }));

  return (
    <SessionPlannerClient
      initialSessions={sessionData}
      students={studentData}
      courses={courses}
      exercises={exerciseData}
      tutorId={user.id}
      tutorName={user.name || "Unknown"}
    />
  );
}
