"use client";

import Link from "next/link";
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection";
import { ActionCardsSection } from "@/components/dashboard/ActionCardsSection";
import { getActionCardsForRole } from "@/components/dashboard/config/dashboardActions";
import type {
  AcademicProfile,
  GamificationProfile,
  Enrollment,
  Session,
  Badge,
  Achievement,
  Course,
  User,
  Module,
  Lesson,
  Progress
} from "@prisma/client";

interface StudentDashboardData {
  userName: string;
  academicProfile: AcademicProfile | null;
  gamificationProfile: (GamificationProfile & {
    badges: Badge[];
    achievements: Achievement[];
  }) | null;
  enrollments: (Enrollment & {
    course: Course & {
      teacher: Pick<User, "name" | "email">;
      modules: (Module & {
        lessons: (Lesson & {
          progress: Progress[];
        })[];
      })[];
    };
  })[];
  upcomingSessions: (Session & {
    studentEnrollments: {
      course: { title: string } | null;
      lesson: { title: string } | null;
    }[];
  })[];
  todaySessions: (Session & {
    studentEnrollments: {
      course: { title: string } | null;
      lesson: { title: string } | null;
    }[];
  })[];
  completedCourses: number;
  avgProgress: number;
  pendingLessons: Array<{
    lessonTitle: string;
    courseTitle: string;
    courseSlug: string;
    moduleName: string;
  }>;
}

export function StudentDashboardClient({
  data,
}: {
  data: StudentDashboardData;
}) {
  const {
    userName,
    academicProfile,
    gamificationProfile,
    enrollments,
    upcomingSessions,
    todaySessions,
    completedCourses,
    avgProgress,
    pendingLessons,
  } = data;

  // Get action cards with dynamic badges
  const actionCards = getActionCardsForRole("STUDENT", {
    todaySessionsCount: todaySessions.length,
    pendingLessonsCount: pendingLessons.length,
    gamificationLevel: gamificationProfile?.level,
  });

  return (
    <>
      {/* Welcome Section - Always visible */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {userName}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Keep learning and growing every day!
        </p>
      </div>

      {/* Quick Actions - NEW */}
      <CollapsibleSection
        title="Quick Actions"
        icon="🚀"
        defaultExpanded={true}
        persistKey="student-actions"
      >
        <ActionCardsSection actions={actionCards} columns={3} />
      </CollapsibleSection>

      {/* Top Stats Row */}
      <CollapsibleSection
        title="My Stats"
        icon="📊"
        defaultExpanded={true}
        persistKey="student-stats"
      >
        <div className="grid md:grid-cols-4 gap-6 mt-4">
          <Link href="/dashboard/student/sessions" className="block">
            <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 p-6 rounded-xl shadow-lg text-white hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Today&apos;s Lessons</h3>
                  <p className="text-4xl font-bold">{todaySessions.length}</p>
                  <p className="text-sm opacity-90">scheduled today</p>
                </div>
                <div className="text-5xl opacity-80" aria-hidden="true">📅</div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/student/gamification" className="block">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-xl shadow-lg text-white hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Total XP</h3>
                  <p className="text-4xl font-bold">{gamificationProfile?.xp || 0}</p>
                </div>
                <div className="text-5xl opacity-80" aria-hidden="true">⭐</div>
              </div>
            </div>
          </Link>

          <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Reading Age</h3>
                <p className="text-4xl font-bold">
                  {academicProfile?.readingAge ? `${academicProfile.readingAge.toFixed(1)}` : "N/A"}
                </p>
                {academicProfile?.readingAge && <p className="text-sm opacity-90">years</p>}
              </div>
              <div className="text-5xl opacity-80" aria-hidden="true">📖</div>
            </div>
          </div>

          <Link href="/dashboard/student/gamification" className="block">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-xl shadow-lg text-white hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Level</h3>
                  <p className="text-4xl font-bold">{gamificationProfile?.level || 1}</p>
                </div>
                <div className="text-5xl opacity-80" aria-hidden="true">🏆</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Streak & Badges Row */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Link href="/dashboard/student/gamification" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="text-4xl" aria-hidden="true">🔥</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Streak</h3>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {gamificationProfile?.streak || 0} days
                  </p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/dashboard/student/gamification" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="text-4xl" aria-hidden="true">🎖️</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Badges Earned</h3>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {gamificationProfile?.badges.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </CollapsibleSection>

      {/* Academic Profile */}
      {academicProfile && (
        <CollapsibleSection
          title="Academic Profile"
          icon="🎓"
          defaultExpanded={false}
          persistKey="student-academic"
        >
          <div className="grid md:grid-cols-4 gap-6 mt-4">
            {academicProfile.readingAge && (
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl mb-2">📖</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Reading Age</h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {academicProfile.readingAge.toFixed(1)} yrs
                </p>
              </div>
            )}
            {academicProfile.numeracyAge && (
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl mb-2">🔢</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Numeracy Age</h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {academicProfile.numeracyAge.toFixed(1)} yrs
                </p>
              </div>
            )}
            {academicProfile.comprehensionIndex && (
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-3xl mb-2">🧠</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Comprehension</h4>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {academicProfile.comprehensionIndex.toFixed(0)}%
                </p>
              </div>
            )}
            {academicProfile.writingProficiency && (
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-3xl mb-2">✍️</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Writing</h4>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {academicProfile.writingProficiency.toFixed(0)}%
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Upcoming Sessions */}
      <CollapsibleSection
        title="Upcoming Sessions"
        icon="📅"
        badge={upcomingSessions.length > 0 ? upcomingSessions.length : undefined}
        defaultExpanded={true}
        persistKey="student-sessions"
      >
        {upcomingSessions.length > 0 ? (
          <div className="space-y-4 mt-4">
            {upcomingSessions.map((s) => (
              <Link key={s.id} href="/dashboard/student/sessions" className="block">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer">
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
                        {s.status === "LIVE" && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-xs font-semibold animate-pulse">
                            LIVE NOW
                          </span>
                        )}
                      </div>
                    </div>
                    {s.joinUrl && (
                      <a
                        href={s.joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm whitespace-nowrap"
                      >
                        Join
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4 mt-4">
            No upcoming sessions scheduled.
          </p>
        )}
      </CollapsibleSection>

      {/* Assignments Due */}
      <CollapsibleSection
        title="Assignments Due"
        icon="📝"
        badge={pendingLessons.length > 0 ? pendingLessons.length : undefined}
        defaultExpanded={true}
        persistKey="student-assignments"
      >
        {pendingLessons.length > 0 ? (
          <div className="space-y-3 mt-4">
            {pendingLessons.slice(0, 10).map((lesson, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {lesson.lessonTitle}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {lesson.courseTitle} &middot; {lesson.moduleName}
                  </p>
                </div>
                <Link
                  href={`/courses/${lesson.courseSlug}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm whitespace-nowrap"
                >
                  Start
                </Link>
              </div>
            ))}
            {pendingLessons.length > 10 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                + {pendingLessons.length - 10} more pending lessons
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4 mt-4">
            All caught up! No pending assignments.
          </p>
        )}
      </CollapsibleSection>

      {/* Course Progress Summary */}
      <CollapsibleSection
        title="Course Progress"
        icon="📈"
        defaultExpanded={false}
        persistKey="student-progress"
      >
        <div className="grid md:grid-cols-3 gap-6 mt-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Enrolled Courses
            </h3>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {enrollments.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Completed
            </h3>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {completedCourses}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Avg Progress
            </h3>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {avgProgress.toFixed(0)}%
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* My Courses */}
      <CollapsibleSection
        title="My Courses"
        icon="📚"
        badge={enrollments.length}
        defaultExpanded={false}
        persistKey="student-courses"
      >
        {enrollments.length > 0 ? (
          <div className="space-y-4 mt-4">
            {enrollments.map((enrollment) => (
              <Link
                key={enrollment.id}
                href={`/courses/${enrollment.course.slug}`}
                className="block"
              >
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {enrollment.course.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Instructor: {enrollment.course.teacher.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {enrollment.progress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/courses/${enrollment.course.slug}`}
                      className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm whitespace-nowrap"
                    >
                      Continue
                    </Link>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8 mt-4">
            You haven&apos;t enrolled in any courses yet.{" "}
            <Link href="/courses" className="text-blue-600 hover:underline">
              Browse courses
            </Link>
          </p>
        )}
      </CollapsibleSection>

      {/* Recent Badges */}
      {gamificationProfile && gamificationProfile.badges.length > 0 && (
        <CollapsibleSection
          title="Recent Badges"
          icon="🏅"
          badge={gamificationProfile.badges.length}
          defaultExpanded={false}
          persistKey="student-badges"
        >
          <div className="grid md:grid-cols-5 gap-4 mt-4">
            {gamificationProfile.badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 p-4 rounded-lg text-center"
              >
                <div className="text-4xl mb-2">
                  {badge.iconUrl || "🏅"}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  {badge.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {badge.type}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </>
  );
}
