"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface StudentRef {
  id: string;
  name: string | null;
  email: string | null;
  dateOfBirth?: Date | null;
}

interface AgeRef {
  displayLabel: string;
  australianYear: string | null;
  ageYear?: number;
}

interface NoProgressPlacement {
  id: string;
  subject: string;
  placedAt: string;
  lessonsCompleted: number;
  status: string;
  student: StudentRef;
  currentAge: AgeRef;
  placedBy: { name: string | null } | null;
}

interface NeedsRevisionCompletion {
  id: string;
  status: string;
  gradedAt: string | null;
  completedAt: string | null;
  student: StudentRef;
  lesson: {
    lessonNumber: number;
    title: string;
    subject: string;
  };
  placement: {
    id: string;
    subject: string;
    currentAge: { displayLabel: string; australianYear: string | null };
  } | null;
}

interface PromotionOverduePlacement {
  id: string;
  subject: string;
  updatedAt: string;
  status: string;
  student: StudentRef;
  currentAge: AgeRef;
  placedBy: { name: string | null } | null;
}

interface AssessmentRiskClientProps {
  noProgressPlacements: NoProgressPlacement[];
  needsRevisionPlacements: NeedsRevisionCompletion[];
  promotionOverdue: PromotionOverduePlacement[];
}

type FilterTab = "all" | "no-progress" | "needs-revision" | "promotion-overdue";

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function subjectBadgeClass(subject: string): string {
  const map: Record<string, string> = {
    ENGLISH: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    MATHEMATICS: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    SCIENCE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    READING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    WRITING: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    STEM: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  };
  return map[subject] ?? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
}

// ── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }

  return { toastMessage, showToast };
}

// ── Collapsible Section ───────────────────────────────────────────────────────

interface CollapsibleSectionProps {
  title: string;
  count: number;
  colorScheme: "orange" | "red" | "purple";
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  count,
  colorScheme,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const headerColors = {
    orange:
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100",
  };

  const badgeColors = {
    orange: "bg-orange-500 text-white",
    red: "bg-red-500 text-white",
    purple: "bg-purple-500 text-white",
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-6 py-4 border-b ${headerColors[colorScheme]} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${badgeColors[colorScheme]}`}
          >
            {count}
          </span>
        </div>
        <span className="text-xl select-none">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="bg-white dark:bg-gray-800 p-6">
          {count === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-6">
              No students in this category. All clear!
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AssessmentRiskClient({
  noProgressPlacements,
  needsRevisionPlacements,
  promotionOverdue,
}: AssessmentRiskClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const { toastMessage, showToast } = useToast();

  const totalAtRisk =
    noProgressPlacements.length + needsRevisionPlacements.length + promotionOverdue.length;

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalAtRisk },
    { key: "no-progress", label: "No Progress", count: noProgressPlacements.length },
    { key: "needs-revision", label: "Needs Revision", count: needsRevisionPlacements.length },
    {
      key: "promotion-overdue",
      label: "Promotion Overdue",
      count: promotionOverdue.length,
    },
  ];

  const showNoProgress = activeFilter === "all" || activeFilter === "no-progress";
  const showNeedsRevision = activeFilter === "all" || activeFilter === "needs-revision";
  const showPromotionOverdue = activeFilter === "all" || activeFilter === "promotion-overdue";

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Assessment Risk Monitor
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Students requiring attention based on placement activity and lesson progress.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {totalAtRisk}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total At-Risk Students</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800 p-5">
          <div className="text-3xl font-bold text-orange-700 dark:text-orange-300 mb-1">
            {noProgressPlacements.length}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">No Progress (14+ days)</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-5">
          <div className="text-3xl font-bold text-red-700 dark:text-red-300 mb-1">
            {needsRevisionPlacements.length}
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">Needs Revision</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800 p-5">
          <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 mb-1">
            {promotionOverdue.length}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">Promotion Overdue (7+ days)</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === tab.key
                ? "bg-blue-600 text-white shadow"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                  activeFilter === tab.key
                    ? "bg-white text-blue-600"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state (all filters) */}
      {totalAtRisk === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-16 text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No at-risk students found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            All students are progressing well. Check back later for updates.
          </p>
        </div>
      )}

      {/* ── Section 1: No Progress ─────────────────────────────────────────── */}
      {showNoProgress && (
        <CollapsibleSection
          title="No Progress — Placed 14+ Days Ago"
          count={noProgressPlacements.length}
          colorScheme="orange"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {noProgressPlacements.map((p) => {
              const days = daysSince(p.placedAt);
              return (
                <div
                  key={p.id}
                  className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50/50 dark:bg-orange-900/10 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {p.student.name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {p.student.email}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${subjectBadgeClass(
                        p.subject
                      )}`}
                    >
                      {p.subject}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Level: </span>
                      {p.currentAge.displayLabel}
                      {p.currentAge.australianYear && (
                        <span className="ml-1 text-gray-400">
                          (Yr {p.currentAge.australianYear})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Placed: </span>
                      {formatDate(p.placedAt)}
                    </div>
                    <div>
                      <span className="font-medium text-orange-700 dark:text-orange-400">
                        {days} days since placement
                      </span>
                    </div>
                    {p.placedBy && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Tutor: </span>
                        {p.placedBy.name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/dashboard/tutor/students/${p.student.id}/assessment`}
                      className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                    >
                      View Assessment
                    </Link>
                    <button
                      type="button"
                      onClick={() => showToast(`Reminder sent to ${p.student.name}`)}
                      className="flex-1 text-center text-xs font-medium px-3 py-2 rounded-md border border-orange-400 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    >
                      Send Reminder
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Section 2: Needs Revision ──────────────────────────────────────── */}
      {showNeedsRevision && (
        <CollapsibleSection
          title="Needs Revision — Awaiting Resubmission"
          count={needsRevisionPlacements.length}
          colorScheme="red"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {needsRevisionPlacements.map((c) => {
              const refDate = c.gradedAt ?? c.completedAt;
              const days = refDate ? daysSince(refDate) : null;
              const subject =
                c.placement?.subject ?? c.lesson.subject;

              return (
                <div
                  key={c.id}
                  className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50/50 dark:bg-red-900/10 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {c.student.name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {c.student.email}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${subjectBadgeClass(
                        subject
                      )}`}
                    >
                      {subject}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Lesson: </span>
                      #{c.lesson.lessonNumber} — {c.lesson.title}
                    </div>
                    {c.placement?.currentAge && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Level: </span>
                        {c.placement.currentAge.displayLabel}
                        {c.placement.currentAge.australianYear && (
                          <span className="ml-1 text-gray-400">
                            (Yr {c.placement.currentAge.australianYear})
                          </span>
                        )}
                      </div>
                    )}
                    {days !== null && (
                      <div>
                        <span className="font-medium text-red-700 dark:text-red-400">
                          {days} day{days !== 1 ? "s" : ""} since revision requested
                        </span>
                      </div>
                    )}
                    {refDate && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Graded: </span>
                        {formatDate(refDate)}
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/dashboard/tutor/students/${c.student.id}/assessment`}
                      className="block text-center text-xs font-medium px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      View Assessment
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Section 3: Promotion Overdue ───────────────────────────────────── */}
      {showPromotionOverdue && (
        <CollapsibleSection
          title="Promotion Overdue — Ready 7+ Days"
          count={promotionOverdue.length}
          colorScheme="purple"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {promotionOverdue.map((p) => {
              const days = daysSince(p.updatedAt);
              return (
                <div
                  key={p.id}
                  className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50/50 dark:bg-purple-900/10 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {p.student.name ?? "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {p.student.email}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${subjectBadgeClass(
                        p.subject
                      )}`}
                    >
                      {p.subject}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Level: </span>
                      {p.currentAge.displayLabel}
                      {p.currentAge.australianYear && (
                        <span className="ml-1 text-gray-400">
                          (Yr {p.currentAge.australianYear})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Ready since: </span>
                      {formatDate(p.updatedAt)}
                    </div>
                    <div>
                      <span className="font-medium text-purple-700 dark:text-purple-400">
                        {days} day{days !== 1 ? "s" : ""} since ready for promotion
                      </span>
                    </div>
                    {p.placedBy && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Tutor: </span>
                        {p.placedBy.name}
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/dashboard/tutor/students/${p.student.id}/promote?subject=${encodeURIComponent(p.subject)}`}
                      className="block text-center text-xs font-medium px-3 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      Promote Student
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
