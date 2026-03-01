"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Send,
} from "lucide-react";

interface Props {
  placementId: string;
  placement: {
    id: string;
    subject: string;
    lessonsCompleted: number;
    readyForPromotion: boolean;
    currentAge: {
      displayLabel: string;
      australianYear: string | null;
    };
  };
  lesson: {
    id: string;
    lessonNumber: number;
    title: string;
    description: string | null;
    learningObjectives: Array<{ objective: string; bloomsLevel?: string }> | null;
    difficultyScore: number;
    estimatedMinutes: number;
    curriculumCode: string | null;
    strandArea: string | null;
    subject: string;
  };
  completion: {
    id: string;
    status: string;
    score: number | null;
    percentageScore: number | null;
    feedback: string | null;
    timeSpentMinutes: number | null;
    startedAt: string | null;
    completedAt: string | null;
    gradedBy: { name: string | null; role: string } | null;
  } | null;
  prevLesson: { id: string; lessonNumber: number; title: string } | null;
  nextLesson: { id: string; lessonNumber: number; title: string } | null;
  totalLessons: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  NOT_STARTED: {
    label: "Not Started",
    bgClass: "bg-gray-100 dark:bg-gray-700",
    textClass: "text-gray-600 dark:text-gray-300",
    borderClass: "border-gray-200 dark:border-gray-600",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bgClass: "bg-blue-100 dark:bg-blue-900/40",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-200 dark:border-blue-700",
  },
  SUBMITTED: {
    label: "Submitted",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/40",
    textClass: "text-yellow-700 dark:text-yellow-300",
    borderClass: "border-yellow-200 dark:border-yellow-700",
  },
  MARKED: {
    label: "Marked",
    bgClass: "bg-green-100 dark:bg-green-900/40",
    textClass: "text-green-700 dark:text-green-300",
    borderClass: "border-green-200 dark:border-green-700",
  },
  NEEDS_REVISION: {
    label: "Needs Revision",
    bgClass: "bg-red-100 dark:bg-red-900/40",
    textClass: "text-red-700 dark:text-red-300",
    borderClass: "border-red-200 dark:border-red-700",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_STARTED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      {config.label}
    </span>
  );
}

function ScoreDisplay({ percentageScore }: { percentageScore: number }) {
  const colorClass =
    percentageScore >= 75
      ? "text-green-600 dark:text-green-400"
      : percentageScore >= 50
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

  const bgClass =
    percentageScore >= 75
      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      : percentageScore >= 50
      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";

  return (
    <div className={`rounded-xl border p-4 ${bgClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
          <Star className="w-4 h-4" />
          Your Score
        </span>
        <span className={`text-2xl font-bold ${colorClass}`}>
          {Math.round(percentageScore)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            percentageScore >= 75
              ? "bg-green-500"
              : percentageScore >= 50
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          style={{ width: `${Math.min(percentageScore, 100)}%` }}
        />
      </div>
      <p className={`text-xs mt-1.5 ${colorClass}`}>
        {percentageScore >= 75
          ? "Excellent work!"
          : percentageScore >= 50
          ? "Good effort — review feedback"
          : "Review the material and resubmit"}
      </p>
    </div>
  );
}

export function LessonDetailClient({
  placementId,
  placement,
  lesson,
  completion,
  prevLesson,
  nextLesson,
  totalLessons,
}: Props) {
  const initialStatus = completion?.status ?? "NOT_STARTED";
  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [timeSpent, setTimeSpent] = useState<string>(
    String(lesson.estimatedMinutes)
  );

  const lessonBasePath = `/dashboard/student/assessment/${placementId}/lesson`;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const updateStatus = async (newStatus: string, timeSpentMinutes?: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/student-placements/${placementId}/lesson-completions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: lesson.id,
            status: newStatus,
            timeSpentMinutes,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setCurrentStatus(data.data.status);
        setShowSubmitForm(false);
        showToast(
          newStatus === "IN_PROGRESS"
            ? "Lesson started! Good luck."
            : newStatus === "SUBMITTED"
            ? "Lesson submitted for marking."
            : "Status updated successfully.",
          "success"
        );
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Failed to update status. Please try again.", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const minutes = parseInt(timeSpent, 10);
    updateStatus("SUBMITTED", isNaN(minutes) || minutes <= 0 ? undefined : minutes);
  };

  const difficultyPercent = Math.min(Math.max(lesson.difficultyScore, 0), 100);

  const bloomsColors: Record<string, string> = {
    Remember: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    Understand: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    Apply: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    Analyze: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    Evaluate: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    Create: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Breadcrumb + Navigation Row */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          <Link
            href="/dashboard/student/assessment"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Assessment
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <Link
            href="/dashboard/student/assessment"
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {placement.subject} Level {placement.currentAge.displayLabel}
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Lesson {lesson.lessonNumber}
          </span>
        </nav>

        {/* Prev / Next navigation */}
        <div className="flex items-center gap-2">
          {prevLesson ? (
            <Link
              href={`${lessonBasePath}/${prevLesson.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title={`Lesson ${prevLesson.lessonNumber}: ${prevLesson.title}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                Lesson {prevLesson.lessonNumber}
              </span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-300 dark:text-gray-600 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">First</span>
            </span>
          )}

          <span className="text-xs text-gray-400 dark:text-gray-500 px-1">
            {lesson.lessonNumber} / {totalLessons}
          </span>

          {nextLesson ? (
            <Link
              href={`${lessonBasePath}/${nextLesson.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title={`Lesson ${nextLesson.lessonNumber}: ${nextLesson.title}`}
            >
              <span className="hidden sm:inline">
                Lesson {nextLesson.lessonNumber}
              </span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-300 dark:text-gray-600 cursor-not-allowed">
              <span className="hidden sm:inline">Last</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                    Lesson {lesson.lessonNumber}
                  </p>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {lesson.title}
                  </h1>
                </div>
              </div>
              <StatusBadge status={currentStatus} />
            </div>
          </div>

          {/* Description */}
          {lesson.description && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {lesson.description}
              </p>
            </div>
          )}

          {/* Learning Objectives */}
          {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Learning Objectives
              </h2>
              <ul className="space-y-3">
                {lesson.learningObjectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
                        {obj.objective}
                      </p>
                      {obj.bloomsLevel && (
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                            bloomsColors[obj.bloomsLevel] ??
                            "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {obj.bloomsLevel}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Curriculum Alignment */}
          {(lesson.curriculumCode || lesson.strandArea) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Curriculum Alignment
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lesson.curriculumCode && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                      Curriculum Code
                    </p>
                    <p className="text-sm font-mono font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      {lesson.curriculumCode}
                    </p>
                  </div>
                )}
                {lesson.strandArea && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                      Strand / Area
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      {lesson.strandArea}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Actions
            </h2>

            {/* NOT_STARTED */}
            {(currentStatus === "NOT_STARTED") && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  onClick={() => updateStatus("IN_PROGRESS")}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm transition-colors"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                  Start Lesson
                </button>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  You haven&apos;t started this lesson yet. Click to begin.
                </p>
              </div>
            )}

            {/* IN_PROGRESS */}
            {currentStatus === "IN_PROGRESS" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This lesson is in progress. Complete your work, then submit for marking.
                  </p>
                </div>

                {!showSubmitForm ? (
                  <button
                    onClick={() => setShowSubmitForm(true)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium text-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Submit for Marking
                  </button>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Submit for Marking
                    </h3>
                    <div>
                      <label
                        htmlFor="time-spent"
                        className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                      >
                        Time spent (minutes) — optional
                      </label>
                      <input
                        id="time-spent"
                        type="number"
                        min="1"
                        max="600"
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(e.target.value)}
                        className="w-32 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={String(lesson.estimatedMinutes)}
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Suggested: {lesson.estimatedMinutes} min
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium text-sm transition-colors"
                      >
                        {loading ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Confirm Submission
                      </button>
                      <button
                        onClick={() => setShowSubmitForm(false)}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBMITTED */}
            {currentStatus === "SUBMITTED" && (
              <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Awaiting marking...
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                    Your teacher will review and mark this lesson soon.
                  </p>
                </div>
              </div>
            )}

            {/* MARKED */}
            {currentStatus === "MARKED" && (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    This lesson has been marked.
                  </p>
                  {completion?.gradedBy && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      Graded by {completion.gradedBy.name ?? "your teacher"}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* NEEDS_REVISION */}
            {currentStatus === "NEEDS_REVISION" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Revision required
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      Please review the feedback below, make corrections, and resubmit.
                    </p>
                  </div>
                </div>

                {!showSubmitForm ? (
                  <button
                    onClick={() => setShowSubmitForm(true)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium text-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Resubmit
                  </button>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Resubmit for Marking
                    </h3>
                    <div>
                      <label
                        htmlFor="time-spent-revision"
                        className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
                      >
                        Additional time spent (minutes) — optional
                      </label>
                      <input
                        id="time-spent-revision"
                        type="number"
                        min="1"
                        max="600"
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(e.target.value)}
                        className="w-32 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium text-sm transition-colors"
                      >
                        {loading ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Confirm Resubmission
                      </button>
                      <button
                        onClick={() => setShowSubmitForm(false)}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — 1/3 */}
        <div className="space-y-4">
          {/* Lesson Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
              Lesson Info
            </h2>
            <div className="space-y-4">
              {/* Difficulty */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Difficulty</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {difficultyPercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      difficultyPercent >= 75
                        ? "bg-red-500"
                        : difficultyPercent >= 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${difficultyPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {difficultyPercent >= 75
                    ? "Challenging"
                    : difficultyPercent >= 50
                    ? "Moderate"
                    : "Foundational"}
                </p>
              </div>

              {/* Estimated time */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  Estimated Time
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {lesson.estimatedMinutes} min
                </span>
              </div>

              {/* Subject badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Subject</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {lesson.subject}
                </span>
              </div>

              {/* Level badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Level</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                  {placement.currentAge.australianYear
                    ? placement.currentAge.australianYear
                    : `Level ${placement.currentAge.displayLabel}`}
                </span>
              </div>

              {/* Progress in placement */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Overall Progress</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {placement.lessonsCompleted} / 25
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min((placement.lessonsCompleted / 25) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Promotion badge */}
              {placement.readyForPromotion && (
                <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Star className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">
                    Ready for promotion!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Score Card (shown if marked) */}
          {(currentStatus === "MARKED" || currentStatus === "NEEDS_REVISION") &&
            completion?.percentageScore != null && (
              <ScoreDisplay percentageScore={completion.percentageScore} />
            )}

          {/* Feedback Card */}
          {completion?.feedback && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Teacher Feedback
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {completion.feedback}
              </p>
              {completion.gradedBy && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  — {completion.gradedBy.name ?? "Teacher"}
                </p>
              )}
            </div>
          )}

          {/* Timing details (if started) */}
          {(completion?.startedAt || completion?.completedAt || completion?.timeSpentMinutes) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                Timing
              </h2>
              <div className="space-y-2 text-xs">
                {completion.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-500">Started</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {new Date(completion.startedAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {completion.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-500">Submitted</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {new Date(completion.completedAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {completion.timeSpentMinutes != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 dark:text-gray-500">Time spent</span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {completion.timeSpentMinutes} min
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
