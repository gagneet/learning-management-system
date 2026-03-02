"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  FileText,
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Filter,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssessmentAge = {
  ageYear: number;
  ageMonth: number;
  displayLabel: string;
  australianYear: string | null;
};

type StudentAssessment = {
  id: string;
  subject: string;
  lessonsCompleted: number;
  readyForPromotion: boolean;
  status: string;
  currentAge: AssessmentAge;
};

type Student = {
  id: string;
  name: string | null;
  dateOfBirth: string | null;
  chronologicalAge: number | null;
  studentAgeAssessments: StudentAssessment[];
};

type Membership = {
  student: Student;
};

interface Props {
  classData: {
    id: string;
    name: string;
    subject: string | null;
    status: string;
    centreId: string;
    teacherName: string | null;
    memberships: Membership[];
  };
  canEdit: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  "ENGLISH",
  "MATHEMATICS",
  "SCIENCE",
  "STEM",
  "READING",
  "WRITING",
] as const;

type Subject = (typeof SUBJECTS)[number];

type AgeBand =
  | "ABOVE"
  | "ON_LEVEL"
  | "SLIGHTLY_BELOW"
  | "BELOW"
  | "SIGNIFICANTLY_BELOW"
  | "UNKNOWN";

type FilterBand = "ALL" | AgeBand;

const BAND_META: Record<
  AgeBand,
  { label: string; chip: string; dot: string }
> = {
  ABOVE: {
    label: "Above Level",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  ON_LEVEL: {
    label: "On Level",
    chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  SLIGHTLY_BELOW: {
    label: "Slightly Below",
    chip: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    dot: "bg-yellow-500",
  },
  BELOW: {
    label: "Below Level",
    chip: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  SIGNIFICANTLY_BELOW: {
    label: "Sig. Below",
    chip: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-500",
  },
  UNKNOWN: {
    label: "No DOB",
    chip: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    dot: "bg-gray-400",
  },
};

const SUBJECT_COLOURS: Record<Subject, string> = {
  ENGLISH:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  MATHEMATICS:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  SCIENCE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  STEM: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  READING:
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  WRITING:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeBand(
  assessment: StudentAssessment,
  chronologicalAge: number | null
): AgeBand {
  if (chronologicalAge === null) return "UNKNOWN";
  const assessmentAge =
    assessment.currentAge.ageYear + assessment.currentAge.ageMonth / 12;
  const gap = assessmentAge - chronologicalAge;
  if (gap >= 0.5) return "ABOVE";
  if (gap >= -0.5) return "ON_LEVEL";
  if (gap >= -1.5) return "SLIGHTLY_BELOW";
  if (gap >= -3) return "BELOW";
  return "SIGNIFICANTLY_BELOW";
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubjectCell({
  assessment,
  chronologicalAge,
  studentId,
}: {
  assessment: StudentAssessment | undefined;
  chronologicalAge: number | null;
  studentId: string;
}) {
  if (!assessment) {
    return (
      <td className="px-3 py-2.5 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-300 dark:text-gray-600 font-medium text-sm">
            —
          </span>
          <Link
            href={`/dashboard/tutor/students/${studentId}/assessment`}
            className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
          >
            Place
          </Link>
        </div>
      </td>
    );
  }

  const band = computeBand(assessment, chronologicalAge);
  const meta = BAND_META[band];

  return (
    <td className="px-3 py-2.5 text-center">
      <div className="flex flex-col items-center gap-1">
        <span
          className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${meta.chip}`}
        >
          {assessment.currentAge.australianYear
            ? assessment.currentAge.australianYear
            : assessment.currentAge.displayLabel}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
          {meta.label}
        </span>
        {assessment.readyForPromotion && (
          <Star
            className="w-3 h-3 text-purple-500 fill-purple-400"
            aria-label="Ready for promotion"
          />
        )}
      </div>
    </td>
  );
}

// ─── Subject Stats Panel ──────────────────────────────────────────────────────

function SubjectStatsPanel({
  students,
  activeSubject,
  onSelectSubject,
}: {
  students: Student[];
  activeSubject: Subject | "ALL";
  onSelectSubject: (s: Subject | "ALL") => void;
}) {
  const stats = useMemo(() => {
    return SUBJECTS.map((subject) => {
      const placements = students.flatMap((s) =>
        s.studentAgeAssessments.filter((a) => a.subject === subject)
      );
      const placed = placements.length;
      const readyCount = placements.filter((a) => a.readyForPromotion).length;
      const avgLessons =
        placed > 0
          ? Math.round(
              placements.reduce((sum, a) => sum + a.lessonsCompleted, 0) /
                placed
            )
          : 0;
      return { subject, placed, readyCount, avgLessons };
    });
  }, [students]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Subject Breakdown
        </h2>
      </div>
      <div className="flex overflow-x-auto">
        {/* ALL tab */}
        <button
          onClick={() => onSelectSubject("ALL")}
          className={`flex-shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeSubject === "ALL"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          All Subjects
        </button>
        {stats.map(({ subject, placed, readyCount, avgLessons }) => (
          <button
            key={subject}
            onClick={() => onSelectSubject(subject)}
            className={`flex-shrink-0 px-4 py-3 text-xs border-b-2 transition-colors ${
              activeSubject === subject
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
          >
            <div className="flex flex-col items-center gap-0.5 min-w-[72px]">
              <span
                className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                  SUBJECT_COLOURS[subject as Subject]
                }`}
              >
                {capitalize(subject)}
              </span>
              <span className="text-gray-700 dark:text-gray-300 font-bold text-base">
                {placed}
              </span>
              <span className="text-gray-400 text-xs">placed</span>
              {readyCount > 0 && (
                <span className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                  {readyCount} ready
                </span>
              )}
              <span className="text-gray-400 text-xs">
                avg {avgLessons} lessons
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClassAssessmentClient({ classData, canEdit }: Props) {
  const [filterBand, setFilterBand] = useState<FilterBand>("ALL");
  const [subjectTab, setSubjectTab] = useState<Subject | "ALL">("ALL");

  const students = useMemo(
    () => classData.memberships.map((m) => m.student),
    [classData.memberships]
  );

  // Determine which subjects to show in the grid columns
  const visibleSubjects: Subject[] =
    subjectTab === "ALL" ? [...SUBJECTS] : [subjectTab];

  // Filter students by age-band
  const filteredStudents = useMemo(() => {
    if (filterBand === "ALL") return students;
    return students.filter((student) => {
      // Match if ANY placement in the selected band (or UNKNOWN for students without DOB)
      return student.studentAgeAssessments.some((assessment) => {
        const band = computeBand(assessment, student.chronologicalAge);
        return band === filterBand;
      });
    });
  }, [students, filterBand]);

  // Summary statistics
  const totalStudents = students.length;
  const placedInAll = students.filter((s) => {
    const subjects = new Set(s.studentAgeAssessments.map((a) => a.subject));
    return SUBJECTS.every((sub) => subjects.has(sub));
  }).length;
  const readyForPromotion = students.filter((s) =>
    s.studentAgeAssessments.some((a) => a.readyForPromotion)
  ).length;
  const avgCompletion =
    totalStudents > 0
      ? Math.round(
          (students.reduce((sum, s) => {
            const placed = s.studentAgeAssessments.length;
            return sum + (placed / SUBJECTS.length) * 100;
          }, 0) /
            totalStudents) *
            10
        ) / 10
      : 0;

  const FILTER_OPTIONS: { value: FilterBand; label: string }[] = [
    { value: "ALL", label: "All Students" },
    { value: "ABOVE", label: "Above Level" },
    { value: "ON_LEVEL", label: "On Level" },
    { value: "SLIGHTLY_BELOW", label: "Slightly Below" },
    { value: "BELOW", label: "Below Level" },
    { value: "SIGNIFICANTLY_BELOW", label: "Sig. Below" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Class Summary Bar ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {classData.name}
            </h1>
            {classData.teacherName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Teacher: {classData.teacherName}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {classData.subject && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  SUBJECT_COLOURS[classData.subject as Subject] ??
                  "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {capitalize(classData.subject)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              <Users className="w-3.5 h-3.5" />
              {totalStudents} student{totalStudents !== 1 ? "s" : ""}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                classData.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {classData.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalStudents}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Total students
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {placedInAll}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Placed in all subjects
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {readyForPromotion}
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Ready for promotion
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {avgCompletion}%
          </div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Avg subject coverage
          </div>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </div>
          {FILTER_OPTIONS.map(({ value, label }) => {
            const isActive = filterBand === value;
            let chipStyle =
              "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700";

            if (isActive) {
              if (value === "ALL")
                chipStyle =
                  "bg-blue-600 text-white border border-blue-600 dark:border-blue-500";
              else if (value === "ABOVE")
                chipStyle =
                  "bg-emerald-500 text-white border border-emerald-500";
              else if (value === "ON_LEVEL")
                chipStyle = "bg-blue-500 text-white border border-blue-500";
              else if (value === "SLIGHTLY_BELOW")
                chipStyle =
                  "bg-yellow-500 text-white border border-yellow-500";
              else if (value === "BELOW")
                chipStyle =
                  "bg-orange-500 text-white border border-orange-500";
              else if (value === "SIGNIFICANTLY_BELOW")
                chipStyle = "bg-red-500 text-white border border-red-500";
            }

            return (
              <button
                key={value}
                onClick={() => setFilterBand(value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${chipStyle}`}
              >
                {label}
              </button>
            );
          })}
          {filterBand !== "ALL" && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
              Showing {filteredStudents.length} of {totalStudents} students
            </span>
          )}
        </div>
      </div>

      {/* ── Assessment Grid Table ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                {/* Student name column */}
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-750 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide min-w-[180px] border-r border-gray-200 dark:border-gray-700"
                >
                  Student
                </th>
                {/* Subject columns */}
                {visibleSubjects.map((subject) => (
                  <th
                    key={subject}
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide min-w-[100px]"
                  >
                    <span
                      className={`px-2 py-0.5 rounded-full ${SUBJECT_COLOURS[subject]}`}
                    >
                      {capitalize(subject)}
                    </span>
                  </th>
                ))}
                {/* Actions column */}
                <th
                  scope="col"
                  className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide min-w-[80px]"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleSubjects.length + 2}
                    className="px-4 py-10 text-center"
                  >
                    <AlertTriangle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {totalStudents === 0
                        ? "No active students in this class."
                        : "No students match the selected filter."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  // Map assessments by subject for O(1) lookup
                  const assessmentBySubject = new Map(
                    student.studentAgeAssessments.map((a) => [a.subject, a])
                  );
                  const hasPromotion = student.studentAgeAssessments.some(
                    (a) => a.readyForPromotion
                  );

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                        hasPromotion
                          ? "bg-purple-50/30 dark:bg-purple-900/5"
                          : ""
                      }`}
                    >
                      {/* Student name (sticky) */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 px-4 py-2.5 border-r border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/tutor/students/${student.id}/assessment`}
                              className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
                            >
                              {student.name ?? "Unknown"}
                            </Link>
                            {student.chronologicalAge !== null && (
                              <span className="text-xs text-gray-400">
                                Age {student.chronologicalAge}
                              </span>
                            )}
                          </div>
                          {hasPromotion && (
                            <Star
                              className="w-3.5 h-3.5 text-purple-500 fill-purple-400 shrink-0"
                              aria-label="Ready for promotion"
                            />
                          )}
                        </div>
                      </td>

                      {/* Subject cells */}
                      {visibleSubjects.map((subject) => (
                        <SubjectCell
                          key={subject}
                          assessment={assessmentBySubject.get(subject)}
                          chronologicalAge={student.chronologicalAge}
                          studentId={student.id}
                        />
                      ))}

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-center">
                        <Link
                          href={`/dashboard/tutor/students/${student.id}/assessment/report`}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="View assessment report"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Report</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Age Band Legend
        </h3>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(BAND_META) as AgeBand[]).map((band) => (
            <div key={band} className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${BAND_META[band].dot}`}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {BAND_META[band].label}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <Star className="w-3 h-3 text-purple-500 fill-purple-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Ready for promotion
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Age bands compare a student&apos;s assessment level to their
          chronological age. Requires date of birth on file.
        </p>
      </div>

      {/* ── Subject Tabs Panel ────────────────────────────────────────── */}
      <SubjectStatsPanel
        students={students}
        activeSubject={subjectTab}
        onSelectSubject={setSubjectTab}
      />
    </div>
  );
}
