import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default async function TutorStudentsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch all students enrolled in tutor's courses
  const enrollments = await prisma.enrollment.findMany({
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
          slug: true,
        },
      },
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });

  // Group students by unique userId
  const studentMap = new Map();
  enrollments.forEach((enrollment) => {
    const studentId = enrollment.user.id;
    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        ...enrollment.user,
        courses: [],
        totalProgress: 0,
      });
    }
    studentMap.get(studentId).courses.push({
      title: enrollment.course.title,
      slug: enrollment.course.slug,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
    });
    studentMap.get(studentId).totalProgress += enrollment.progress;
  });

  const students = Array.from(studentMap.values()).map((student) => ({
    ...student,
    averageProgress: student.courses.length > 0 ? student.totalProgress / student.courses.length : 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                LMS
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-600 dark:text-gray-300">My Students</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Students</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage students enrolled in your courses
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {students.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {enrollments.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Enrollments</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {students.length > 0
                ? Math.round(
                    students.reduce((acc, s) => acc + s.averageProgress, 0) / students.length
                  )
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average Progress</div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Students List</h2>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍🎓</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No students enrolled yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Students will appear here when they enroll in your courses
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(student.averageProgress)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Avg. Progress
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Enrolled Courses ({student.courses.length}):
                    </h4>
                    <div className="space-y-2">
                      {student.courses.map((course: { title: string; slug: string; progress: number; enrolledAt: Date }, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded"
                        >
                          <Link
                            href={`/courses/${course.slug}`}
                            className="text-blue-600 hover:underline flex-1"
                          >
                            {course.title}
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 dark:text-gray-400">
                              {Math.round(course.progress)}%
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(course.enrolledAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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
