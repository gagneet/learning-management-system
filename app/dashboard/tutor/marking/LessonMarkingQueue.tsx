"use client";

import { useState } from "react";
import { BookOpen, CheckCircle, AlertCircle, Clock, Star } from "lucide-react";

interface SubmittedLesson {
  id: string;
  studentId: string;
  placementId: string;
  lessonId: string;
  timeSpentMinutes: number | null;
  completedAt: string | null;
  student: { id: string; name: string | null; email: string };
  lesson: {
    id: string;
    lessonNumber: number;
    title: string;
    subject: string;
    difficultyScore: number;
    estimatedMinutes: number;
  };
  placement: {
    id: string;
    subject: string;
    currentAge: { displayLabel: string; australianYear: string | null };
  };
}

interface Props {
  submittedLessons: SubmittedLesson[];
}

interface MarkingState {
  score: string;
  feedback: string;
  loading: boolean;
  error: string | null;
}

const SUBJECT_BADGE_COLORS: Record<string, string> = {
  ENGLISH:     "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  MATHEMATICS: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  SCIENCE:     "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  HISTORY:     "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  GEOGRAPHY:   "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
};

function subjectBadgeClass(subject: string): string {
  return (
    SUBJECT_BADGE_COLORS[subject.toUpperCase()] ??
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
  );
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function LessonMarkingQueue({ submittedLessons }: Props) {
  const [lessons, setLessons] = useState<SubmittedLesson[]>(submittedLessons);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [markingState, setMarkingState] = useState<Record<string, MarkingState>>({});
  const [toast, setToast] = useState<string | null>(null);

  function getState(id: string): MarkingState {
    return markingState[id] ?? { score: "", feedback: "", loading: false, error: null };
  }

  function updateState(id: string, patch: Partial<MarkingState>) {
    setMarkingState((prev) => ({
      ...prev,
      [id]: { ...getState(id), ...patch },
    }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleMark(
    lesson: SubmittedLesson,
    markStatus: "MARKED" | "NEEDS_REVISION"
  ) {
    const state = getState(lesson.id);

    if (markStatus === "MARKED") {
      const scoreNum = parseFloat(state.score);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        updateState(lesson.id, { error: "Score must be a number between 0 and 100." });
        return;
      }
    }

    updateState(lesson.id, { loading: true, error: null });

    try {
      const body: Record<string, unknown> = {
        lessonId: lesson.lessonId,
        status: markStatus,
        feedback: state.feedback || undefined,
      };

      if (markStatus === "MARKED") {
        body.score = parseFloat(state.score);
      }

      const res = await fetch(
        `/api/v1/student-placements/${lesson.placementId}/lesson-completions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      // Remove the lesson row from the displayed list
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
      setExpandedId(null);
      showToast("Lesson marked!");
    } catch (err) {
      updateState(lesson.id, {
        loading: false,
        error: err instanceof Error ? err.message : "An error occurred.",
      });
    }
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-500" />
          Assessment Lessons
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            0
          </span>
        </h2>
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No lessons awaiting marking
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Submitted assessment lessons will appear here for review.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 relative">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-indigo-500" />
        Assessment Lessons
        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
          {lessons.length}
        </span>
      </h2>

      <div className="space-y-3">
        {lessons.map((lesson) => {
          const state = getState(lesson.id);
          const isExpanded = expandedId === lesson.id;

          return (
            <div
              key={lesson.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Row */}
              <div className="flex flex-wrap items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                {/* Student */}
                <div className="flex-1 min-w-[140px]">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {lesson.student.name ?? "Unknown Student"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {lesson.student.email}
                  </div>
                </div>

                {/* Subject badge */}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${subjectBadgeClass(lesson.lesson.subject)}`}
                >
                  {lesson.lesson.subject}
                </span>

                {/* Lesson info */}
                <div className="flex-1 min-w-[160px]">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    #{lesson.lesson.lessonNumber} — {lesson.lesson.title}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Difficulty {lesson.lesson.difficultyScore}
                    </span>
                  </div>
                </div>

                {/* Level */}
                <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  <span className="font-medium">
                    {lesson.placement.currentAge.displayLabel}
                  </span>
                  {lesson.placement.currentAge.australianYear && (
                    <span className="ml-1 text-gray-400 dark:text-gray-500">
                      (Yr {lesson.placement.currentAge.australianYear})
                    </span>
                  )}
                </div>

                {/* Submitted */}
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5" />
                  {formatRelativeTime(lesson.completedAt)}
                </div>

                {/* Time spent */}
                {lesson.timeSpentMinutes != null && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {lesson.timeSpentMinutes}m spent
                  </div>
                )}

                {/* Mark button */}
                <button
                  onClick={() => toggleExpand(lesson.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  {isExpanded ? "Close" : "Mark"}
                </button>
              </div>

              {/* Inline marking panel */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    Mark: {lesson.student.name} — Lesson #{lesson.lesson.lessonNumber}
                  </h4>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    {/* Score input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Score (0–100)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="e.g. 85"
                        value={state.score}
                        onChange={(e) =>
                          updateState(lesson.id, { score: e.target.value, error: null })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Required for Mark as Complete; optional for Needs Revision.
                      </p>
                    </div>

                    {/* Feedback textarea */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Feedback
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Provide feedback to the student..."
                        value={state.feedback}
                        onChange={(e) =>
                          updateState(lesson.id, { feedback: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {state.error && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {state.error}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleMark(lesson, "MARKED")}
                      disabled={state.loading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {state.loading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Mark as Complete
                    </button>

                    <button
                      onClick={() => handleMark(lesson, "NEEDS_REVISION")}
                      disabled={state.loading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {state.loading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      Needs Revision
                    </button>

                    <button
                      onClick={() => toggleExpand(lesson.id)}
                      disabled={state.loading}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
