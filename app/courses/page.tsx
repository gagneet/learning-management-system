import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function CoursesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Fetch courses based on user role
  const where: any = {
    centerId: user.centerId,
  };

  // Students only see published courses
  if (user.role === "STUDENT") {
    where.status = "PUBLISHED";
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          modules: true,
          enrollments: true,
        },
      },
      enrollments: user.role === "STUDENT" ? {
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          progress: true,
        },
      } : undefined,
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
              Browse Courses
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Available Courses
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Explore and enroll in courses at {user.centerName}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = user.role === "STUDENT" && course.enrollments && course.enrollments.length > 0;
            const enrollment = isEnrolled ? course.enrollments[0] : null;

            return (
              <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                {/* Course Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-white text-6xl">📚</div>
                  )}
                </div>

                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        course.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {course.status}
                    </span>
                    {isEnrolled && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Enrolled
                      </span>
                    )}
                  </div>

                  {/* Course Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </h3>

                  {/* Course Description */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    {course.description || "No description available"}
                  </p>

                  {/* Course Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>👨‍🏫 {course.teacher.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>📖 {course._count.modules} modules</span>
                    <span>👥 {course._count.enrollments} students</span>
                  </div>

                  {/* Progress Bar for Enrolled Students */}
                  {enrollment && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{enrollment.progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Link
                    href={`/courses/${course.slug}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    {isEnrolled ? "Continue Learning" : "View Course"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {courses.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No courses available yet. Check back soon!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
