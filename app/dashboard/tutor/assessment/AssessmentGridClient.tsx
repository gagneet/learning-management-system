"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Download, ChevronRight, CheckSquare, Square, Users, X } from "lucide-react";

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

const PLACEMENT_METHODS = [
  { value: "DIAGNOSTIC_TEST", label: "Diagnostic Test" },
  { value: "TEACHER_ASSESSMENT", label: "Teacher Assessment" },
  { value: "CURRICULUM_AGE", label: "Curriculum Age" },
  { value: "MANUAL_OVERRIDE", label: "Manual Override" },
];

const ALL_SUBJECTS_VALUE = "__ALL__";

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

interface BulkPlaceModalProps {
  selectedStudents: StudentRow[];
  subjects: string[];
  onClose: () => void;
  onSuccess: () => void;
}

function BulkPlaceModal({ selectedStudents, subjects, onClose, onSuccess }: BulkPlaceModalProps) {
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS_VALUE);
  const [ageYear, setAgeYear] = useState(8);
  const [ageMonth, setAgeMonth] = useState(1);
  const [placementMethod, setPlacementMethod] = useState("TEACHER_ASSESSMENT");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const subjectsToPlace = selectedSubject === ALL_SUBJECTS_VALUE ? subjects : [selectedSubject];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setToast(null);

    const placements = selectedStudents.flatMap((student) =>
      subjectsToPlace.map((subject) => ({
        studentId: student.id,
        subject,
        ageYear,
        ageMonth,
        placementMethod,
        placementNotes: notes || undefined,
      }))
    );

    try {
      const res = await fetch("/api/v1/student-placements/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placements }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ type: "error", message: data.error ?? "Bulk placement failed." });
        setIsSubmitting(false);
        return;
      }

      const { created, updated, errors } = data;
      const successCount = created + updated;
      let message = `Placed ${successCount} record${successCount !== 1 ? "s" : ""} (${created} new, ${updated} updated).`;
      if (errors && errors.length > 0) {
        message += ` ${errors.length} error${errors.length !== 1 ? "s" : ""} occurred.`;
      }

      setToast({ type: errors?.length > 0 ? "error" : "success", message });
      setIsSubmitting(false);

      if (successCount > 0) {
        onSuccess();
      }
    } catch {
      setToast({ type: "error", message: "Network error. Please try again." });
      setIsSubmitting(false);
    }
  };

  const totalPlacements = selectedStudents.length * subjectsToPlace.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bulk Placement
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Toast */}
          {toast && (
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              {toast.message}
            </div>
          )}

          {/* Selected students list */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Selected students ({selectedStudents.length})
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 max-h-32 overflow-y-auto space-y-1">
              {selectedStudents.map((s) => (
                <div key={s.id} className="text-sm text-gray-800 dark:text-gray-200">
                  {s.name}
                </div>
              ))}
            </div>
          </div>

          {/* Subject selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value={ALL_SUBJECTS_VALUE}>All 6 subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Age level inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Age Year
              </label>
              <input
                type="number"
                min={5}
                max={18}
                value={ageYear}
                onChange={(e) => setAgeYear(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <p className="text-xs text-gray-400 mt-0.5">Range: 5–18</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Age Month
              </label>
              <input
                type="number"
                min={1}
                max={12}
                value={ageMonth}
                onChange={(e) => setAgeMonth(Number(e.target.value))}
                className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <p className="text-xs text-gray-400 mt-0.5">Range: 1–12</p>
            </div>
          </div>

          {/* Placement method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Placement Method
            </label>
            <select
              value={placementMethod}
              onChange={(e) => setPlacementMethod(e.target.value)}
              className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              {PLACEMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. Placed based on end-of-term diagnostic results..."
              className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
            />
          </div>

          {/* Summary */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This will place{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""}
            </span>{" "}
            across{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {subjectsToPlace.length} subject{subjectsToPlace.length !== 1 ? "s" : ""}
            </span>{" "}
            — totalling{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {totalPlacements} placement{totalPlacements !== 1 ? "s" : ""}
            </span>
            . Existing placements will be updated (MANUAL_OVERRIDE).
          </p>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting
              ? "Placing..."
              : `Place ${selectedStudents.length} Student${selectedStudents.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AssessmentGridClient({ initialData, subjects, classes }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [ageBandFilter, setAgeBandFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [readyForPromotionFilter, setReadyForPromotionFilter] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);

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
      if (readyForPromotionFilter) {
        const hasReady = subjects.some((s) => student.placements[s]?.readyForPromotion === true);
        if (!hasReady) return false;
      }
      return true;
    });
  }, [initialData, search, ageBandFilter, subjectFilter, subjects, readyForPromotionFilter]);

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

  // Selection helpers
  const allFilteredIds = useMemo(() => filtered.map((s) => s.id), [filtered]);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));
  const someSelected = allFilteredIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedStudents = useMemo(
    () => initialData.filter((s) => selectedIds.has(s.id)),
    [initialData, selectedIds]
  );

  const handleBulkSuccess = () => {
    setShowBulkModal(false);
    clearSelection();
    setTimeout(() => {
      router.refresh();
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Place Modal */}
      {showBulkModal && (
        <BulkPlaceModal
          selectedStudents={selectedStudents}
          subjects={subjects}
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleBulkSuccess}
        />
      )}

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

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3">
          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {selectedIds.size} student{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              Bulk Place...
            </button>
            <button
              onClick={clearSelection}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-blue-200 dark:border-blue-600 text-blue-700 dark:text-blue-300 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear selection
            </button>
          </div>
        </div>
      )}

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
          {/* Ready for Promotion filter button */}
          <button
            onClick={() => setReadyForPromotionFilter((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              readyForPromotionFilter
                ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700"
                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
            title="Show only students with at least one subject ready for promotion"
          >
            ★ Ready for Promotion
          </button>
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
                {/* Select All checkbox column */}
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-3 py-3 w-10">
                  <button
                    onClick={toggleSelectAll}
                    aria-label={allSelected ? "Deselect all students" : "Select all students"}
                    className="flex items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : someSelected ? (
                      <Square className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="sticky left-10 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider min-w-48">
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
              {filtered.map((student) => {
                const isSelected = selectedIds.has(student.id);
                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                      isSelected ? "bg-blue-50/60 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    {/* Row checkbox */}
                    <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-3 py-3 w-10">
                      <button
                        onClick={() => toggleSelectOne(student.id)}
                        aria-label={isSelected ? `Deselect ${student.name}` : `Select ${student.name}`}
                        className="flex items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="sticky left-10 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 px-4 py-3 min-w-48">
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
