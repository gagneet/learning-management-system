"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Search, Download, ChevronRight } from "lucide-react";

type Subject = "ENGLISH" | "MATHEMATICS" | "SCIENCE" | "STEM" | "READING" | "WRITING";

type PlacementData = {
  ageYear: number;
  ageMonth: number;
  displayLabel: string;
  australianYear: string | null;
  currentLessonNumber: number;
  lessonsCompleted: number;
  status: string;
  readyForPromotion: boolean;
  ageGap: number | null;
  ageBand: string | null;
} | null;

type StudentRow = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  chronologicalAge: number | null;
  placements: Record<string, PlacementData>;
};

interface Props {
  initialData: StudentRow[];
  subjects: string[];
  classes: { id: string; name: string }[];
}

const AGE_BAND_STYLES: Record<string, string> = {
  ABOVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  ON_LEVEL: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SLIGHTLY_BELOW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  BELOW: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  SIGNIFICANTLY_BELOW: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const AGE_BAND_LABELS: Record<string, string> = {
  ABOVE: "Above",
  ON_LEVEL: "On Level",
  SLIGHTLY_BELOW: "Slightly Below",
  BELOW: "Below",
  SIGNIFICANTLY_BELOW: "Sig. Below",
};

const SUBJECT_SHORT: Record<string, string> = {
  ENGLISH: "ENG",
  MATHEMATICS: "MATH",
  SCIENCE: "SCI",
  STEM: "STEM",
  READING: "READ",
  WRITING: "WRITE",
};

const AGE_BAND_FILTER_OPTIONS = [
  { value: "", label: "All bands" },
  { value: "ABOVE", label: "Above level" },
  { value: "ON_LEVEL", label: "On level" },
  { value: "SLIGHTLY_BELOW", label: "Slightly below" },
  { value: "BELOW", label: "Below" },
  { value: "SIGNIFICANTLY_BELOW", label: "Significantly below" },
];

function LessonProgressBar({ completed, total = 25 }: { completed: number; total?: number }) {
  const pct = Math.min((completed / total) * 100, 100);
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
      <div
        className="bg-blue-500 h-1.5 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PlacementCell({ placement, subject }: { placement: PlacementData; subject: string }) {
  if (!placement) {
    return (
      <div className="text-center text-gray-400 dark:text-gray-600 text-xs py-2">—</div>
    );
  }

  const bandStyle = placement.ageBand ? AGE_BAND_STYLES[placement.ageBand] : "";

  return (
    <div className="space-y-1">
      <div className={`text-xs font-semibold rounded px-1.5 py-0.5 inline-block ${bandStyle}`}>
        {placement.displayLabel}
      </div>
      {placement.australianYear && (
        <div className="text-xs text-gray-500 dark:text-gray-400">{placement.australianYear}</div>
      )}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Lesson {placement.currentLessonNumber}/25
      </div>
      <LessonProgressBar completed={placement.lessonsCompleted} />
      {placement.readyForPromotion && (
        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
          ★ Ready to promote
        </span>
      )}
      {placement.ageGap !== null && (
        <div className="text-xs text-gray-500">
          {placement.ageGap >= 0 ? "+" : ""}
          {placement.ageGap}yr gap
        </div>
      )}
    </div>
  );
}

export function AssessmentGridClient({ initialData, subjects, classes }: Props) {
  const [search, setSearch] = useState("");
  const [ageBandFilter, setAgeBandFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const visibleSubjects = subjectFilter ? [subjectFilter] : subjects;

  const filtered = useMemo(() => {
    return initialData.filter((student) => {
      if (search && !student.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (ageBandFilter) {
        const hasMatch = subjects.some((s) => {
          const p = student.placements[s];
          return p?.ageBand === ageBandFilter;
        });
        if (!hasMatch) return false;
      }
      if (subjectFilter) {
        if (!student.placements[subjectFilter]) return false;
      }
      return true;
    });
  }, [initialData, search, ageBandFilter, subjectFilter, subjects]);

  // Summary counts
  const totalPlaced = initialData.filter((s) =>
    subjects.some((sub) => s.placements[sub] !== null)
  ).length;
  const readyForPromotion = initialData.reduce((acc, s) => {
    return acc + subjects.filter((sub) => s.placements[sub]?.readyForPromotion).length;
  }, 0);
  const belowLevel = initialData.reduce((acc, s) => {
    return (
      acc +
      subjects.filter((sub) => {
        const b = s.placements[sub]?.ageBand;
        return b === "BELOW" || b === "SIGNIFICANTLY_BELOW";
      }).length
    );
  }, 0);

  const exportToCsv = useCallback(() => {
    const rows: string[] = [];

    // Header row
    const header = [
      "Student Name",
      "Chronological Age",
      ...subjects.flatMap((s) => [
        `${s} Level`,
        `${s} Age Gap`,
        `${s} Band`,
        `${s} Lessons Done`,
        `${s} Ready`,
      ]),
    ];
    rows.push(header.map((h) => `"${h}"`).join(","));

    // Data rows (use filtered for "what you see is what you export")
    for (const student of filtered) {
      const cells = [
        student.name,
        student.chronologicalAge ?? "",
        ...subjects.flatMap((s) => {
          const p = student.placements[s];
          if (!p) return ["—", "", "", "", ""];
          return [
            p.displayLabel,
            p.ageGap !== null ? p.ageGap : "",
            AGE_BAND_LABELS[p.ageBand ?? ""] ?? p.ageBand ?? "",
            p.lessonsCompleted,
            p.readyForPromotion ? "Yes" : "No",
          ];
        }),
      ];
      rows.push(cells.map((c) => `"${c}"`).join(","));
    }

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.download = `assessment-grid-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filtered, subjects]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{initialData.length}</div>
          <div className="text-sm text-gray-500">Total students</div>
          <div className="text-xs text-gray-400 mt-1">{totalPlaced} placed in at least 1 subject</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{readyForPromotion}</div>
          <div className="text-sm text-gray-500">Ready to promote</div>
          <div className="text-xs text-gray-400 mt-1">Across all subjects</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-red-500 dark:text-red-400">{belowLevel}</div>
          <div className="text-sm text-gray-500">Below level (subject instances)</div>
          <div className="text-xs text-gray-400 mt-1">Below or significantly below</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <select
            value={ageBandFilter}
            onChange={(e) => setAgeBandFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          >
            {AGE_BAND_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} of {initialData.length} students
          </div>
          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="Export current view as CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Age band legend */}
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(AGE_BAND_LABELS).map(([band, label]) => (
            <span key={band} className={`text-xs px-2 py-0.5 rounded font-medium ${AGE_BAND_STYLES[band]}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Grid table */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center text-gray-500">
          No students match the current filters.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-750">
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider min-w-48">
                  Student
                </th>
                {visibleSubjects.map((subject) => (
                  <th key={subject} className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider min-w-36">
                    {SUBJECT_SHORT[subject] || subject}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 px-4 py-3 min-w-48">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{student.name}</div>
                      {student.chronologicalAge !== null && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Age {student.chronologicalAge}
                        </div>
                      )}
                    </div>
                  </td>
                  {visibleSubjects.map((subject) => (
                    <td key={subject} className="px-4 py-3 align-top">
                      <PlacementCell placement={student.placements[subject]} subject={subject} />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center align-top">
                    <Link
                      href={`/dashboard/tutor/students/${student.id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Profile <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
