import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function TutorMarkingPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch students with low progress that need attention
  const enrollmentsNeedingReview = await prisma.enrollment.findMany({
    where: {
      course: {
        teacherId: user.id,
      },
      progress: {
        lt: 50, // Less than 50% progress
        gt: 0,  // But has started
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
    orderBy: {
      progress: "asc", // Lowest progress first
    },
  });

  // Fetch students who haven't started
  const notStarted = await prisma.enrollment.findMany({
    where: {
      course: {
        teacherId: user.id,
      },
      progress: 0,
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
    orderBy: {
      enrolledAt: "desc", // Most recently enrolled first
    },
  });

  // Fetch homework assignments that need grading (Phase 1 feature)
  const homeworkToGrade = await prisma.homeworkAssignment.findMany({
    where: {
      course: {
        teacherId: user.id,
      },
      status: "SUBMITTED", // Submitted but not yet graded
    },
    include: {
      student: {
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
      exercise: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      submittedAt: "asc", // Oldest submissions first
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Marking Queue" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Marking Queue</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review student progress and grade pending submissions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📝</div>
              <div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {homeworkToGrade.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Homework to Grade</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {enrollmentsNeedingReview.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Need Attention</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🚫</div>
              <div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {notStarted.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Not Started</div>
              </div>
            </div>
          </div>
        </div>

        {/* Homework to Grade */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Homework to Grade ({homeworkToGrade.length})
          </h2>

          {homeworkToGrade.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                All homework has been graded!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {homeworkToGrade.map((hw) => (
                <div
                  key={hw.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {hw.student.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {hw.course.title} - {hw.exercise?.title || "Assignment"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          📅 Submitted:{" "}
                          {hw.submittedAt
                            ? new Date(hw.submittedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : "Not submitted"}
                        </span>
                        {hw.dueDate && (
                          <span
                            className={
                              new Date(hw.dueDate) < new Date() && hw.status !== "GRADED"
                                ? "text-red-600 dark:text-red-400 font-semibold"
                                : ""
                            }
                          >
                            ⏰ Due: {new Date(hw.dueDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/tutor/homework/${hw.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                      Grade Assignment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Students Needing Attention */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Students Needing Attention ({enrollmentsNeedingReview.length})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Students with less than 50% progress who need support
          </p>

          {enrollmentsNeedingReview.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                All students are on track!
              </p>
            </div>
          ) : (
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {enrollmentsNeedingReview.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {enrollment.user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {enrollment.user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {enrollment.course.title}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[40px]">
                            {enrollment.progress.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/tutor/students?id=${enrollment.userId}`}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        >
                          View Student
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Students Not Started */}
        {notStarted.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-4">
              Students Who Haven&apos;t Started ({notStarted.length})
            </h3>
            <div className="space-y-2">
              {notStarted.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {enrollment.user.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {enrollment.course.title} - Enrolled{" "}
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/tutor/students?id=${enrollment.userId}`}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                  >
                    Contact Student
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
