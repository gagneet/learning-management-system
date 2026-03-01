"use client";

import { useState } from "react";
import {
  BookOpen,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Star,
  Trophy,
  ArrowUpCircle,
} from "lucide-react";

type AssessmentAge = {
  id: string;
  ageYear: number;
  ageMonth: number;
  displayLabel: string;
  australianYear: string | null;
};

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

type PromotionAttempt = {
  id: string;
  outcome: string;
  percentageScore: number | null;
  startedAt: string;
  promotionTest: { title: string; subject: string; totalMarks: number; passingScore: number } | null;
  promotedToAge: { displayLabel: string } | null;
  gradedBy: { name: string | null } | null;
};

type Placement = {
  id: string;
  subject: string;
  currentLessonNumber: number;
  lessonsCompleted: number;
  status: string;
  readyForPromotion: boolean;
  placedAt: string;
  placementMethod: string;
  placementNotes: string | null;
  currentAge: AssessmentAge;
  initialAge: AssessmentAge | null;
  placedBy: { name: string | null; role: string };
  lessonCompletions: LessonCompletion[];
  historyLog: HistoryEntry[];
  promotionAttempts: PromotionAttempt[];
};

interface Props {
  student: { id: string; name: string; chronoAge: number | null };
  placements: Placement[];
  assessmentAges: AssessmentAge[];
  canEdit?: boolean;
}

const SUBJECTS = ["ENGLISH", "MATHEMATICS", "SCIENCE", "STEM", "READING", "WRITING"];

const OUTCOME_STYLES: Record<string, string> = {
  PROMOTED: "text-emerald-600 dark:text-emerald-400",
  LEVEL_SKIPPED: "text-purple-600 dark:text-purple-400",
  FAILED: "text-red-600 dark:text-red-400",
  BORDERLINE: "text-yellow-600 dark:text-yellow-400",
  PENDING: "text-gray-500 dark:text-gray-400",
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  INITIAL_PLACEMENT: "Initial placement",
  PROMOTED: "Promoted",
  LEVEL_SKIPPED: "Level skipped",
  REGRESSED: "Regressed",
  MANUAL_OVERRIDE: "Manual override",
};

const LESSON_STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: "text-gray-400",
  IN_PROGRESS: "text-blue-500",
  SUBMITTED: "text-yellow-500",
  MARKED: "text-emerald-500",
  NEEDS_REVISION: "text-red-500",
};

function PlacementCard({
  placement,
  chronoAge,
  canEdit,
}: {
  placement: Placement;
  chronoAge: number | null;
  canEdit: boolean;
}) {
  const [showLessons, setShowLessons] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPromotions, setShowPromotions] = useState(false);

  const assessmentAge =
    placement.currentAge.ageYear + placement.currentAge.ageMonth / 12;
  const ageGap = chronoAge !== null ? Math.round((assessmentAge - chronoAge) * 10) / 10 : null;

  let bandLabel = "On Level";
  let bandColor = "text-blue-600 dark:text-blue-400";
  if (ageGap !== null) {
    if (ageGap >= 0.5) { bandLabel = "Above Level"; bandColor = "text-emerald-600 dark:text-emerald-400"; }
    else if (ageGap >= -0.5) { bandLabel = "On Level"; bandColor = "text-blue-600 dark:text-blue-400"; }
    else if (ageGap >= -1.0) { bandLabel = "Slightly Below"; bandColor = "text-yellow-600 dark:text-yellow-600"; }
    else if (ageGap >= -2.0) { bandLabel = "Below Level"; bandColor = "text-orange-600 dark:text-orange-400"; }
    else { bandLabel = "Significantly Below"; bandColor = "text-red-600 dark:text-red-400"; }
  }

  const progressPct = Math.min((placement.lessonsCompleted / 25) * 100, 100);
  const markedCount = placement.lessonCompletions.filter((lc) =>
    ["MARKED", "COMPLETED"].includes(lc.status)
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {placement.subject.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {placement.currentAge.displayLabel}
            </span>
            {placement.currentAge.australianYear && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {placement.currentAge.australianYear}
              </span>
            )}
            {ageGap !== null && (
              <span className={`text-sm font-medium ${bandColor}`}>
                {bandLabel} ({ageGap >= 0 ? "+" : ""}{ageGap}yr)
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          {placement.readyForPromotion ? (
            <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-full">
              <ArrowUpCircle className="w-3 h-3" />
              Ready to promote
            </span>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {placement.status}
            </span>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600 dark:text-gray-400">
            Lesson {placement.currentLessonNumber} of 25
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {placement.lessonsCompleted} / 25 completed
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            {markedCount} graded
          </span>
          {placement.initialAge && placement.initialAge.id !== placement.currentAge.id && (
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              Started at {placement.initialAge.displayLabel}
            </span>
          )}
          <span>Placed by {placement.placedBy.name ?? "—"}</span>
        </div>
      </div>

      {/* Expandable sections */}
      <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {/* Lessons */}
        <button
          onClick={() => setShowLessons((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <span className="flex items-center gap-2 font-medium">
            <BookOpen className="w-4 h-4" />
            Lesson breakdown ({placement.lessonCompletions.length} tracked)
          </span>
          {showLessons ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLessons && (
          <div className="px-5 py-4 bg-gray-50 dark:bg-gray-750">
            {placement.lessonCompletions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No lessons tracked yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {placement.lessonCompletions.map((lc) => (
                  <div
                    key={lc.id}
                    className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-xs"
                  >
                    <span className="font-bold text-gray-500 w-8 shrink-0">
                      #{lc.lesson.lessonNumber}
                    </span>
                    <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">
                      {lc.lesson.title}
                    </span>
                    <span className={`shrink-0 font-medium ${LESSON_STATUS_STYLES[lc.status] ?? "text-gray-400"}`}>
                      {lc.status.replace(/_/g, " ")}
                    </span>
                    {lc.percentageScore !== null && (
                      <span className="shrink-0 text-gray-500">{lc.percentageScore}%</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Promotion attempts */}
        {placement.promotionAttempts.length > 0 && (
          <>
            <button
              onClick={() => setShowPromotions((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <Star className="w-4 h-4" />
                Promotion attempts ({placement.promotionAttempts.length})
              </span>
              {showPromotions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showPromotions && (
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-750 space-y-2">
                {placement.promotionAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 text-sm"
                  >
                    <div>
                      <span className={`font-semibold ${OUTCOME_STYLES[attempt.outcome] ?? "text-gray-500"}`}>
                        {attempt.outcome}
                      </span>
                      {attempt.promotedToAge && (
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                          → {attempt.promotedToAge.displayLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      {attempt.percentageScore !== null && `${attempt.percentageScore}%`}
                      <span className="ml-2">{new Date(attempt.startedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* History log */}
        {placement.historyLog.length > 0 && (
          <>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4" />
                Level change history ({placement.historyLog.length})
              </span>
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showHistory && (
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-750 space-y-2">
                {placement.historyLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-2.5 text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {CHANGE_TYPE_LABELS[entry.changeType] ?? entry.changeType}
                      </span>
                      {entry.fromAge && (
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          {entry.fromAge.displayLabel} → {entry.toAge.displayLabel}
                        </span>
                      )}
                      {!entry.fromAge && (
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          at {entry.toAge.displayLabel}
                        </span>
                      )}
                      {entry.reason && (
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5">{entry.reason}</p>
                      )}
                    </div>
                    <div className="text-gray-400 shrink-0 text-right">
                      <div>{entry.changedBy.name}</div>
                      <div>{new Date(entry.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function StudentAssessmentClient({ student, placements, assessmentAges, canEdit }: Props) {
  const placedSubjects = placements.map((p) => p.subject);
  const unplacedSubjects = SUBJECTS.filter((s) => !placedSubjects.includes(s));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{placements.length}</div>
          <div className="text-sm text-gray-500">Active subjects</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {placements.filter((p) => p.readyForPromotion).length}
          </div>
          <div className="text-sm text-gray-500">Ready to promote</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {placements.reduce((acc, p) => acc + p.lessonsCompleted, 0)}
          </div>
          <div className="text-sm text-gray-500">Total lessons completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {student.chronoAge ?? "—"}
          </div>
          <div className="text-sm text-gray-500">Chronological age</div>
        </div>
      </div>

      {/* Subject placements */}
      {placements.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No placements yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {canEdit
              ? "This student hasn't been placed in any subjects. Use the placement API to assign a starting assessment age level."
              : "You haven't been placed in any assessment subjects yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {placements.map((placement) => (
            <PlacementCard
              key={placement.id}
              placement={placement}
              chronoAge={student.chronoAge}
              canEdit={canEdit ?? false}
            />
          ))}
        </div>
      )}

      {/* Unplaced subjects notice */}
      {canEdit && unplacedSubjects.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
            Not yet placed in {unplacedSubjects.length} subject{unplacedSubjects.length > 1 ? "s" : ""}
          </h4>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {unplacedSubjects.map((s) => s.charAt(0) + s.slice(1).toLowerCase()).join(", ")} —
            use the Student Placements API to assign assessment age levels.
          </p>
        </div>
      )}
    </div>
  );
}
