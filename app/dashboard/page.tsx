import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

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
            Center: {user.centerName}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              My Courses
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {user.role === "STUDENT" ? "Enrolled courses" : "Total courses"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Progress
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">0%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Overall completion
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Active Users
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              In your center
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(user.role === "SUPER_ADMIN" || user.role === "CENTER_ADMIN") && (
              <>
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
              </>
            )}
            
            {user.role === "TEACHER" && (
              <>
                <Link
                  href="/courses/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center transition"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <div className="font-semibold">Create Course</div>
                </Link>
                <Link
                  href="/courses"
                  className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg text-center transition"
                >
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-semibold">My Courses</div>
                </Link>
              </>
            )}

            <Link
              href="/courses"
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-center transition"
            >
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-semibold">Browse Courses</div>
            </Link>

            {(user.role === "SUPER_ADMIN" || user.role === "CENTER_ADMIN") && (
              <Link
                href="/admin/analytics"
                className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-lg text-center transition"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold">Analytics</div>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No recent activity yet. Start by browsing courses or creating content!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
