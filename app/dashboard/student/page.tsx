import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Keep learning and growing every day!
          </p>
        </div>

        {/* Top Stats Row: Today's Lessons | XP | Reading Age | Level */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Link href="/dashboard/student/sessions" className="block">
            <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 p-6 rounded-xl shadow-lg text-white hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Today&apos;s Lessons</h3>
                  <p className="text-4xl font-bold">{todaySessions.length}</p>
                  <p className="text-sm opacity-90">scheduled today</p>
                </div>
                <div className="text-5xl opacity-80" aria-hidden="true">📅</div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/student/gamification" className="block">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-xl shadow-lg text-white hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Total XP</h3>
                  <p className="text-4xl font-bold">{gamificationProfile?.xp || 0}</p>
                </div>
                <div className="text-5xl opacity-80" aria-hidden="true">⭐</div>
              </div>
            </div>
          </Link>

          <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Reading Age</h3>
                <p className="text-4xl font-bold">
                  {academicProfile?.readingAge ? `${academicProfile.readingAge.toFixed(1)}` : "N/A"}
                </p>
                {academicProfile?.readingAge && <p className="text-sm opacity-90">years</p>}
              </div>
              <div className="text-5xl opacity-80" aria-hidden="true">📖</div>
            </div>
          </div>

          <Link href="/dashboard/student/gamification" className="block">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-xl shadow-lg text-white hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Level</h3>
                  <p className="text-4xl font-bold">{gamificationProfile?.level || 1}</p>
                </div>
                <div className="text-5xl opacity-80" aria-hidden="true">🏆</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Streak & Badges Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link href="/dashboard/student/gamification" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="text-4xl" aria-hidden="true">🔥</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Streak</h3>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {gamificationProfile?.streak || 0} days
                  </p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/student/gamification" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="text-4xl" aria-hidden="true">🎖️</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Badges Earned</h3>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {gamificationProfile?.badges.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Academic Profile - Progress Charts */}
        {academicProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Academic Profile
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {academicProfile.readingAge && (
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-3xl mb-2">📖</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Reading Age</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {academicProfile.readingAge.toFixed(1)} yrs
                  </p>
                </div>
              )}
              {academicProfile.numeracyAge && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl mb-2">🔢</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Numeracy Age</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {academicProfile.numeracyAge.toFixed(1)} yrs
                  </p>
                </div>
              )}
              {academicProfile.comprehensionIndex && (
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-3xl mb-2">🧠</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Comprehension</h4>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {academicProfile.comprehensionIndex.toFixed(0)}%
                  </p>
                </div>
              )}
              {academicProfile.writingProficiency && (
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-3xl mb-2">✍️</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Writing</h4>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {academicProfile.writingProficiency.toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Course Progress Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Enrolled Courses
            </h3>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {enrollments.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Completed
            </h3>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {completedCourses}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Avg Progress
            </h3>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {avgProgress.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Upcoming Sessions
          </h3>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((s) => (
                <Link key={s.id} href="/dashboard/student/sessions" className="block">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer">
                    <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {s.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {s.studentEnrollments[0]?.course?.title || 'Course'} - {s.studentEnrollments[0]?.lesson?.title || 'Lesson'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{new Date(s.startTime).toLocaleDateString()}</span>
                        <span>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                          {s.provider}
                        </span>
                        {s.status === "LIVE" && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs font-semibold animate-pulse">
                            LIVE NOW
                          </span>
                        )}
                      </div>
                    </div>
                    {s.joinUrl && (
                      <a
                        href={s.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm whitespace-nowrap"
                      >
                        Join
                      </a>
                    )}
                  </div>
                </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No upcoming sessions scheduled.
            </p>
          )}
        </div>

        {/* Assignments Due (Pending Lessons) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Assignments Due
          </h3>
          {pendingLessons.length > 0 ? (
            <div className="space-y-3">
              {pendingLessons.slice(0, 10).map((lesson, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {lesson.lessonTitle}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {lesson.courseTitle} &middot; {lesson.moduleName}
                    </p>
                  </div>
                  <Link
                    href={`/courses/${lesson.courseSlug}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm whitespace-nowrap"
                  >
                    Start
                  </Link>
                </div>
              ))}
              {pendingLessons.length > 10 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  + {pendingLessons.length - 10} more pending lessons
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              All caught up! No pending assignments.
            </p>
          )}
        </div>

        {/* My Courses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            My Courses
          </h3>
          {enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/courses/${enrollment.course.slug}`}
                  className="block"
                >
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer">
                    <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {enrollment.course.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Instructor: {enrollment.course.teacher.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {enrollment.progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/courses/${enrollment.course.slug}`}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm whitespace-nowrap"
                    >
                      Continue
                    </Link>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              You haven&apos;t enrolled in any courses yet.{" "}
              <Link href="/courses" className="text-blue-600 hover:underline">
                Browse courses
              </Link>
            </p>
          )}
        </div>

        {/* Recent Badges */}
        {gamificationProfile && gamificationProfile.badges.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Recent Badges
            </h3>
            <div className="grid md:grid-cols-5 gap-4">
              {gamificationProfile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 p-4 rounded-lg text-center"
                >
                  <div className="text-4xl mb-2">
                    {badge.iconUrl || "🏅"}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {badge.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {badge.type}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
