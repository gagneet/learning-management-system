import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch student data
  const [academicProfile, gamificationProfile, enrollments] = await Promise.all([
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
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
  ]);

  const completedCourses = enrollments.filter(e => e.completedAt).length;
  const avgProgress = enrollments.length > 0 
    ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎓 My Learning Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name}
              </span>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.name}! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Keep learning and growing every day!
          </p>
        </div>

        {/* Gamification Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Level</h3>
                <p className="text-4xl font-bold">{gamificationProfile?.level || 1}</p>
              </div>
              <div className="text-5xl opacity-80">🏆</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Total XP</h3>
                <p className="text-4xl font-bold">{gamificationProfile?.xp || 0}</p>
              </div>
              <div className="text-5xl opacity-80">⭐</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Streak</h3>
                <p className="text-4xl font-bold">{gamificationProfile?.streak || 0}</p>
                <p className="text-sm opacity-90">days</p>
              </div>
              <div className="text-5xl opacity-80">🔥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Badges</h3>
                <p className="text-4xl font-bold">{gamificationProfile?.badges.length || 0}</p>
              </div>
              <div className="text-5xl opacity-80">🎖️</div>
            </div>
          </div>
        </div>

        {/* Academic Profile */}
        {academicProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              📊 Academic Profile
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {academicProfile.readingAge && (
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-3xl mb-2">📖</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Reading Age</h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {academicProfile.readingAge.toFixed(1)} years
                  </p>
                </div>
              )}
              {academicProfile.numeracyAge && (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl mb-2">🔢</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Numeracy Age</h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {academicProfile.numeracyAge.toFixed(1)} years
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
            </div>
          </div>
        )}

        {/* Course Progress */}
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

        {/* My Courses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📚 My Courses
          </h3>
          {enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                >
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
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              You haven't enrolled in any courses yet.{" "}
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
              🎖️ Recent Badges
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
