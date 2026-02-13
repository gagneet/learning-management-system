"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { HomeworkAssignment, Course, Exercise, User } from "@prisma/client";

type HomeworkWithRelations = HomeworkAssignment & {
  course: Pick<Course, "title">;
  exercise: Pick<Exercise, "title">;
  assignedBy: Pick<User, "name">;
};

interface HomeworkTrackerClientProps {
  homework: HomeworkWithRelations[];
}

type StatusFilter = "ALL" | "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";

export function HomeworkTrackerClient({ homework }: HomeworkTrackerClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Calculate homework streak (consecutive days with completed homework)
  const homeworkStreak = useMemo(() => {
    if (homework.length === 0) return 0;

    const gradedHomework = homework
      .filter((hw) => hw.status === "GRADED" && hw.gradedAt)
      .sort((a, b) => new Date(b.gradedAt!).getTime() - new Date(a.gradedAt!).getTime());

    if (gradedHomework.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(gradedHomework[0].gradedAt!);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < gradedHomework.length; i++) {
      const prevDate = new Date(gradedHomework[i].gradedAt!);
      prevDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        streak++;
        currentDate = prevDate;
      } else if (diffDays > 1) {
        break;
      }
    }

    return streak;
  }, [homework]);

  // Filter homework
  const filteredHomework = useMemo(() => {
    if (statusFilter === "ALL") return homework;
    return homework.filter((hw) => hw.status === statusFilter);
  }, [homework, statusFilter]);

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      case "IN_PROGRESS":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case "SUBMITTED":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "GRADED":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  // Calculate days until due
  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", color: "text-red-600 dark:text-red-400" };
    if (diffDays === 0) return { text: "Due today", color: "text-orange-600 dark:text-orange-400" };
    if (diffDays === 1) return { text: "Due tomorrow", color: "text-yellow-600 dark:text-yellow-400" };
    return { text: `${diffDays} days left`, color: "text-gray-600 dark:text-gray-400" };
  };

  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/student"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Homework Tracker
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your homework assignments and deadlines
        </p>
      </div>

      {/* Homework Streak Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-6xl">🔥</div>
            <div>
              <h3 className="text-2xl font-bold">Homework Streak</h3>
              <p className="text-orange-100">Keep up the great work!</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-6xl font-bold">{homeworkStreak}</p>
            <p className="text-orange-100">consecutive days</p>
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              All ({homework.length})
            </button>
            <button
              onClick={() => setStatusFilter("NOT_STARTED")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === "NOT_STARTED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Not Started ({homework.filter((h) => h.status === "NOT_STARTED").length})
            </button>
            <button
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === "IN_PROGRESS"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              In Progress ({homework.filter((h) => h.status === "IN_PROGRESS").length})
            </button>
            <button
              onClick={() => setStatusFilter("SUBMITTED")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === "SUBMITTED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Submitted ({homework.filter((h) => h.status === "SUBMITTED").length})
            </button>
            <button
              onClick={() => setStatusFilter("GRADED")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                statusFilter === "GRADED"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Graded ({homework.filter((h) => h.status === "GRADED").length})
            </button>
          </div>
        </div>
      </div>

      {/* Homework Cards */}
      {filteredHomework.length > 0 ? (
        <div className="space-y-4">
          {filteredHomework.map((hw) => {
            const dueInfo = getDaysUntilDue(hw.dueDate);
            return (
              <div
                key={hw.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {hw.exercise.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(hw.status)}`}>
                        {hw.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Course:</span> {hw.course.title}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Assigned by:</span> {hw.assignedBy.name}
                      </p>
                      <p className={`font-medium ${dueInfo.color}`}>
                        <span className="text-gray-600 dark:text-gray-400">Due:</span>{" "}
                        {new Date(hw.dueDate).toLocaleDateString()} ({dueInfo.text})
                      </p>
                    </div>

                    {hw.status === "GRADED" && hw.totalScore !== null && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Score
                            </p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {hw.totalScore.toFixed(0)} / {hw.totalMaxScore}
                            </p>
                          </div>
                          <div className="text-4xl">
                            {hw.totalScore / hw.totalMaxScore >= 0.9 ? "🌟" : hw.totalScore / hw.totalMaxScore >= 0.7 ? "👍" : "📝"}
                          </div>
                        </div>
                        {hw.feedback && (
                          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Tutor Feedback
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{hw.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {hw.status !== "GRADED" && (
                      <button
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium whitespace-nowrap transition"
                      >
                        {hw.status === "NOT_STARTED" ? "Start Homework" : "Continue"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No homework assignments
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {statusFilter === "ALL"
              ? "You don't have any homework assignments yet."
              : `No homework assignments with status "${statusFilter.replace(/_/g, " ")}".`}
          </p>
        </div>
      )}
    </div>
  );
}
