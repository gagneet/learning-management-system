import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";

export default async function TutorCoursesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch tutor's courses with stats
  const courses = await prisma.course.findMany({
    where: {
      teacherId: user.id,
    },
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
      _count: {
        select: {
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
      <Header
        user={{ name: user.name || "", email: user.email || "", role: user.role || "" }}
        breadcrumbs={[{ label: "My Courses" }]}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Courses</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your courses, modules, and lessons
            </p>
          </div>
          <Link
            href="/courses/create"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create New Course
          </Link>
        </div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Courses Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first course to start teaching
            </p>
            <Link
              href="/courses/create"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const totalLessons = course.modules.reduce(
                (acc, module) => acc + module.lessons.length,
                0
              );

              return (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                        {course.title}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          course.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : course.status === "DRAFT"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {course.description || "No description"}
                    </p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {course.modules.length}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Modules</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {totalLessons}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Lessons</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {course._count.enrollments}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Students</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                      >
                        View Course
                      </Link>
                      <Link
                        href={`/admin/courses?id=${course.id}`}
                        className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center text-sm"
                      >
                        Edit Course
                      </Link>
                    </div>
                  </div>

                  {/* Recent Enrollments */}
                  {course.enrollments.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Recent Enrollments:
                      </h4>
                      <div className="space-y-1">
                        {course.enrollments.slice(0, 3).map((enrollment) => (
                          <div
                            key={enrollment.id}
                            className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                          >
                            <span>👤</span>
                            <span className="truncate">{enrollment.user.name}</span>
                          </div>
                        ))}
                        {course.enrollments.length > 3 && (
                          <div className="text-sm text-gray-500 dark:text-gray-500">
                            +{course.enrollments.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
