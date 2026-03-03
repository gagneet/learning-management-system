"use client";

import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LevelEntry {
  levelId: string;
  displayLabel: string;
  australianYear: string | null;
  ageYear: number;
  count: number;
}

interface KPIData {
  totalPlacements: number;
  subjectBreakdown: Record<string, number>;
  avgLessonsCompleted: number;
  readyForPromotion: number;
  promotionSuccessRate: number | null;
  totalPromotionAttempts: number;
  studentsWithNoProgress: number;
  studentsNeedingRevision: number;
  levelDistribution: LevelEntry[];
  generatedAt: string;
}

interface Props {
  data: KPIData;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SUBJECT_COLOURS: Record<
  string,
  { bar: string; badge: string }
> = {
  ENGLISH: {
    bar: "bg-purple-500",
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  },
  MATHEMATICS: {
    bar: "bg-blue-500",
    badge:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  SCIENCE: {
    bar: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  STEM: {
    bar: "bg-orange-500",
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  },
  READING: {
    bar: "bg-pink-500",
    badge:
      "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  },
  WRITING: {
    bar: "bg-teal-500",
    badge:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sublabel,
  icon,
  iconBg,
  valueColour,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColour: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col gap-3">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${iconBg}`}>
        {icon}
      </div>
      <div>
        <div className={`text-3xl font-bold ${valueColour}`}>{value}</div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
          {label}
        </div>
        {sublabel && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AssessmentKPIClient({ data }: Props) {
  const {
    totalPlacements,
    subjectBreakdown,
    avgLessonsCompleted,
    readyForPromotion,
    promotionSuccessRate,
    totalPromotionAttempts,
    studentsWithNoProgress,
    studentsNeedingRevision,
    levelDistribution,
    generatedAt,
  } = data;

  // Subject chart: compute max for proportional bars
  const subjectEntries = Object.entries(subjectBreakdown).filter(
    ([, count]) => count > 0
  );
  const maxSubjectCount = Math.max(...subjectEntries.map(([, c]) => c), 1);

  // Level distribution chart
  const maxLevelCount = Math.max(
    ...levelDistribution.map((l) => l.count),
    1
  );

  return (
    <div className="space-y-8">

      {/* ── Page title ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assessment KPI Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Centre-wide key performance indicators for student assessment
            placements, progress, and promotions.
          </p>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          Last updated: {formatTime(generatedAt)}
        </div>
      </div>

      {/* ── Stats row (6 cards) ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Placements"
          value={totalPlacements}
          sublabel="active across all subjects"
          icon={<Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          valueColour="text-blue-700 dark:text-blue-400"
        />
        <StatCard
          label="Avg Lessons Completed"
          value={avgLessonsCompleted}
          sublabel="per active placement"
          icon={<BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          valueColour="text-indigo-700 dark:text-indigo-400"
        />
        <StatCard
          label="Ready for Promotion"
          value={readyForPromotion}
          sublabel="awaiting promotion test"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          valueColour="text-emerald-700 dark:text-emerald-400"
        />
        <StatCard
          label="Promotion Success Rate"
          value={
            promotionSuccessRate !== null
              ? `${promotionSuccessRate}%`
              : "—"
          }
          sublabel={
            totalPromotionAttempts > 0
              ? `${totalPromotionAttempts} attempt${totalPromotionAttempts !== 1 ? "s" : ""} resolved`
              : "No resolved attempts yet"
          }
          icon={<CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          valueColour="text-purple-700 dark:text-purple-400"
        />
        <StatCard
          label="No Progress"
          value={studentsWithNoProgress}
          sublabel="placed 7+ days, 0 lessons"
          icon={<AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          iconBg="bg-orange-50 dark:bg-orange-900/30"
          valueColour={
            studentsWithNoProgress > 0
              ? "text-orange-700 dark:text-orange-400"
              : "text-gray-500 dark:text-gray-400"
          }
        />
        <StatCard
          label="Needs Revision"
          value={studentsNeedingRevision}
          sublabel="lesson completions flagged"
          icon={<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
          iconBg="bg-red-50 dark:bg-red-900/30"
          valueColour={
            studentsNeedingRevision > 0
              ? "text-red-700 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }
        />
      </div>

      {/* ── Subject Breakdown ────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Subject Breakdown
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Number of active student placements per subject.
        </p>

        {subjectEntries.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">
            No active placement data available.
          </p>
        ) : (
          <div className="space-y-3">
            {subjectEntries
              .sort(([, a], [, b]) => b - a)
              .map(([subject, count]) => {
                const pct = Math.round((count / totalPlacements) * 100);
                const barPct = Math.round(
                  (count / maxSubjectCount) * 100
                );
                const colours =
                  SUBJECT_COLOURS[subject] ?? {
                    bar: "bg-gray-400",
                    badge: "bg-gray-100 text-gray-700",
                  };
                return (
                  <div key={subject} className="flex items-center gap-3">
                    {/* Subject label */}
                    <div className="w-28 shrink-0 text-right">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${colours.badge}`}
                      >
                        {subject}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-6 rounded-full transition-all duration-500 ${colours.bar}`}
                        style={{
                          width: `${Math.max(barPct, count > 0 ? 4 : 0)}%`,
                        }}
                      />
                    </div>

                    {/* Count + percentage */}
                    <div className="w-20 shrink-0 flex items-center gap-1">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {count}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* ── Level Distribution ───────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Level Distribution
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Student count at each Australian year level (sorted by age year,
          ascending).
        </p>

        {levelDistribution.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">
            No level distribution data available.
          </p>
        ) : (
          <div className="space-y-3">
            {levelDistribution.map((entry) => {
              const barPct = Math.round(
                (entry.count / maxLevelCount) * 100
              );
              const pctOfTotal = Math.round(
                (entry.count / totalPlacements) * 100
              );
              return (
                <div key={entry.levelId} className="flex items-center gap-3">
                  {/* Label */}
                  <div className="w-28 shrink-0 text-right text-xs text-gray-600 dark:text-gray-400 leading-tight">
                    <div className="font-medium">{entry.displayLabel}</div>
                    {entry.australianYear && (
                      <div className="text-gray-400 dark:text-gray-500">
                        Yr {entry.australianYear}
                      </div>
                    )}
                  </div>

                  {/* Bar */}
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-6 rounded-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${Math.max(barPct, entry.count > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>

                  {/* Count + percentage */}
                  <div className="w-20 shrink-0 flex items-center gap-1">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {entry.count}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({pctOfTotal}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Quick Links ──────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/v1/assessment-export"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </a>

          <Link
            href="/dashboard/supervisor/assessment-risk"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <AlertCircle className="w-4 h-4" />
            View Risk Monitor
          </Link>

          <Link
            href="/dashboard/supervisor/assessment-analytics"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Assessment Analytics
          </Link>
        </div>
      </section>

      {/* ── Footer timestamp ─────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
        Data generated at {formatTime(generatedAt)}
      </p>
    </div>
  );
}
