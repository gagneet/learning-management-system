import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Redirect students to their enhanced dashboard
  if (user.role === "STUDENT") {
    redirect("/dashboard/student");
  }

  // Redirect teachers to their tutor dashboard
  if (user.role === "TEACHER") {
    redirect("/dashboard/tutor");
  }

  // Redirect supervisors and center admins to supervisor dashboard
  if (user.role === "CENTER_SUPERVISOR" || user.role === "CENTER_ADMIN") {
    redirect("/dashboard/supervisor");
  }

  // SUPER_ADMIN: fetch real data across all centres
  const centerFilter = user.role === "SUPER_ADMIN" ? {} : { centerId: user.centerId };

  const [courseCount, userCount, enrollmentCount, activeStudents, recentEnrollments] = await Promise.all([
    prisma.course.count({ where: centerFilter }),
    prisma.user.count({ where: centerFilter }),
  prisma.enrollment.count({
    where: { 
      course: centerFilter.centerId ? { centerId: centerFilter.centerId } : {} 
    },
  }),
    prisma.user.count({
      where: {
        ...centerFilter,
        role: "STUDENT",
      },
    }),
  prisma.enrollment.findMany({
    where: { course: centerFilter.centerId ? { centerId: centerFilter.centerId } : {} },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
      orderBy: { enrolledAt: "desc" },
      take: 10,
    }),
  ]);

  const avgProgress = enrollmentCount > 0
  const avgProgress = enrollmentCount > 0
    ? await prisma.enrollment.aggregate({
        where: { course: centerFilter.centerId ? { centerId: centerFilter.centerId } : {} },
        _avg: { progress: true },
      }).then(r => r._avg.progress || 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              LMS Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                {user.role}
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user.name}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {user.role === "SUPER_ADMIN" ? "Global Admin Overview" : `Center: ${user.centerName}`}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Courses
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{courseCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Across all centres
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Avg Progress
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{avgProgress.toFixed(0)}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Overall completion
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Active Users
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Registered users
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Students
            </h3>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{activeStudents}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Enrolled students
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/users"
              className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center transition"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="font-semibold">Manage Users</div>
            </Link>
            <Link
              href="/admin/courses"
              className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg text-center transition"
            >
              <div className="text-2xl mb-2">📚</div>
              <div className="font-semibold">Manage Courses</div>
            </Link>
            <Link
              href="/courses"
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-center transition"
            >
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-semibold">Browse Courses</div>
            </Link>
            <Link
              href="/admin/analytics"
              className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-lg text-center transition"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold">Analytics</div>
            </Link>
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Enrollments
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {recentEnrollments.length > 0 ? (
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
                    {recentEnrollments.map((enrollment) => (
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
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No enrollments yet. Start by creating courses and enrolling students!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
