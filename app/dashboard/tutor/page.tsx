import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ThemeToggle from "@/components/ThemeToggle";
import { TutorDashboardClient } from "./TutorDashboardClient";

export default async function TutorDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Fetch tutor data
  const [courses, enrollments, upcomingSessions, todaySessions] = await Promise.all([
    prisma.course.findMany({
      where: { teacherId: user.id },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      where: {
        course: {
          teacherId: user.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.session.findMany({
      where: {
        tutorId: user.id,
        startTime: {
          gte: now,
        },
        status: {
          in: ["SCHEDULED", "LIVE"],
        },
      },
      include: {
        studentEnrollments: {
          include: {
            course: { select: { title: true } },
            lesson: { select: { title: true } },
          },
        },
        attendance: true,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 5,
    }),
    // Today's classes
    prisma.session.findMany({
      where: {
        tutorId: user.id,
        startTime: { gte: todayStart, lt: todayEnd },
        status: { in: ["SCHEDULED", "LIVE", "COMPLETED"] },
      },
      include: {
        studentEnrollments: {
          include: {
            course: { select: { title: true } },
            lesson: { select: { title: true } },
          },
        },
        attendance: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const totalStudents = new Set(enrollments.map(e => e.userId)).size;
  const avgProgress = enrollments.length > 0
    ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
    : 0;

  // Marking Queue: students with low progress (< 50%) who are actively enrolled
  const markingQueue = enrollments
    .filter(e => e.progress < 50 && e.progress > 0)
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 10);

  // Students needing attention: 0% progress (haven't started)
  const notStarted = enrollments.filter(e => e.progress === 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tutor Dashboard
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
        <TutorDashboardClient
          data={{
            userName: user.name!,
            courses,
            enrollments,
            upcomingSessions,
            todaySessions,
            totalStudents,
            avgProgress,
            markingQueue,
            notStarted,
          }}
        />
      </main>
    </div>
  );
}
