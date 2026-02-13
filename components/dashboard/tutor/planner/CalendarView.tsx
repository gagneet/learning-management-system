"use client";

import { useState } from "react";
import Link from "next/link";

interface SessionCard {
  id: string;
  title: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | "DRAFT";
  startTime: Date;
  duration: number;
  studentCount: number;
  courseTitle: string;
}

interface CalendarViewProps {
  sessions: SessionCard[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onCreateSession: () => void;
}

export default function CalendarView({
  sessions,
  currentDate,
  onDateChange,
  onCreateSession,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const statusConfig = {
    COMPLETED: {
      icon: "✅",
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-800 dark:text-green-200",
    },
    SCHEDULED: {
      icon: "📝",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
    },
    DRAFT: {
      icon: "⏸️",
      bg: "bg-gray-50 dark:bg-gray-900/20",
      border: "border-gray-200 dark:border-gray-700",
      text: "text-gray-800 dark:text-gray-200",
    },
    CANCELLED: {
      icon: "🔴",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
    },
    LIVE: {
      icon: "🔵",
      bg: "bg-teal-50 dark:bg-teal-900/20",
      border: "border-teal-200 dark:border-teal-800",
      text: "text-teal-800 dark:text-teal-200",
    },
  };

  const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getSessionsForDate = (date: Date): SessionCard[] => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.startTime);
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    onDateChange(newDate);
  };

  const weekDays = getWeekDays(currentDate);
  const startDate = weekDays[0];
  const endDate = weekDays[6];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Session Planner
          </h2>
          <button
            onClick={onCreateSession}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            + New Session
          </button>
          <Link
            href="/dashboard/tutor/planner/templates"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            📋 Templates
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              📅 Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              📅 Month
            </button>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateWeek("prev")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          ◀
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Week of {formatDate(startDate)} - {formatDate(endDate)},{" "}
          {currentDate.getFullYear()}
        </h3>
        <button
          onClick={() => navigateWeek("next")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          ▶
        </button>
      </div>

      {/* Calendar Grid */}
      {viewMode === "week" && (
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((date, index) => {
            const daySessions = getSessionsForDate(date);
            const isToday =
              date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`border rounded-lg p-3 min-h-[200px] ${
                  isToday
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* Day Header */}
                <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      isToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </div>

                {/* Session Cards */}
                <div className="space-y-2">
                  {daySessions.length === 0 ? (
                    <button
                      onClick={onCreateSession}
                      className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                    >
                      + Add
                    </button>
                  ) : (
                    daySessions.map((session) => {
                      const config = statusConfig[session.status];
                      return (
                        <Link
                          key={session.id}
                          href={`/dashboard/tutor/planner/sessions/${session.id}`}
                          className={`block ${config.bg} ${config.border} border-l-4 rounded-lg p-2 hover:shadow-md transition-all cursor-pointer`}
                        >
                          <div className="flex items-start gap-2 mb-1">
                            <span className="text-lg">{config.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {session.title}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {formatTime(session.startTime)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {session.courseTitle}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {session.studentCount} student
                            {session.studentCount !== 1 ? "s" : ""} •{" "}
                            {session.duration}min
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Status:
          </span>
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <span className="text-gray-600 dark:text-gray-400">
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
