import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { StudentDashboardClient } from "./StudentDashboardClient";

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Fetch student data
  const [academicProfile, gamificationProfile, enrollments, upcomingSessions, todaySessions, incompleteLessons] = await Promise.all([
    prisma.academicProfile.findUnique({
      where: { userId: user.id },
    }),
    prisma.gamificationProfile.findUnique({
      where: { userId: user.id },
      include: {
        badges: {
          orderBy: { earnedAt: "desc" },
          take: 5,
        },
        achievements: {
          orderBy: { earnedAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                name: true,
                email: true,
              },
            },
            modules: {
              include: {
                lessons: {
                  include: {
                    progress: {
                      where: { userId: user.id },
                    },
                  },
                  orderBy: { order: "asc" },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    // Upcoming sessions (next 7 days) where the student is enrolled
    prisma.session.findMany({
      where: {
        startTime: { gte: now },
        status: { in: ["SCHEDULED", "LIVE"] },
        studentEnrollments: {
          some: { studentId: user.id },
        },
      },
      include: {
        studentEnrollments: {
          where: { studentId: user.id },
          include: {
            course: { select: { title: true } },
            lesson: { select: { title: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    // Today's sessions
    prisma.session.findMany({
      where: {
        startTime: { gte: todayStart, lt: todayEnd },
        status: { in: ["SCHEDULED", "LIVE"] },
        studentEnrollments: {
          some: { studentId: user.id },
        },
      },
      include: {
        studentEnrollments: {
          where: { studentId: user.id },
          include: {
            course: { select: { title: true } },
            lesson: { select: { title: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    }),
    // Fetch incomplete lessons directly from database (optimized query)
    prisma.lesson.findMany({
      where: {
        module: {
          course: {
            enrollments: {
              some: {
                userId: user.id,
                completedAt: null, // Only active enrollments
              },
            },
          },
        },
        progress: {
          none: {
            userId: user.id,
            completed: true,
          },
        },
      },
      select: {
        id: true,
        title: true,
        module: {
          select: {
            title: true,
            course: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
      take: 10, // Limit to 10 for display performance
    }),
  ]);

  const completedCourses = enrollments.filter(enrollment => enrollment.completedAt).length;
  const avgProgress = enrollments.length > 0
    ? enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / enrollments.length
    : 0;

  // Map incomplete lessons to expected format (already fetched from database)
  const pendingLessons = incompleteLessons.map((lesson) => ({
    lessonTitle: lesson.title,
    courseTitle: lesson.module.course.title,
    courseSlug: lesson.module.course.slug,
    moduleName: lesson.module.title,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="My Learning Dashboard" />

      <main id="main-content" className="container mx-auto px-4 py-8 flex-1 scroll-mt-20">
        <StudentDashboardClient
          data={{
            userName: user.name!,
            academicProfile,
            gamificationProfile,
            enrollments,
            upcomingSessions,
            todaySessions,
            completedCourses,
            avgProgress,
            pendingLessons,
          }}
        />
      </main>
    </div>
  );
}
