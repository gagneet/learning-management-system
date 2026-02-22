import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Only admins can access this page
  if (!["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Fetch analytics data
  const where: { centerId?: string } = {};
  if (user.role !== "SUPER_ADMIN") {
    where.centerId = user.centerId as string;
  }

  const [totalUsers, totalCourses, totalEnrollments] = await Promise.all([
    prisma.user.count({ where }),
    prisma.course.count({ where }),
    prisma.enrollment.count({
      where: user.role === "SUPER_ADMIN" ? {} : { course: { centerId: user.centerId } },
    }),
  ]);

  const usersByRole = await prisma.user.groupBy({
    by: ["role"],
    where,
    _count: true,
  });

  const coursesByStatus = await prisma.course.groupBy({
    by: ["status"],
    where,
    _count: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics & Reporting
            </h1>
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                ← Back to Dashboard
              </a>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            System Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analytics for {user.role === "SUPER_ADMIN" ? "all centers" : user.centerName}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Users
            </h3>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{totalUsers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Across all roles
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Courses
            </h3>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{totalCourses}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              All status types
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Enrollments
            </h3>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{totalEnrollments}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Active student enrollments
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Users by Role */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Users by Role
            </h3>
            <div className="space-y-3">
              {usersByRole.map((item: any) => (
                <div key={item.role} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{item.role}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{item._count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Courses by Status */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Courses by Status
            </h3>
            <div className="space-y-3">
              {coursesByStatus.map((item: any) => (
                <div key={item.status} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{item.status}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{item._count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Insights
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-gray-600 dark:text-gray-400">Average Enrollments per Course</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {totalCourses > 0 ? (totalEnrollments / totalCourses).toFixed(1) : 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
              <p className="text-gray-600 dark:text-gray-400">User Engagement Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {totalUsers > 0 ? ((totalEnrollments / totalUsers) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
