"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MyDayClientProps {
  initialData: any;
  tutorName: string;
}

export function MyDayClient({ initialData, tutorName }: MyDayClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // Refresh data every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/academic/tutor/my-day");
        if (res.ok) {
          const newData = await res.json();
          setData(newData);
        }
      } catch (error) {
        console.error("Failed to refresh dashboard:", error);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading your day...</div>
      </div>
    );
  }

  const { todaySessions, helpRequests, pendingMarking, studentsNeedingAttention, stats } = data;

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeUntil = (date: Date | string) => {
    const now = new Date();
    const target = new Date(date);
    const diff = target.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return "Started";
    if (minutes === 0) return "Starting now!";
    if (minutes < 60) return `in ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `in ${hours}h ${minutes % 60}m`;
  };

  const getSessionStatusColor = (startTime: Date | string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diff = start.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
    if (minutes <= 15) return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200";
    return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Good day, {tutorName}! ☀️</h1>
        <p className="text-blue-100">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📅</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.sessionsToday}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Sessions Today</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">🆘</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.activeHelpRequests}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Help Requests</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">📝</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.pendingMarking}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending Marking</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-3xl">⚠️</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.studentsNeedingAttention}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Need Attention</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">📅 Today&apos;s Sessions</h2>
            <Link
              href="/dashboard/tutor/sessions"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All →
            </Link>
          </div>

          {todaySessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No sessions scheduled for today
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map((session: any) => (
                <Link
                  key={session.id}
                  href={`/dashboard/tutor/sessions/${session.id}`}
                  className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-blue-500 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {session.title}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.startTime)}`}>
                      {getTimeUntil(session.startTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      👥 {session.studentEnrollments.length} students
                    </span>
                    {session.attendanceRecords.length > 0 && (
                      <span className="text-sm text-green-600 dark:text-green-400">
                        ✓ Attendance marked
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active Help Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">🆘 Help Requests</h2>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              helpRequests.length > 0
                ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
            }`}>
              {helpRequests.length} Active
            </span>
          </div>

          {helpRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No active help requests 🎉
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {helpRequests.map((request: any) => (
                <div
                  key={request.id}
                  className={`border rounded-lg p-3 ${
                    request.priority === "URGENT"
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : request.priority === "HIGH"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm">
                        {request.student.avatar ? (
                          <img
                            src={request.student.avatar}
                            alt={request.student.name}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          request.student.name[0]
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {request.student.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(request.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.priority === "URGENT"
                        ? "bg-red-600 text-white"
                        : request.priority === "HIGH"
                        ? "bg-orange-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}>
                      {request.priority}
                    </span>
                  </div>
                  {request.exercise && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      📚 {request.exercise.title}
                    </div>
                  )}
                  {request.message && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {request.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Marking */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">📝 Pending Marking</h2>
            <Link
              href="/dashboard/tutor/marking"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All →
            </Link>
          </div>

          {pendingMarking.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              All caught up! 🎉
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pendingMarking.slice(0, 10).map((homework: any) => (
                <Link
                  key={homework.id}
                  href="/dashboard/tutor/marking"
                  className="block border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm">
                        {homework.student.avatar ? (
                          <img
                            src={homework.student.avatar}
                            alt={homework.student.name}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          homework.student.name[0]
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {homework.student.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {homework.exercise.title}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {homework.submittedAt &&
                        new Date(homework.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Students Needing Attention */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">⚠️ Need Attention</h2>
            <Link
              href="/dashboard/tutor/students"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All →
            </Link>
          </div>

          {studentsNeedingAttention.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              All students on track! ✨
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {studentsNeedingAttention.map((student: any) => (
                <Link
                  key={student.id}
                  href={`/dashboard/tutor/students/${student.id}`}
                  className="block border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center text-sm">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          student.name[0]
                        )}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {student.name}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                      {Math.round(student.averageProgress)}%
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Avg Progress: {Math.round(student.averageProgress)}% •
                    Recent Score: {Math.round(student.averageScore)}%
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/tutor/planner"
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-blue-500 transition-all"
          >
            <div className="text-3xl">📅</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
              Plan Session
            </div>
          </Link>

          <Link
            href="/dashboard/tutor/marking"
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-blue-500 transition-all"
          >
            <div className="text-3xl">📝</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
              Mark Work
            </div>
          </Link>

          <Link
            href="/dashboard/tutor/content-library"
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-blue-500 transition-all"
          >
            <div className="text-3xl">📚</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
              Browse Content
            </div>
          </Link>

          <Link
            href="/dashboard/tutor/students"
            className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-blue-500 transition-all"
          >
            <div className="text-3xl">👥</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white text-center">
              View Students
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
