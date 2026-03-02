"use client";

import { useState } from "react";
import { StudentAssessmentClient } from "@/app/dashboard/tutor/students/[studentId]/assessment/StudentAssessmentClient";
import { ChevronDown, ChevronUp, User, TrendingUp, BookOpen, Award } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LessonCompletion = {
  id: string;
  status: string;
  score: number | null;
  percentageScore: number | null;
  completedAt: string | null;
  feedback: string | null;
  lesson: {
    id: string;
    lessonNumber: number;
    title: string;
    difficultyScore: number;
    estimatedMinutes: number | null;
  };
};

type HistoryEntry = {
  id: string;
  changeType: string;
  reason: string | null;
  testScore: number | null;
  createdAt: string;
  fromAge: { displayLabel: string } | null;
  toAge: { displayLabel: string };
  changedBy: { name: string | null; role: string };
};

type Placement = {
  id: string;
  subject: string;
  currentLessonNumber: number;
  lessonsCompleted: number;
  status: string;
  readyForPromotion: boolean;
  placedAt: string;
  currentAge: {
    id: string;
    ageYear: number;
    ageMonth: number;
    displayLabel: string;
    australianYear: string | null;
  };
  initialAge: {
    id: string;
    ageYear: number;
    ageMonth: number;
    displayLabel: string;
  } | null;
  lessonCompletions: LessonCompletion[];
  historyLog: HistoryEntry[];
  promotionAttempts: any[];
  placedBy: { name: string | null; role: string };
  placementMethod: string;
  placementNotes: string | null;
};

type ChildData = {
  id: string;
  name: string;
  chronoAge: number | null;
  placements: Placement[];
};

interface Props {
  childrenData: ChildData[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHANGE_TYPE_COLORS: Record<string, string> = {
  INITIAL_PLACEMENT:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PROMOTED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  LEVEL_SKIPPED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  REGRESSED:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  MANUAL_OVERRIDE:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  INITIAL_PLACEMENT: "Placed",
  PROMOTED: "Promoted",
  LEVEL_SKIPPED: "Level Skipped",
  REGRESSED: "Regressed",
  MANUAL_OVERRIDE: "Manual Override",
};

const LESSON_STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  NOT_STARTED: {
    color: "text-gray-500 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-700",
    label: "Not Started",
  },
  IN_PROGRESS: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    label: "In Progress",
  },
  SUBMITTED: {
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    label: "Submitted",
  },
  MARKED: {
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    label: "Marked",
  },
  NEEDS_REVISION: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/40",
    label: "Needs Revision",
  },
};

const SUBJECT_COLORS: Record<string, string> = {
  ENGLISH: "bg-blue-500",
  MATHEMATICS: "bg-purple-500",
  SCIENCE: "bg-green-500",
  STEM: "bg-cyan-500",
  READING: "bg-orange-500",
  WRITING: "bg-rose-500",
};

const CHILD_GRADIENT_COLORS = [
  "from-blue-400 to-purple-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-rose-500",
  "from-yellow-400 to-amber-500",
];

// ---------------------------------------------------------------------------
// LessonStatusChip with tooltip
// ---------------------------------------------------------------------------

function LessonStatusChip({ lc }: { lc: LessonCompletion }) {
  const [visible, setVisible] = useState(false);
  const styles = LESSON_STATUS_STYLES[lc.status] ?? LESSON_STATUS_STYLES.NOT_STARTED;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-default select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${styles.bg} ${styles.color}`}
        aria-label={`Lesson ${lc.lesson.lessonNumber}: ${lc.lesson.title} — ${styles.label}${lc.percentageScore !== null ? `, score: ${lc.percentageScore}%` : ""}`}
      >
        <span className="tabular-nums font-bold">#{lc.lesson.lessonNumber}</span>
        <span className="hidden sm:inline">{styles.label}</span>
      </button>

      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-left pointer-events-none"
        >
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-gray-800" />

          <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight mb-1">
            Lesson {lc.lesson.lessonNumber}: {lc.lesson.title}
          </p>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${styles.bg} ${styles.color}`}
            >
              {styles.label}
            </span>
          </div>
          {lc.percentageScore !== null && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>Score:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {lc.percentageScore}%
              </span>
            </div>
          )}
          {lc.completedAt && (
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Completed{" "}
              {new Date(lc.completedAt).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          )}
          {lc.feedback && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic line-clamp-2">
              &ldquo;{lc.feedback}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PromotionHistoryTimeline — shows last 3 history entries per placement
// ---------------------------------------------------------------------------

function PromotionHistoryTimeline({ historyLog }: { historyLog: HistoryEntry[] }) {
  const entries = historyLog.slice(0, 3);
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        Recent History
      </p>
      <ol className="relative pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-3">
        {entries.map((entry, idx) => {
          const chipColor =
            CHANGE_TYPE_COLORS[entry.changeType] ??
            "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
          const label =
            CHANGE_TYPE_LABELS[entry.changeType] ?? entry.changeType.replace(/_/g, " ");
          const isFirst = idx === 0;

          return (
            <li key={entry.id} className="relative">
              {/* Timeline dot */}
              <span
                className={`absolute -left-[1.2rem] top-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                  isFirst ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${chipColor}`}>
                  {label}
                </span>
                {entry.fromAge ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.fromAge.displayLabel} &rarr; {entry.toAge.displayLabel}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    at {entry.toAge.displayLabel}
                  </span>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  {new Date(entry.createdAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {entry.reason && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                  {entry.reason}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EnhancedPlacementCard — shows lesson chips with tooltips + history timeline
// ---------------------------------------------------------------------------

function EnhancedPlacementCard({ placement }: { placement: Placement }) {
  const [showLessons, setShowLessons] = useState(false);
  const progressPct = Math.min((placement.lessonsCompleted / 25) * 100, 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {placement.subject.charAt(0) + placement.subject.slice(1).toLowerCase()}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {placement.currentAge.displayLabel}
            </span>
            {placement.currentAge.australianYear && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {placement.currentAge.australianYear}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          {placement.readyForPromotion ? (
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              <Award className="w-3 h-3" />
              Ready
            </span>
          ) : (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                placement.status === "ACTIVE"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              {placement.status.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Lesson {placement.currentLessonNumber} of 25</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {placement.lessonsCompleted}/25 done
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Lesson chips with tooltips */}
      {placement.lessonCompletions.length > 0 && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowLessons((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {placement.lessonCompletions.length} lesson
            {placement.lessonCompletions.length !== 1 ? "s" : ""} tracked
            {showLessons ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showLessons && (
            <div className="flex flex-wrap gap-1.5">
              {placement.lessonCompletions.map((lc) => (
                <LessonStatusChip key={lc.id} lc={lc} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Promotion History Timeline */}
      {placement.historyLog.length > 0 && (
        <div className="px-4 pb-4">
          <PromotionHistoryTimeline historyLog={placement.historyLog} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChildrenComparisonCard — summary card at the top
// ---------------------------------------------------------------------------

function ChildrenComparisonCard({ items }: { items: ChildData[] }) {
  const children = items;
  if (children.length < 2) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Children Comparison</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
          Across {children.length} children
        </span>
      </div>

      {/* Columns grid */}
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: `repeat(${children.length}, minmax(0, 1fr))` }}
      >
        {children.map((child, idx) => {
          const placements = child.placements as Placement[];
          const numPlacements = placements.length;

          // Avg lesson completion %
          const avgCompletion =
            numPlacements > 0
              ? Math.round(
                  (placements.reduce(
                    (acc, p) => acc + Math.min((p.lessonsCompleted / 25) * 100, 100),
                    0
                  ) /
                    numPlacements) *
                    10
                ) / 10
              : 0;

          // Subjects ready for promotion
          const readyCount = placements.filter((p) => p.readyForPromotion).length;

          // Avg level progress: average (ageYear + ageMonth/12) across placements
          const avgLevel =
            numPlacements > 0
              ? placements.reduce(
                  (acc, p) =>
                    acc + (p.currentAge.ageYear + p.currentAge.ageMonth / 12),
                  0
                ) / numPlacements
              : 0;

          // Normalise bar: 4.0–18.0 range → 0–100%
          const barPct = Math.max(0, Math.min(((avgLevel - 4) / 14) * 100, 100));

          const gradient = CHILD_GRADIENT_COLORS[idx % CHILD_GRADIENT_COLORS.length];

          return (
            <div key={child.id} className="flex flex-col gap-3">
              {/* Child avatar + name */}
              <div className="flex flex-col items-center text-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm`}
                >
                  {(child.name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {child.name}
                  </p>
                  {child.chronoAge !== null && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Age {child.chronoAge}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                {/* Placements */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Subjects</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {numPlacements}
                  </p>
                </div>

                {/* Avg lesson completion */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg completion</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {avgCompletion}%
                  </p>
                </div>

                {/* Ready for promotion */}
                <div
                  className={`rounded-lg px-3 py-2 ${
                    readyCount > 0
                      ? "bg-purple-50 dark:bg-purple-900/20"
                      : "bg-gray-50 dark:bg-gray-700/50"
                  }`}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ready to promote</p>
                  <p
                    className={`text-xl font-bold ${
                      readyCount > 0
                        ? "text-purple-700 dark:text-purple-300"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {readyCount}
                  </p>
                </div>
              </div>

              {/* Mini bar chart — avg level progress */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Avg level</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {numPlacements > 0 ? avgLevel.toFixed(1) : "—"}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-300 dark:text-gray-600 mt-0.5">
                  <span>4.0</span>
                  <span>18.0</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChildSection — full expanded section per child (uses enhanced placement view)
// ---------------------------------------------------------------------------

function ChildSection({ child, childIndex }: { child: ChildData; childIndex: number }) {
  const [expanded, setExpanded] = useState(true);

  const subjectCount = child.placements.length;
  const readyCount = (child.placements as Placement[]).filter(
    (p) => p.readyForPromotion
  ).length;
  const totalLessons = (child.placements as Placement[]).reduce(
    (acc, p) => acc + p.lessonsCompleted,
    0
  );

  const gradient = CHILD_GRADIENT_COLORS[childIndex % CHILD_GRADIENT_COLORS.length];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Child header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shrink-0`}
          >
            {(child.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{child.name}</h2>
            <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              {child.chronoAge !== null && <span>Age {child.chronoAge}</span>}
              <span>
                {subjectCount} subject{subjectCount !== 1 ? "s" : ""}
              </span>
              <span>{totalLessons} lessons completed</span>
              {readyCount > 0 && (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  &#9733; {readyCount} ready to promote
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-gray-400 shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-6 space-y-4">
          {/* Enhanced placement cards with lesson tooltips and history */}
          {(child.placements as Placement[]).length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
              No assessment placements yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(child.placements as Placement[]).map((placement) => (
                <EnhancedPlacementCard key={placement.id} placement={placement} />
              ))}
            </div>
          )}

          {/* Full StudentAssessmentClient below for complete view */}
          <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">
              Full Assessment Detail
            </p>
            <StudentAssessmentClient
              student={{ id: child.id, name: child.name, chronoAge: child.chronoAge }}
              placements={child.placements as any}
              assessmentAges={[]}
              canEdit={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ParentAssessmentClient({ childrenData }: Props) {
  const children = childrenData;

  if (children.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No children found on your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Children Comparison summary card — only shown when 2+ children */}
      <ChildrenComparisonCard items={children} />

      {/* Per-child sections */}
      {children.map((child, idx) => (
        <ChildSection key={child.id} child={child} childIndex={idx} />
      ))}
    </div>
  );
}
