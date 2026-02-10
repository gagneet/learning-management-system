import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface CoursePageProps {
  params: {
    slug: string;
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Fetch course with all details
  const course = await prisma.course.findUnique({
    where: {
      centerId_slug: {
        centerId: user.centerId,
        slug: params.slug,
      },
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      modules: {
        include: {
          lessons: {
            include: {
              contents: true,
              _count: {
                select: {
                  progress: {
                    where: {
                      userId: user.id,
                      completed: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
      enrollments: {
        where: {
          userId: user.id,
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const isEnrolled = course.enrollments.length > 0;
  const enrollment = isEnrolled ? course.enrollments[0] : null;

  // Calculate total lessons and completed lessons
  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessons = course.modules.reduce(
    (acc, module) => acc + module.lessons.reduce((sum, lesson) => sum + lesson._count.progress, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Course Details
            </h1>
            <div className="flex items-center gap-4">
              <a
                href="/courses"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                ← Back to Courses
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {course.title}
                </h2>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    course.status === "PUBLISHED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {course.status}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {course.description || "No description available"}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span>👨‍🏫 Instructor: {course.teacher.name}</span>
                <span>📖 {course.modules.length} modules</span>
                <span>📝 {totalLessons} lessons</span>
              </div>

              {enrollment && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Your Progress</span>
                    <span>
                      {completedLessons} / {totalLessons} lessons completed ({enrollment.progress.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Course Content
          </h3>

          {course.modules.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No modules available yet. Check back later!
            </p>
          ) : (
            <div className="space-y-6">
              {course.modules.map((module, moduleIndex) => (
                <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Module {moduleIndex + 1}: {module.title}
                    </h4>
                    {module.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                        {module.description}
                      </p>
                    )}
                  </div>

                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = lesson._count.progress > 0;

                      return (
                        <div key={lesson.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                  {isCompleted ? "✅" : "📝"}
                                </span>
                                <div>
                                  <h5 className="font-medium text-gray-900 dark:text-white">
                                    Lesson {lessonIndex + 1}: {lesson.title}
                                  </h5>
                                  {lesson.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {lesson.description}
                                    </p>
                                  )}
                                  <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{lesson.contents.length} content items</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
