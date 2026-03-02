"use client";

import { TrendingUp, TrendingDown, Trophy, BookOpen, Users, AlertTriangle } from "lucide-react";

type BandCounts = Record<string, number>;

type SubjectStat = {
  total: number;
  readyForPromotion: number;
  belowLevel: number;
  avgLessonsCompleted: number;
};

type HistoryEntry = {
  id: string;
  changeType: string;
  subject: string;
  studentName: string;
  toAge: string;
  fromAge: string | null;
  changedBy: string;
  createdAt: string;
};

interface Props {
  data: {
    totalPlacements:      number;
    readyForPromotion:    number;
    totalLessonsCompleted: number;
    bandCounts:           BandCounts;
    subjectStats:         Record<string, SubjectStat>;
    promotionAttempts:    number;
    successfulPromotions: number;
    recentHistory:        HistoryEntry[];
  };
}

const BAND_META: Record<string, { label: string; colour: string; bg: string }> = {
  ABOVE:             { label: "Above Level",        colour: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
  ON_LEVEL:          { label: "On Level",           colour: "text-blue-700 dark:text-blue-300",       bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  SLIGHTLY_BELOW:    { label: "Slightly Below",     colour: "text-yellow-700 dark:text-yellow-300",   bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
  BELOW:             { label: "Below Level",        colour: "text-orange-700 dark:text-orange-300",   bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" },
  SIGNIFICANTLY_BELOW:{ label: "Sig. Below",        colour: "text-red-700 dark:text-red-300",         bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  UNKNOWN:           { label: "No DOB (unknown)",   colour: "text-gray-500 dark:text-gray-400",       bg: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" },
};

const SUBJECT_COLOURS: Record<string, string> = {
  ENGLISH:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  MATHEMATICS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  SCIENCE:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  STEM:        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  READING:     "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  WRITING:     "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  INITIAL_PLACEMENT:  "Initial placement",
  PROMOTED:          "Promoted",
  LEVEL_SKIPPED:     "Level skipped",
  REGRESSED:         "Regressed",
  MANUAL_OVERRIDE:   "Manual override",
};

export function AssessmentAnalyticsClient({ data }: Props) {
  const {
    totalPlacements,
    readyForPromotion,
    totalLessonsCompleted,
    bandCounts,
    subjectStats,
    promotionAttempts,
    successfulPromotions,
    recentHistory,
  } = data;

  const promotionRate = promotionAttempts > 0
    ? Math.round((successfulPromotions / promotionAttempts) * 100)
    : null;

  // Max band count for bar chart proportions
  const maxBandCount = Math.max(...Object.values(bandCounts), 1);

  return (
    <div className="space-y-8">
      {/* ── KPI Summary ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          value={totalPlacements}
          label="Active Placements"
          sublabel="across all subjects"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          colour="text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          value={readyForPromotion}
          label="Ready to Promote"
          sublabel="awaiting promotion test"
          icon={<Trophy className="w-5 h-5 text-purple-600" />}
          colour="text-purple-600 dark:text-purple-400"
        />
        <KpiCard
          value={totalLessonsCompleted}
          label="Total Lessons Done"
          sublabel="cumulative across placements"
          icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
          colour="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          value={promotionRate !== null ? `${promotionRate}%` : "—"}
          label="Promotion Pass Rate"
          sublabel={`${successfulPromotions} of ${promotionAttempts} (30 days)`}
          icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
          colour="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── Age Band Distribution ───────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Age Band Distribution
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Distribution of student placements relative to their chronological age across all subjects.
        </p>
        <div className="space-y-3">
          {Object.entries(BAND_META).map(([band, meta]) => {
            const count = bandCounts[band] ?? 0;
            const pct   = Math.round((count / maxBandCount) * 100);
            if (count === 0 && band === "UNKNOWN") return null;
            return (
              <div key={band} className="flex items-center gap-4">
                <div className="w-40 shrink-0 text-sm text-right text-gray-600 dark:text-gray-400">
                  {meta.label}
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                  <div
                    className={`h-6 rounded-full transition-all duration-700 ${meta.bg.split(" ")[0]} border ${meta.bg.split(" ").slice(1).join(" ")}`}
                    style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <div className={`w-10 text-right font-bold text-lg shrink-0 ${meta.colour}`}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          * Only students with a date of birth on file can be assigned an age band.
        </p>
      </section>

      {/* ── Subject Breakdown ───────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Subject Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">Subject</th>
                <th className="text-right py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Placements</th>
                <th className="text-right py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Ready to Promote</th>
                <th className="text-right py-2 px-4 font-medium text-gray-600 dark:text-gray-400">Below Level</th>
                <th className="text-right py-2 pl-4 font-medium text-gray-600 dark:text-gray-400">Avg Lessons Done</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {Object.entries(subjectStats)
                .filter(([, stat]) => stat.total > 0)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([subject, stat]) => (
                  <tr key={subject} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SUBJECT_COLOURS[subject] ?? ""}`}>
                        {subject}
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-4 font-medium text-gray-900 dark:text-white">
                      {stat.total}
                    </td>
                    <td className="text-right py-2.5 px-4">
                      <span className={stat.readyForPromotion > 0 ? "text-purple-600 dark:text-purple-400 font-medium" : "text-gray-400"}>
                        {stat.readyForPromotion}
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-4">
                      {stat.belowLevel > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {stat.belowLevel}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">0</span>
                      )}
                    </td>
                    <td className="text-right py-2.5 pl-4 text-gray-700 dark:text-gray-300">
                      {stat.avgLessonsCompleted}
                    </td>
                  </tr>
                ))}
              {Object.values(subjectStats).every((s) => s.total === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">
                    No placement data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Recent Activity ─────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
          Recent Assessment Activity <span className="text-sm font-normal text-gray-500">(last 30 days)</span>
        </h2>
        {recentHistory.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">
            No assessment changes recorded in the last 30 days.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {recentHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 bg-gray-50 dark:bg-gray-750 rounded-lg px-4 py-2.5 text-sm"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  entry.changeType === "PROMOTED" || entry.changeType === "LEVEL_SKIPPED"
                    ? "bg-emerald-400"
                    : entry.changeType === "REGRESSED"
                    ? "bg-red-400"
                    : "bg-blue-400"
                }`} />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">{entry.studentName}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1.5">
                    {CHANGE_TYPE_LABELS[entry.changeType] ?? entry.changeType}
                    {entry.fromAge && ` (${entry.fromAge} → ${entry.toAge})`}
                    {!entry.fromAge && ` at ${entry.toAge}`}
                  </span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${SUBJECT_COLOURS[entry.subject] ?? "bg-gray-100 text-gray-600"}`}>
                  {entry.subject}
                </span>
                <span className="text-xs text-gray-400 shrink-0 text-right">
                  {new Date(entry.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  <br />
                  <span className="text-gray-400">{entry.changedBy}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  value,
  label,
  sublabel,
  icon,
  colour,
}: {
  value: number | string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  colour: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700`}>{icon}</div>
      </div>
      <div className={`text-3xl font-bold mb-1 ${colour}`}>{value}</div>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>
    </div>
  );
}
