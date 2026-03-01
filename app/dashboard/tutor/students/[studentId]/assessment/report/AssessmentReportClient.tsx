"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AcademicProfile {
  chronologicalAge: number | null;
  readingAge: number | null;
  numeracyAge: number | null;
}

interface LessonCompletion {
  status: string;
  lesson: {
    lessonNumber: number;
    title: string;
    difficultyScore: number;
  };
}

interface HistoryEntry {
  changeType: string;
  reason: string | null;
  testScore: number | null;
  createdAt: string;
  fromAge: { displayLabel: string } | null;
  toAge: { displayLabel: string };
  changedBy: { name: string | null; role: string };
}

interface PromotionAttempt {
  outcome: string;
  percentageScore: number | null;
  startedAt: string;
  promotionTest: {
    title: string;
    totalMarks: number;
    passingScore: number;
  } | null;
  promotedToAge: { displayLabel: string } | null;
}

interface Placement {
  id: string;
  subject: string;
  lessonsCompleted: number;
  status: string;
  readyForPromotion: boolean;
  placedAt: string;
  placementMethod: string;
  placementNotes: string | null;
  currentAge: { displayLabel: string; australianYear: string | null };
  initialAge: { displayLabel: string } | null;
  placedBy: { name: string | null; role: string };
  lessonCompletions: LessonCompletion[];
  historyLog: HistoryEntry[];
  promotionAttempts: PromotionAttempt[];
}

interface Props {
  student: {
    id: string;
    name: string;
    email: string;
    academicProfile: AcademicProfile | null;
    center: { name: string };
  };
  placements: Placement[];
  reportGeneratedBy: { name: string | null; role: string };
  reportDate: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LESSON_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-200 dark:bg-gray-600",
  IN_PROGRESS: "bg-blue-400",
  SUBMITTED: "bg-yellow-400",
  MARKED: "bg-emerald-400",
  NEEDS_REVISION: "bg-purple-400",
};

const LESSON_STATUS_PRINT_COLORS: Record<string, string> = {
  NOT_STARTED: "#e5e7eb",
  IN_PROGRESS: "#60a5fa",
  SUBMITTED: "#facc15",
  MARKED: "#34d399",
  NEEDS_REVISION: "#a78bfa",
};

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  ACTIVE: { label: "Active", classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  PROMOTION_PENDING: { label: "Promotion Pending", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  PROMOTED: { label: "Promoted", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  PAUSED: { label: "Paused", classes: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  COMPLETED: { label: "Completed", classes: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
};

const OUTCOME_CLASSES: Record<string, string> = {
  PROMOTED: "text-emerald-700 dark:text-emerald-400 font-semibold",
  LEVEL_SKIPPED: "text-purple-700 dark:text-purple-400 font-semibold",
  FAILED: "text-red-700 dark:text-red-400 font-semibold",
  BORDERLINE: "text-yellow-700 dark:text-yellow-400 font-semibold",
  PENDING: "text-gray-500 dark:text-gray-400",
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  INITIAL_PLACEMENT: "Initial placement",
  PROMOTED: "Promoted",
  LEVEL_SKIPPED: "Level skipped",
  REGRESSED: "Regressed",
  MANUAL_OVERRIDE: "Manual override",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSubject(subject: string): string {
  return subject.charAt(0) + subject.slice(1).toLowerCase();
}

function formatRole(role: string): string {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** 5×5 mini lesson grid (25 cells) */
function LessonGrid({ lessonCompletions }: { lessonCompletions: LessonCompletion[] }) {
  const cells = Array.from({ length: 25 }, (_, i) => {
    const lc = lessonCompletions.find((l) => l.lesson.lessonNumber === i + 1);
    const status = lc ? lc.status : "NOT_STARTED";
    return { lessonNumber: i + 1, status, title: lc?.lesson.title ?? `Lesson ${i + 1}` };
  });

  return (
    <div className="grid grid-cols-5 gap-1">
      {cells.map((cell) => (
        <div
          key={cell.lessonNumber}
          title={`#${cell.lessonNumber} ${cell.title} — ${cell.status.replace(/_/g, " ")}`}
          className={`
            w-full aspect-square rounded-sm flex items-center justify-center
            text-[9px] font-bold text-white
            ${LESSON_STATUS_COLORS[cell.status] ?? "bg-gray-200 dark:bg-gray-600"}
          `}
          style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } as React.CSSProperties}
        >
          {cell.lessonNumber}
        </div>
      ))}
    </div>
  );
}

/** Legend for lesson grid */
function LessonLegend() {
  const items = [
    { status: "NOT_STARTED", label: "Not started" },
    { status: "IN_PROGRESS", label: "In progress" },
    { status: "SUBMITTED", label: "Submitted" },
    { status: "MARKED", label: "Marked" },
    { status: "NEEDS_REVISION", label: "Needs revision" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
      {items.map(({ status, label }) => (
        <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span
            className={`w-3 h-3 rounded-sm inline-block ${LESSON_STATUS_COLORS[status]}`}
            style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } as React.CSSProperties}
          />
          {label}
        </div>
      ))}
    </div>
  );
}

/** Summary card per subject (used in the grid overview) */
function SummaryCard({ placement }: { placement: Placement }) {
  const progressPct = Math.min((placement.lessonsCompleted / 25) * 100, 100);
  const badge = STATUS_BADGE[placement.status] ?? STATUS_BADGE.ACTIVE;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm print:shadow-none print:border-gray-300 print:rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
            {formatSubject(placement.subject)}
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
            {placement.currentAge.displayLabel}
          </p>
          {placement.currentAge.australianYear && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {placement.currentAge.australianYear}
            </p>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Lessons completed</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {placement.lessonsCompleted} / 25
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-2 bg-blue-500 rounded-full"
            style={{
              width: `${progressPct}%`,
              printColorAdjust: "exact",
              WebkitPrintColorAdjust: "exact",
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Promotion readiness */}
      {placement.readyForPromotion && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Ready for promotion
        </div>
      )}
    </div>
  );
}

/** Detailed section per subject */
function PlacementDetail({ placement }: { placement: Placement }) {
  const markedCount = placement.lessonCompletions.filter((lc) =>
    ["MARKED", "COMPLETED"].includes(lc.status)
  ).length;

  return (
    <div className="print:break-inside-avoid">
      {/* Subject heading */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
          {formatSubject(placement.subject)}
        </h3>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left: Level info + lesson grid */}
        <div>
          <div className="flex items-baseline gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current level</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {placement.currentAge.displayLabel}
              </p>
              {placement.currentAge.australianYear && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{placement.currentAge.australianYear}</p>
              )}
            </div>
            {placement.initialAge &&
              placement.initialAge.displayLabel !== placement.currentAge.displayLabel && (
                <div className="ml-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Started at</p>
                  <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                    {placement.initialAge.displayLabel}
                  </p>
                </div>
              )}
          </div>

          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span>
              <span className="font-semibold text-gray-900 dark:text-white">{placement.lessonsCompleted}</span>
              {" "}of 25 completed
            </span>
            <span>
              <span className="font-semibold text-gray-900 dark:text-white">{markedCount}</span>
              {" "}graded
            </span>
          </div>

          {/* Mini lesson grid */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Lesson progress (1–25)
            </p>
            <LessonGrid lessonCompletions={placement.lessonCompletions} />
            <LessonLegend />
          </div>
        </div>

        {/* Right: Promotion history + placement notes */}
        <div className="space-y-4">
          {/* Placement meta */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-300">Placed: </span>
              {formatDate(placement.placedAt)} by {placement.placedBy.name ?? "—"}{" "}
              <span className="text-gray-400">({formatRole(placement.placedBy.role)})</span>
            </p>
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-300">Method: </span>
              {placement.placementMethod.replace(/_/g, " ")}
            </p>
            {placement.placementNotes && (
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">Notes: </span>
                {placement.placementNotes}
              </p>
            )}
          </div>

          {/* Promotion attempts */}
          {placement.promotionAttempts.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Promotion attempts
              </p>
              <div className="space-y-2">
                {placement.promotionAttempts.map((attempt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={OUTCOME_CLASSES[attempt.outcome] ?? "text-gray-500"}>
                        {attempt.outcome.replace(/_/g, " ")}
                      </span>
                      {attempt.promotedToAge && (
                        <span className="text-gray-400 text-xs">
                          → {attempt.promotedToAge.displayLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      {attempt.percentageScore !== null && (
                        <span className="font-medium mr-2">{attempt.percentageScore}%</span>
                      )}
                      {attempt.promotionTest && (
                        <span className="text-gray-400">
                          (pass: {attempt.promotionTest.passingScore}%)
                        </span>
                      )}
                      <span className="ml-2">{formatDate(attempt.startedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level change history */}
          {placement.historyLog.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Level history
              </p>
              <div className="space-y-1.5">
                {placement.historyLog.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {CHANGE_TYPE_LABELS[entry.changeType] ?? entry.changeType}
                      </span>
                      {entry.fromAge ? (
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          {entry.fromAge.displayLabel} → {entry.toAge.displayLabel}
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          at {entry.toAge.displayLabel}
                        </span>
                      )}
                      {entry.testScore !== null && (
                        <span className="text-gray-400 ml-1">({entry.testScore}%)</span>
                      )}
                      {entry.reason && (
                        <p className="text-gray-400 mt-0.5 italic">{entry.reason}</p>
                      )}
                    </div>
                    <div className="text-gray-400 shrink-0">
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Client Component
// ---------------------------------------------------------------------------

export function AssessmentReportClient({
  student,
  placements,
  reportGeneratedBy,
  reportDate,
}: Props) {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId ?? student.id;

  const totalCompleted = placements.reduce((sum, p) => sum + p.lessonsCompleted, 0);
  const readyCount = placements.filter((p) => p.readyForPromotion).length;

  return (
    <>
      {/*
        Print styles injected as a <style> tag so we don't rely solely on
        Tailwind's `print:` variant (which requires JIT class detection).
      */}
      <style>{`
        @media print {
          /* Hide browser chrome artifacts */
          @page {
            margin: 18mm 14mm;
          }

          /* Hide interactive elements */
          .no-print { display: none !important; }

          /* Make report container full-width */
          .report-container {
            max-width: 100% !important;
            padding: 0 !important;
          }

          /* Force white background, dark text */
          body, .print-white {
            background: #ffffff !important;
            color: #111827 !important;
          }

          /* Ensure colored cells render */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Page breaks */
          .page-break-before { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }

          /* Expand all detail sections (they're always visible in the DOM,
             just ensure no hiding) */
          .detail-section { display: block !important; }

          /* Show print-only elements */
          .print-only { display: block !important; }

          /* Reset dark mode colours for print */
          .dark .dark\\:bg-gray-800,
          .dark .dark\\:bg-gray-700\\/50 {
            background: #f9fafb !important;
          }
          .dark .dark\\:text-white,
          .dark .dark\\:text-gray-100 {
            color: #111827 !important;
          }
          .dark .dark\\:text-gray-300,
          .dark .dark\\:text-gray-400 {
            color: #374151 !important;
          }
          .dark .dark\\:border-gray-700 {
            border-color: #d1d5db !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print-white">
        {/* ----------------------------------------------------------------
            Screen-only top bar: back link + print button
        ---------------------------------------------------------------- */}
        <div className="no-print sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link
              href={`/dashboard/tutor/students/${studentId}/assessment`}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Student Assessment
            </Link>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print Report
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------
            Report body
        ---------------------------------------------------------------- */}
        <div className="report-container max-w-5xl mx-auto px-4 py-8 print:py-0 print:px-0">
          {/* ---- Report header ---- */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm print:shadow-none print:rounded-none print:border-0 mb-6 avoid-break">
            {/* Branded top stripe */}
            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl print:rounded-none" />

            <div className="px-8 py-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    Assessment Progress Report
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Parent–Teacher Meeting — Confidential
                  </p>
                </div>
                {/* Report metadata (top right) */}
                <div className="text-right text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Generated: </span>
                    {reportDate}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Prepared by: </span>
                    {reportGeneratedBy.name ?? "—"}{" "}
                    <span className="text-gray-400">({formatRole(reportGeneratedBy.role)})</span>
                  </p>
                </div>
              </div>

              {/* Student header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                {/* Left: student identity */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                    Student
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {student.center.name}
                  </p>
                </div>

                {/* Right: academic profile snapshot */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Chron. Age
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {student.academicProfile?.chronologicalAge != null
                        ? `${student.academicProfile.chronologicalAge}y`
                        : "—"}
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reading Age
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {student.academicProfile?.readingAge != null
                        ? `${student.academicProfile.readingAge}y`
                        : "—"}
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Numeracy Age
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {student.academicProfile?.numeracyAge != null
                        ? `${student.academicProfile.numeracyAge}y`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Assessment summary grid ---- */}
          <section className="mb-8 avoid-break">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assessment Summary</h2>
              <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  <span className="font-semibold text-gray-900 dark:text-white">{placements.length}</span>{" "}
                  active subjects
                </span>
                <span>·</span>
                <span>
                  <span className="font-semibold text-gray-900 dark:text-white">{totalCompleted}</span>{" "}
                  total lessons completed
                </span>
                {readyCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="font-semibold text-purple-700 dark:text-purple-300">
                      {readyCount} ready for promotion
                    </span>
                  </>
                )}
              </div>
            </div>

            {placements.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No active subject placements recorded for this student.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {placements.map((placement) => (
                  <SummaryCard key={placement.id} placement={placement} />
                ))}
              </div>
            )}
          </section>

          {/* ---- Detailed progress per subject ---- */}
          {placements.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 print:mb-4">
                Detailed Subject Progress
              </h2>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm print:shadow-none print:border-0 print:rounded-none divide-y divide-gray-100 dark:divide-gray-700">
                {placements.map((placement, idx) => (
                  <div
                    key={placement.id}
                    className={`px-8 py-8 print:px-0 print:py-6 detail-section avoid-break ${
                      idx > 0 ? "print:page-break-before" : ""
                    }`}
                  >
                    <PlacementDetail placement={placement} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---- Print-only summary notes section ---- */}
          <section
            className="print-only hidden print:block avoid-break"
            style={{ pageBreakBefore: "always" }}
          >
            <div className="border border-gray-300 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Meeting Notes &amp; Action Items
              </h2>
              <p className="text-xs text-gray-500 mb-6 italic">
                For tutor use during parent–teacher meeting. These notes are not stored digitally.
              </p>

              {/* Blank ruled lines for handwriting */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="border-b border-gray-300 mb-5"
                  style={{ height: "24px" }}
                />
              ))}

              {/* Action items */}
              <h3 className="text-base font-semibold text-gray-900 mt-8 mb-4">
                Goals &amp; Next Steps
              </h3>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2 mb-4">
                  <div className="w-4 h-4 border border-gray-400 rounded-sm mt-1 shrink-0" />
                  <div className="flex-1 border-b border-gray-300" style={{ height: "24px" }} />
                </div>
              ))}

              {/* Signature block */}
              <div className="grid grid-cols-2 gap-10 mt-10">
                <div>
                  <div className="border-b border-gray-400 mb-1" style={{ height: "32px" }} />
                  <p className="text-xs text-gray-500">Tutor signature &amp; date</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 mb-1" style={{ height: "32px" }} />
                  <p className="text-xs text-gray-500">Parent / guardian signature &amp; date</p>
                </div>
              </div>
            </div>
          </section>

          {/* ---- Screen-only footer ---- */}
          <div className="no-print mt-8 text-center text-xs text-gray-400 dark:text-gray-600 pb-8">
            <p>
              This report was generated on {reportDate} by {reportGeneratedBy.name ?? "a staff member"}.
              Use the Print button above to produce a paper copy for parent–teacher meetings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
