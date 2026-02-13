"use client";

import Link from "next/link";
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection";
import { ActionCardsSection } from "@/components/dashboard/ActionCardsSection";
import { getActionCardsForRole } from "@/components/dashboard/config/dashboardActions";
import type {
  Course,
  Enrollment,
  Session,
  User,
  Module,
  Lesson,
  SessionAttendance,
} from "@prisma/client";

interface TutorDashboardData {
  userName: string;
  courses: (Course & {
    enrollments: (Enrollment & {
      user: Pick<User, "id" | "name" | "email">;
    })[];
    modules: (Module & {
      lessons: Lesson[];
    })[];
  })[];
  enrollments: (Enrollment & {
    user: Pick<User, "id" | "name" | "email">;
    course: {
      id: string;
      title: string;
    };
  })[];
  upcomingSessions: (Session & {
    studentEnrollments: {
      course: { title: string } | null;
      lesson: { title: string } | null;
    }[];
    attendance: SessionAttendance[];
  })[];
  todaySessions: (Session & {
    studentEnrollments: {
      course: { title: string } | null;
      lesson: { title: string } | null;
    }[];
    attendance: (SessionAttendance & {
      user: { name: string };
    })[];
  })[];
  totalStudents: number;
  avgProgress: number;
  markingQueue: (Enrollment & {
    user: Pick<User, "id" | "name" | "email">;
    course: {
      id: string;
      title: string;
    };
  })[];
  notStarted: (Enrollment & {
    user: Pick<User, "id" | "name" | "email">;
    course: {
      id: string;
      title: string;
    };
  })[];
}

export function TutorDashboardClient({ data }: { data: TutorDashboardData }) {
  const {
    userName,
    courses,
    enrollments,
    upcomingSessions,
    todaySessions,
    totalStudents,
    avgProgress,
    markingQueue,
    notStarted,
  } = data;

  // Get action cards with dynamic badges
  const actionCards = getActionCardsForRole("TEACHER", {
    activeStudentsCount: totalStudents,
    markingQueueCount: markingQueue.length,
  });

  return (
    <>
      {/* Welcome - Always visible */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          My Day
        </h2>
      </div>

      {/* Quick Actions - NEW */}
      <CollapsibleSection
        title="Quick Actions"
        icon="🚀"
        defaultExpanded={true}
        persistKey="tutor-actions"
      >
        <ActionCardsSection actions={actionCards} columns={3} />
      </CollapsibleSection>

      {/* My Day Stats - Always visible first */}
      <CollapsibleSection
        title="My Day Stats"
        icon="📊"
        defaultExpanded={true}
        persistKey="tutor-stats"
      >
        <div className="grid md:grid-cols-4 gap-6 mt-4">
          <Link href="/dashboard/tutor/courses" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 transition-all cursor-pointer border border-transparent">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                My Courses
              </h3>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {courses.length}
              </p>
            </div>
          </Link>

          <Link href="/dashboard/tutor/students" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 transition-all cursor-pointer border border-transparent">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Total Students
              </h3>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                {totalStudents}
              </p>
            </div>
          </Link>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-transparent">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Avg Progress
            </h3>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {avgProgress.toFixed(0)}%
            </p>
          </div>

          <Link href="/dashboard/tutor/sessions" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 transition-all cursor-pointer border border-transparent">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Upcoming Sessions
              </h3>
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                {upcomingSessions.length}
              </p>
            </div>
          </Link>
        </div>
      </CollapsibleSection>

      {/* Classes Today */}
      <CollapsibleSection
        title="Classes Today"
        icon="📅"
        badge={todaySessions.length > 0 ? todaySessions.length : undefined}
        defaultExpanded={true}
        persistKey="tutor-today"
      >
        {todaySessions.length > 0 ? (
          <div className="space-y-4 mt-4">
            {todaySessions.map((s) => (
              <Link key={s.id} href={`/dashboard/tutor/sessions/${s.id}`} className="block">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {s.title}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded font-semibold ${
                          s.status === "LIVE"
                            ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 animate-pulse"
                            : s.status === "COMPLETED"
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {s.studentEnrollments[0]?.course?.title || 'Course'} - {s.studentEnrollments[0]?.lesson?.title || 'Lesson'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {s.endTime && (
                          <span>- {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {s.provider}
                        </span>
                        <span>{s.attendance.length} attendees</span>
                      </div>
                    </div>
                    {s.sessionMode === "ONLINE" && s.meetingLink && s.status !== "COMPLETED" && (
                      <a
                        href={s.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm whitespace-nowrap"
                      >
                        {s.status === "LIVE" ? "Join Now" : "Open Session"}
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4 mt-4">
            No classes scheduled for today.
          </p>
        )}
      </CollapsibleSection>

      {/* Marking Queue */}
      <CollapsibleSection
        title="Marking Queue"
        icon="📝"
        badge={markingQueue.length > 0 ? markingQueue.length : undefined}
        defaultExpanded={true}
        persistKey="tutor-marking"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 mt-4">
          Students with less than 50% progress who need attention
        </p>
        {markingQueue.length > 0 ? (
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
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {markingQueue.map((enrollment) => (
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
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 min-w-[40px]">
                          {enrollment.progress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs">
                        Needs Review
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            No students currently in the marking queue.
          </p>
        )}

        {/* Not Started Alert */}
        {notStarted.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              {notStarted.length} student(s) haven&apos;t started their course yet
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {notStarted.slice(0, 5).map((e) => (
                <span key={e.id} className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                  {e.user.name} - {e.course.title}
                </span>
              ))}
              {notStarted.length > 5 && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  + {notStarted.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <CollapsibleSection
          title="Upcoming Sessions"
          icon="📆"
          badge={upcomingSessions.length}
          defaultExpanded={false}
          persistKey="tutor-upcoming"
        >
          <div className="space-y-4 mt-4">
            {upcomingSessions.map((s) => (
              <div
                key={s.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {s.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {s.studentEnrollments[0]?.course?.title || 'Course'} - {s.studentEnrollments[0]?.lesson?.title || 'Lesson'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{new Date(s.startTime).toLocaleDateString()}</span>
                      <span>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                        {s.provider}
                      </span>
                    </div>
                  </div>
                  {s.sessionMode === "ONLINE" && s.meetingLink && (
                    <a
                      href={s.meetingLink}
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
        </CollapsibleSection>
      )}

      {/* My Courses */}
      <CollapsibleSection
        title="My Courses"
        icon="📚"
        badge={courses.length}
        defaultExpanded={false}
        persistKey="tutor-courses"
      >
        <div className="flex justify-end mb-4 mt-4">
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
                        <span>{course.enrollments.length} students</span>
                        <span>{totalLessons} lessons</span>
                        <span>{course.modules.length} modules</span>
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
            You haven&apos;t created any courses yet.{" "}
            <Link href="/courses/create" className="text-blue-600 hover:underline">
              Create your first course
            </Link>
          </p>
        )}
      </CollapsibleSection>

      {/* Student Analytics */}
      {enrollments.length > 0 && (
        <CollapsibleSection
          title="Student Analytics"
          icon="📈"
          defaultExpanded={false}
          persistKey="tutor-analytics"
        >
          <div className="overflow-x-auto mt-4">
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
        </CollapsibleSection>
      )}
    </>
  );
}
