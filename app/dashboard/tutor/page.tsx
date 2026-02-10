import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TutorDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch tutor data
  const [courses, enrollments, upcomingSessions] = await Promise.all([
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
          gte: new Date(),
        },
        status: {
          in: ["SCHEDULED", "LIVE"],
        },
      },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true,
              },
            },
          },
        },
        attendance: true,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 5,
    }),
  ]);

  const totalStudents = new Set(enrollments.map(e => e.userId)).size;
  const avgProgress = enrollments.length > 0 
    ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              👨‍🏫 Tutor Dashboard
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
        {/* My Day Panel */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            My Day
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                My Courses
              </h3>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {courses.length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Total Students
              </h3>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                {totalStudents}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Avg Progress
              </h3>
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {avgProgress.toFixed(0)}%
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Upcoming Sessions
              </h3>
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                {upcomingSessions.length}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              📅 Upcoming Sessions
            </h3>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {session.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {session.lesson.module.course.title} - {session.lesson.title}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>📅 {new Date(session.startTime).toLocaleDateString()}</span>
                        <span>🕐 {new Date(session.startTime).toLocaleTimeString()}</span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                          {session.provider}
                        </span>
                      </div>
                    </div>
                    {session.joinUrl && (
                      <a
                        href={session.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm whitespace-nowrap"
                      >
                        Join Session
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Courses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              📚 My Courses
            </h3>
            <Link
              href="/courses/create"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              + Create Course
            </Link>
          </div>
          
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((course) => {
                const totalLessons = course.modules.reduce(
                  (sum, module) => sum + module.lessons.length,
                  0
                );
                return (
                  <div
                    key={course.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                          {course.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>👥 {course.enrollments.length} students</span>
                          <span>📝 {totalLessons} lessons</span>
                          <span>📦 {course.modules.length} modules</span>
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          course.status === "PUBLISHED"
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                        }`}>
                          {course.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/courses?id=${course.id}`}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm whitespace-nowrap"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/courses/${course.slug}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm whitespace-nowrap"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              You haven't created any courses yet.{" "}
              <Link href="/courses/create" className="text-blue-600 hover:underline">
                Create your first course
              </Link>
            </p>
          )}
        </div>

        {/* Student Analytics Overview */}
        {enrollments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              📊 Student Analytics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Enrolled
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {enrollments.slice(0, 10).map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {enrollment.user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {enrollment.course.title}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 min-w-[40px]">
                            {enrollment.progress.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
