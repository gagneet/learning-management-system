"use client";

import { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Lesson = {
  id: string;
  subject: string;
  lessonNumber: number;
  title: string;
  description: string | null;
  difficultyScore: number;
  estimatedMinutes: number | null;
  curriculumCode: string | null;
  strandArea: string | null;
  isActive: boolean;
  createdAt: string;
};

type PromotionTest = {
  id: string;
  subject: string;
  title: string;
  description: string | null;
  totalMarks: number;
  passingScore: number;
  excellenceScore: number;
  timeLimit: number;
  isAutoGraded: boolean;
  isActive: boolean;
  createdAt: string;
  attemptCount: number;
};

type Placement = {
  id: string;
  subject: string;
  lessonsCompleted: number;
  currentLessonNumber: number;
  readyForPromotion: boolean;
  status: string;
  placedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
};

type LevelData = {
  id: string;
  ageYear: number;
  ageMonth: number;
  displayLabel: string;
  australianYear: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  totalLessons: number;
  totalPromotionTests: number;
  totalPlacements: number;
  lessonsBySubject: Record<string, Lesson[]>;
  promotionTests: PromotionTest[];
  placements: Placement[];
};

type NewPromotionTestForm = {
  title: string;
  subject: string;
  description: string;
  totalMarks: string;
  passingScore: string;
  excellenceScore: string;
  isAutoGraded: boolean;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUBJECTS = ["ENGLISH", "MATHEMATICS", "SCIENCE", "STEM", "READING", "WRITING"] as const;
type SubjectKey = (typeof SUBJECTS)[number];

const SUBJECT_SHORT: Record<string, string> = {
  ENGLISH: "EN",
  MATHEMATICS: "MA",
  SCIENCE: "SC",
  STEM: "ST",
  READING: "RE",
  WRITING: "WR",
};

const SUBJECT_COLORS: Record<string, string> = {
  ENGLISH:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  MATHEMATICS:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  SCIENCE:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800",
  STEM:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800",
  READING:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800",
  WRITING:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800",
};

const SUBJECT_BUTTON_ACTIVE: Record<string, string> = {
  ENGLISH: "bg-blue-600 text-white",
  MATHEMATICS: "bg-purple-600 text-white",
  SCIENCE: "bg-green-600 text-white",
  STEM: "bg-cyan-600 text-white",
  READING: "bg-orange-500 text-white",
  WRITING: "bg-rose-600 text-white",
};

const DEFAULT_FORM: NewPromotionTestForm = {
  title: "",
  subject: "ENGLISH",
  description: "",
  totalMarks: "100",
  passingScore: "70",
  excellenceScore: "90",
  isAutoGraded: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function difficultyLabel(score: number): { label: string; color: string } {
  if (score <= 20) return { label: "Very Easy", color: "text-green-600 dark:text-green-400" };
  if (score <= 40) return { label: "Easy", color: "text-emerald-600 dark:text-emerald-400" };
  if (score <= 60) return { label: "Medium", color: "text-yellow-600 dark:text-yellow-400" };
  if (score <= 80) return { label: "Hard", color: "text-orange-600 dark:text-orange-400" };
  return { label: "Very Hard", color: "text-red-600 dark:text-red-400" };
}

function statusBadge(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "PROMOTION_PENDING":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    case "PROMOTED":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "PAUSED":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LessonsTab({
  lessonsBySubject,
}: {
  lessonsBySubject: Record<string, Lesson[]>;
}) {
  const availableSubjects = SUBJECTS.filter((s) => (lessonsBySubject[s]?.length ?? 0) > 0);
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>(
    availableSubjects[0] ?? "ENGLISH"
  );

  const lessons = lessonsBySubject[selectedSubject] ?? [];
  const progressPct = Math.min((lessons.length / 25) * 100, 100);

  return (
    <div className="space-y-5">
      {/* Subject selector */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((subject) => {
          const count = lessonsBySubject[subject]?.length ?? 0;
          const isSelected = subject === selectedSubject;
          return (
            <button
              key={subject}
              onClick={() => setSelectedSubject(subject)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? SUBJECT_BUTTON_ACTIVE[subject]
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <span>{subject.charAt(0) + subject.slice(1).toLowerCase()}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {SUBJECT_SHORT[selectedSubject] ?? selectedSubject} Lesson Coverage
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {lessons.length} / 25 lessons
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              lessons.length >= 25
                ? "bg-green-500"
                : lessons.length >= 15
                ? "bg-blue-500"
                : lessons.length >= 5
                ? "bg-yellow-500"
                : "bg-red-400"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {lessons.length >= 25
            ? "Complete — all 25 lessons added."
            : `${25 - lessons.length} more lesson${25 - lessons.length !== 1 ? "s" : ""} needed to complete this level.`}
        </p>
      </div>

      {/* Lessons grid */}
      {lessons.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No lessons found for{" "}
            {selectedSubject.charAt(0) + selectedSubject.slice(1).toLowerCase()} at this level.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28">
                    Difficulty
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                    Est. Mins
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-36">
                    Curriculum Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Strand / Area
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {lessons.map((lesson) => {
                  const diff = difficultyLabel(lesson.difficultyScore);
                  return (
                    <tr
                      key={lesson.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300">
                          {lesson.lessonNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {lesson.title}
                        </div>
                        {lesson.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                            {lesson.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-semibold ${diff.color}`}>
                          {diff.label}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">({lesson.difficultyScore})</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {lesson.estimatedMinutes ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {lesson.curriculumCode ? (
                          <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                            {lesson.curriculumCode}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {lesson.strandArea ?? <span className="text-gray-400 italic">—</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function PromotionTestsTab({
  levelId,
  promotionTests: initialTests,
}: {
  levelId: string;
  promotionTests: PromotionTest[];
}) {
  const [tests, setTests] = useState<PromotionTest[]>(initialTests);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewPromotionTestForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const totalMarks = parseInt(form.totalMarks, 10);
    const passingScore = parseInt(form.passingScore, 10);
    const excellenceScore = parseInt(form.excellenceScore, 10);

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (isNaN(totalMarks) || totalMarks < 1) {
      setFormError("Total marks must be a positive number.");
      return;
    }
    if (isNaN(passingScore) || passingScore < 0 || passingScore > 100) {
      setFormError("Passing score must be between 0 and 100.");
      return;
    }
    if (isNaN(excellenceScore) || excellenceScore < passingScore || excellenceScore > 100) {
      setFormError("Excellence score must be between the passing score and 100.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/promotion-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentAgeId: levelId,
          subject: form.subject,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          totalMarks,
          passingScore,
          excellenceScore,
          isAutoGraded: form.isAutoGraded,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error: ${res.statusText}`);
      }

      const created = await res.json();
      setTests((prev) => [
        ...prev,
        {
          id: created.id,
          subject: created.subject,
          title: created.title,
          description: created.description ?? null,
          totalMarks: created.totalMarks,
          passingScore: created.passingScore,
          excellenceScore: created.excellenceScore,
          timeLimit: created.timeLimit ?? 60,
          isAutoGraded: created.isAutoGraded ?? false,
          isActive: created.isActive ?? true,
          createdAt: created.createdAt,
          attemptCount: 0,
        },
      ]);
      setForm(DEFAULT_FORM);
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create promotion test.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {tests.length} promotion test{tests.length !== 1 ? "s" : ""} for this level
        </p>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setFormError(null);
          }}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {showForm ? "Cancel" : "Add Promotion Test"}
        </button>
      </div>

      {/* Add Promotion Test form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 space-y-4"
        >
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            New Promotion Test
          </h3>

          {formError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-2.5 text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Level 5.1 English Promotion Test"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Marks */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Marks
              </label>
              <input
                type="number"
                min={1}
                value={form.totalMarks}
                onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Passing Score */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.passingScore}
                onChange={(e) => setForm((f) => ({ ...f, passingScore: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Excellence Score */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Excellence Score (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.excellenceScore}
                onChange={(e) => setForm((f) => ({ ...f, excellenceScore: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Auto-graded toggle */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.isAutoGraded}
                onClick={() => setForm((f) => ({ ...f, isAutoGraded: !f.isAutoGraded }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  form.isAutoGraded ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.isAutoGraded ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-graded (multiple choice / objective questions)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting ? "Creating..." : "Create Test"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(DEFAULT_FORM);
                setFormError(null);
              }}
              className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Promotion test list */}
      {tests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No promotion tests have been added for this level yet.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Click &ldquo;Add Promotion Test&rdquo; above to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {test.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[test.subject] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {test.subject.charAt(0) + test.subject.slice(1).toLowerCase()}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        test.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {test.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {test.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-gray-400">
                    {test.attemptCount} attempt{test.attemptCount !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Scores row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {test.totalMarks}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Marks</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {test.passingScore}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pass Score</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                    {test.excellenceScore}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Excellence</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 text-center">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {test.timeLimit}m
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Time Limit</div>
                </div>
              </div>

              {/* Auto-grade indicator */}
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    test.isAutoGraded
                      ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {test.isAutoGraded ? "Auto-graded" : "Manual grading required"}
                </span>
                <span className="text-xs text-gray-400">
                  Created {new Date(test.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentsTab({ placements }: { placements: Placement[] }) {
  const subjectGroups = SUBJECTS.filter((s) => placements.some((p) => p.subject === s));
  const [filterSubject, setFilterSubject] = useState<string>("ALL");

  const filtered =
    filterSubject === "ALL"
      ? placements
      : placements.filter((p) => p.subject === filterSubject);

  return (
    <div className="space-y-5">
      {/* Filter by subject */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterSubject("ALL")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterSubject === "ALL"
              ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          All ({placements.length})
        </button>
        {subjectGroups.map((subject) => {
          const count = placements.filter((p) => p.subject === subject).length;
          return (
            <button
              key={subject}
              onClick={() => setFilterSubject(subject)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterSubject === subject
                  ? SUBJECT_BUTTON_ACTIVE[subject]
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {SUBJECT_SHORT[subject]}:{count}
            </button>
          );
        })}
      </div>

      {/* Student table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {placements.length === 0
              ? "No students are currently placed at this level."
              : "No students match the selected subject filter."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Lessons Done
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ready to Promote
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    View
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((placement) => (
                  <tr
                    key={placement.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    {/* Student */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {placement.student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {placement.student.name}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">
                            {placement.student.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          SUBJECT_COLORS[placement.subject] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {SUBJECT_SHORT[placement.subject] ?? placement.subject}
                      </span>
                    </td>

                    {/* Lessons completed */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min((placement.lessonsCompleted / 25) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                          {placement.lessonsCompleted}/25
                        </span>
                      </div>
                    </td>

                    {/* Ready for promotion */}
                    <td className="px-5 py-3.5 text-center">
                      {placement.readyForPromotion ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                          Ready
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(placement.status)}`}
                      >
                        {placement.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* View link */}
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/tutor/students/${placement.student.id}/assessment`}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Assessment
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

type Tab = "lessons" | "promotionTests" | "students";

export function AssessmentLevelDetailClient({ level }: { level: LevelData }) {
  const [activeTab, setActiveTab] = useState<Tab>("lessons");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "lessons", label: "Lessons", count: level.totalLessons },
    { key: "promotionTests", label: "Promotion Tests", count: level.totalPromotionTests },
    { key: "students", label: "Students", count: level.totalPlacements },
  ];

  return (
    <div className="space-y-6">
      {/* Level info card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Level {level.displayLabel}
              </h1>
              {level.australianYear && (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {level.australianYear}
                </span>
              )}
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  level.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {level.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Age {level.ageYear}.{String(level.ageMonth).padStart(2, "0")}
              {level.description && (
                <>
                  {" "}
                  &mdash; {level.description}
                </>
              )}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {level.totalLessons}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {level.totalPromotionTests}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Promo Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {level.totalPlacements}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Placements</div>
            </div>
          </div>
        </div>

        {/* Per-subject lesson coverage summary */}
        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Lesson coverage by subject
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {SUBJECTS.map((subject) => {
              const count = level.lessonsBySubject[subject]?.length ?? 0;
              const pct = Math.min((count / 25) * 100, 100);
              return (
                <div key={subject} className="text-center">
                  <div
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 ${SUBJECT_COLORS[subject] ?? ""}`}
                  >
                    {SUBJECT_SHORT[subject]}: {count}/25
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        count >= 25 ? "bg-green-500" : count >= 15 ? "bg-blue-500" : count >= 5 ? "bg-yellow-400" : "bg-red-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1" aria-label="Level detail tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  activeTab === tab.key
                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "lessons" && (
          <LessonsTab lessonsBySubject={level.lessonsBySubject} />
        )}
        {activeTab === "promotionTests" && (
          <PromotionTestsTab levelId={level.id} promotionTests={level.promotionTests} />
        )}
        {activeTab === "students" && (
          <StudentsTab placements={level.placements} />
        )}
      </div>
    </div>
  );
}
