"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  User,
  AcademicProfile,
  GamificationProfile,
  Enrollment,
  Course,
  StudentSessionEnrollment,
  Session,
  HomeworkAssignment,
  Exercise,
  ExerciseAttempt,
  Badge,
  Achievement,
} from "@prisma/client";

interface ChildData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  academicProfile: AcademicProfile | null;
  gamificationProfile: (GamificationProfile & {
    badges: Badge[];
    achievements: Achievement[];
  }) | null;
  enrollments: (Enrollment & {
    course: {
      id: string;
      title: string;
      slug: string;
      teacher: {
        name: string;
        email: string;
      };
    };
  })[];
  upcomingSessions: (StudentSessionEnrollment & {
    session: {
      id: string;
      title: string;
      startTime: Date;
      endTime: Date | null;
      duration: number | null;
      sessionMode: string;
      physicalLocation: string | null;
      status: string;
      tutor: {
        name: string;
        email: string;
      };
    };
    course: { title: string } | null;
    lesson: { title: string } | null;
  })[];
  todaySessions: (StudentSessionEnrollment & {
    session: {
      id: string;
      title: string;
      startTime: Date;
      endTime: Date | null;
      duration: number | null;
      status: string;
      sessionMode: string;
      physicalLocation: string | null;
      tutor: {
        name: string;
      };
    };
    course: { title: string } | null;
  })[];
  homeworkAssignments: (HomeworkAssignment & {
    course: { title: string };
    exercise: { title: string };
  })[];
  recentActivity: (ExerciseAttempt & {
    exercise: {
      title: string;
      exerciseType: string;
    };
  })[];
}

interface ParentDashboardClientProps {
  parentName: string;
  childrenData: ChildData[];
}

export function ParentDashboardClient({ parentName, childrenData }: ParentDashboardClientProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>(childrenData[0]?.id || "");

  const selectedChild = childrenData.find((c) => c.id === selectedChildId);

  if (!selectedChild) {
    return <div>No child data available</div>;
  }

  const totalHomework = selectedChild.homeworkAssignments.length;
  const pendingHomework = selectedChild.homeworkAssignments.filter(
    (h) => h.status === "NOT_STARTED" || h.status === "IN_PROGRESS"
  ).length;

  const avgProgress =
    selectedChild.enrollments.length > 0
      ? selectedChild.enrollments.reduce((sum, e) => sum + e.progress, 0) /
        selectedChild.enrollments.length
      : 0;

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {parentName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your children&apos;s learning progress and stay connected with their education
        </p>
      </div>

      {/* Child Selector */}
      {childrenData.length > 1 && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Select Child
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {childrenData.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedChildId === child.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-400"
                }`}
              >
                <div className="text-4xl mb-2">
                  {child.avatar ? (
                    <img
                      src={child.avatar}
                      alt={child.name}
                      className="w-16 h-16 rounded-full mx-auto"
                    />
                  ) : (
                    "👤"
                  )}
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {child.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Child Name Header (for single child or selected child) */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {selectedChild.name}&apos;s Dashboard
        </h2>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          📅 Today&apos;s Schedule
        </h3>

        {selectedChild.todaySessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No sessions scheduled for today
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedChild.todaySessions.map((enrollment) => (
              <div
                key={enrollment.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {enrollment.session.title}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          enrollment.session.status === "LIVE"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse"
                            : enrollment.session.status === "COMPLETED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {enrollment.session.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {enrollment.course?.title || "General Session"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        🕐{" "}
                        {new Date(enrollment.session.startTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      {enrollment.session.endTime && (
                        <span>
                          -{" "}
                          {new Date(enrollment.session.endTime).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      )}
                      <span>👨‍🏫 {enrollment.session.tutor.name}</span>
                      {enrollment.session.sessionMode === "PHYSICAL" &&
                        enrollment.session.physicalLocation && (
                          <span>📍 {enrollment.session.physicalLocation}</span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {selectedChild.enrollments.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Courses</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
            {pendingHomework}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Pending Homework
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-4xl mb-2">📈</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
            {avgProgress.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg Progress
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {selectedChild.gamificationProfile?.badges.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Badges Earned
          </div>
        </div>
      </div>

      {/* Academic Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          📊 Academic Progress
        </h3>

        {selectedChild.academicProfile ? (
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Reading Age
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedChild.academicProfile.readingAge
                  ? `${selectedChild.academicProfile.readingAge} years`
                  : "Not assessed"}
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Numeracy Age
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedChild.academicProfile.numeracyAge
                  ? `${selectedChild.academicProfile.numeracyAge} years`
                  : "Not assessed"}
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Comprehension Index
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedChild.academicProfile.comprehensionIndex
                  ? `${selectedChild.academicProfile.comprehensionIndex}%`
                  : "Not assessed"}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Academic profile not yet created
            </p>
          </div>
        )}

        {/* Course Progress */}
        {selectedChild.enrollments.length > 0 && (
          <>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Course Progress
            </h4>
            <div className="space-y-4">
              {selectedChild.enrollments.map((enrollment) => (
                <div key={enrollment.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {enrollment.course.title}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Teacher: {enrollment.course.teacher.name}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {enrollment.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Upcoming Sessions */}
      {selectedChild.upcomingSessions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            📆 Upcoming Sessions (Next 7 Days)
          </h3>

          <div className="space-y-3">
            {selectedChild.upcomingSessions.map((enrollment) => (
              <div
                key={enrollment.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {enrollment.session.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {enrollment.course?.title || "General Session"}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        📅{" "}
                        {new Date(enrollment.session.startTime).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>
                        🕐{" "}
                        {new Date(enrollment.session.startTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                      <span>👨‍🏫 {enrollment.session.tutor.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Homework & Recent Activity */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Homework */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            📝 Homework
          </h3>

          {totalHomework === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-2">✅</div>
              <p className="text-gray-500 dark:text-gray-400">
                No pending homework
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedChild.homeworkAssignments.map((hw) => (
                <div
                  key={hw.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {hw.exercise.title}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        hw.status === "NOT_STARTED"
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          : hw.status === "IN_PROGRESS"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                    >
                      {hw.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {hw.course.title}
                  </div>
                  {hw.dueDate && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Due:{" "}
                      {new Date(hw.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Recent Activity (Last 30 Days)
          </h3>

          {selectedChild.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No recent activity
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedChild.recentActivity.map((attempt) => (
                <div
                  key={attempt.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        {attempt.exercise.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {attempt.exercise.exerciseType.replace("_", " ")}
                      </div>
                    </div>
                    {attempt.score !== null && attempt.maxScore && (
                      <div className="text-sm font-semibold">
                        <span
                          className={`${
                            attempt.score / attempt.maxScore >= 0.7
                              ? "text-green-600 dark:text-green-400"
                              : attempt.score / attempt.maxScore >= 0.5
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {attempt.score}/{attempt.maxScore}
                        </span>
                      </div>
                    )}
                  </div>
                  {attempt.submittedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(attempt.submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gamification & Achievements */}
      {selectedChild.gamificationProfile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🏆 Achievements & Badges
          </h3>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total XP
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {selectedChild.gamificationProfile.xp}
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Level
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {selectedChild.gamificationProfile.level}
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Day Streak
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {selectedChild.gamificationProfile.streak} 🔥
              </div>
            </div>
          </div>

          {selectedChild.gamificationProfile.badges.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Recent Badges
              </h4>
              <div className="flex flex-wrap gap-4">
                {selectedChild.gamificationProfile.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="text-3xl mb-1">
                      {badge.iconUrl ? (
                        <img src={badge.iconUrl} alt={badge.name} className="w-12 h-12" />
                      ) : (
                        "🏅"
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                      {badge.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(badge.earnedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <Link
          href={`/dashboard/parent/child/${selectedChildId}`}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          View Full Profile
        </Link>
        <Link
          href="/dashboard/parent/messages"
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Messages
        </Link>
        <Link
          href="/dashboard/parent/invoices"
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Billing & Invoices
        </Link>
      </div>
    </>
  );
}
