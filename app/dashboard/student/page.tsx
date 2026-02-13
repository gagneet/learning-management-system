import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ThemeToggle from "@/components/ThemeToggle";
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
  const [academicProfile, gamificationProfile, enrollments, upcomingSessions, todaySessions] = await Promise.all([
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
  ]);

  const completedCourses = enrollments.filter(e => e.completedAt).length;
  const avgProgress = enrollments.length > 0
    ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
    : 0;

  // Find next incomplete lessons for each enrolled course (assignments due)
  // Limit to 10 for display performance
  const pendingLessons: Array<{
    lessonTitle: string;
    courseTitle: string;
    courseSlug: string;
    moduleName: string;
  }> = [];

  const MAX_PENDING_LESSONS = 10;

  enrollmentLoop: for (const enrollment of enrollments) {
    if (enrollment.completedAt) continue;
    for (const mod of enrollment.course.modules) {
      for (const lesson of mod.lessons) {
        const isCompleted = lesson.progress.some(p => p.completed);
        if (!isCompleted) {
          pendingLessons.push({
            lessonTitle: lesson.title,
            courseTitle: enrollment.course.title,
            courseSlug: enrollment.course.slug,
            moduleName: mod.title,
          });
          // Break early once we have enough pending lessons
          if (pendingLessons.length >= MAX_PENDING_LESSONS) {
            break enrollmentLoop;
          }
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Learning Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name}
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
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
