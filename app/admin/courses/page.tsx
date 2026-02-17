import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminCoursesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Only admins can access this page
  if (!["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Fetch courses
  const courses = await prisma.course.findMany({
    where: {
      centerId: user.centerId as string,
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          modules: true,
          enrollments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Course Management
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  All Courses
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage courses in {user.centerName}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {courses.map((course) => (
              <div key={course.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {course.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          course.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : course.status === "DRAFT"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      {course.description || "No description"}
                    </p>
                    <div className="flex gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>Teacher: {course.teacher.name}</span>
                      <span>•</span>
                      <span>{course._count.modules} modules</span>
                      <span>•</span>
                      <span>{course._count.enrollments} students</span>
                    </div>
                  </div>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    View Course
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No courses found. Create your first course to get started!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
