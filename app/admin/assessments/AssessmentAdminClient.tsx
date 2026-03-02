"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type PromotionTestSummary = {
  id: string;
  subject: string;
  title: string;
  passingScore: number;
};

type AssessmentLevel = {
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
  subjectLessonCounts: Record<string, number>;
  promotionTests: PromotionTestSummary[];
};

type Stats = {
  totalLevels: number;
  activeLevels: number;
  totalLessons: number;
  totalPlacements: number;
};

interface Props {
  levels: AssessmentLevel[];
  stats: Stats;
}

const SUBJECT_SHORT: Record<string, string> = {
  ENGLISH: "EN",
  MATHEMATICS: "MA",
  SCIENCE: "SC",
  STEM: "ST",
  READING: "RE",
  WRITING: "WR",
};

const SUBJECT_COLORS: Record<string, string> = {
  ENGLISH: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  MATHEMATICS: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  SCIENCE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  STEM: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  READING: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  WRITING: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const SUBJECT_ORDER = ["ENGLISH", "MATHEMATICS", "SCIENCE", "STEM", "READING", "WRITING"];

export function AssessmentAdminClient({ levels, stats }: Props) {
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [optimisticLevels, setOptimisticLevels] = useState<AssessmentLevel[]>(levels);

  const filtered = useMemo(() => {
    return optimisticLevels.filter((level) => {
      if (activeOnly && !level.isActive) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchLabel = level.displayLabel.toLowerCase().includes(q);
        const matchYear = level.australianYear?.toLowerCase().includes(q) ?? false;
        if (!matchLabel && !matchYear) return false;
      }
      return true;
    });
  }, [optimisticLevels, search, activeOnly]);

  async function handleToggleActive(level: AssessmentLevel) {
    if (togglingId) return;
    setTogglingId(level.id);

    // Optimistic update
    setOptimisticLevels((prev) =>
      prev.map((l) => (l.id === level.id ? { ...l, isActive: !l.isActive } : l))
    );

    try {
      const res = await fetch(`/api/v1/assessment-levels/${level.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !level.isActive }),
      });

      if (!res.ok) {
        // Revert on failure
        setOptimisticLevels((prev) =>
          prev.map((l) => (l.id === level.id ? { ...l, isActive: level.isActive } : l))
        );
        const data = await res.json().catch(() => ({}));
        alert(`Failed to update level: ${data.error ?? res.statusText}`);
      }
    } catch {
      // Revert on network error
      setOptimisticLevels((prev) =>
        prev.map((l) => (l.id === level.id ? { ...l, isActive: level.isActive } : l))
      );
      alert("Network error while updating level status.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={stats.totalLevels}
          label="Total Levels"
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          value={stats.activeLevels}
          label="Active Levels"
          color="text-green-600 dark:text-green-400"
          bg="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          value={stats.totalLessons}
          label="Total Lessons"
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard
          value={stats.totalPlacements}
          label="Total Placements"
          color="text-orange-600 dark:text-orange-400"
          bg="bg-orange-50 dark:bg-orange-900/20"
        />
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by label or year level (e.g. 5.1, Year 3)..."
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              role="switch"
              aria-checked={activeOnly}
              onClick={() => setActiveOnly((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                activeOnly ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  activeOnly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Only</span>
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Showing {filtered.length} of {optimisticLevels.length} levels
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Age Range
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Lessons by Subject
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Promo Tests
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Placements
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((level) => (
                <tr
                  key={level.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  {/* Level */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {level.displayLabel}
                    </div>
                    {level.australianYear && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {level.australianYear}
                      </div>
                    )}
                  </td>

                  {/* Age Range */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {level.ageYear}.{String(level.ageMonth).padStart(2, "0")}
                    </span>
                  </td>

                  {/* Lessons by Subject */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {SUBJECT_ORDER.map((subject) => {
                        const count = level.subjectLessonCounts[subject];
                        if (!count) return null;
                        return (
                          <span
                            key={subject}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${SUBJECT_COLORS[subject]}`}
                            title={`${subject}: ${count} lesson${count !== 1 ? "s" : ""}`}
                          >
                            {SUBJECT_SHORT[subject]}:{count}
                          </span>
                        );
                      })}
                      {Object.keys(level.subjectLessonCounts).length === 0 && (
                        <span className="text-xs text-gray-400 italic">No lessons</span>
                      )}
                    </div>
                  </td>

                  {/* Promo Tests */}
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`text-sm font-semibold ${
                        level.totalPromotionTests > 0
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-400"
                      }`}
                    >
                      {level.totalPromotionTests}
                    </span>
                  </td>

                  {/* Placements */}
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`text-sm font-semibold ${
                        level.totalPlacements > 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400"
                      }`}
                    >
                      {level.totalPlacements}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 text-center">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        level.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {level.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/assessments/${level.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        View Lessons
                      </Link>
                      <button
                        onClick={() => handleToggleActive(level)}
                        disabled={togglingId === level.id}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          level.isActive
                            ? "text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            : "text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        }`}
                      >
                        {togglingId === level.id
                          ? "Saving..."
                          : level.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500">
            <p className="text-lg font-medium">No levels found</p>
            <p className="text-sm mt-1">
              {search || activeOnly
                ? "Try adjusting your search or filter."
                : "No assessment levels have been created yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  color,
  bg,
}: {
  value: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 p-5 ${bg}`}>
      <div className={`text-3xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}
