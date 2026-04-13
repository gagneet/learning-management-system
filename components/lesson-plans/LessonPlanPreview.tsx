"use client";

import MathText from "@/components/lesson-plans/MathText";
import {
  LESSON_PLAN_SECTION_LABELS,
  LESSON_PLAN_SECTION_ORDER,
  type LessonPlanFormValues,
} from "@/lib/lesson-plans";

interface LessonPlanPreviewProps {
  lessonTitle: string;
  lessonDescription?: string | null;
  moduleTitle?: string;
  plan: LessonPlanFormValues;
  showTeacherNotes?: boolean;
}

export default function LessonPlanPreview({
  lessonTitle,
  lessonDescription,
  moduleTitle,
  plan,
  showTeacherNotes = false,
}: LessonPlanPreviewProps) {
  const hasVisibleContent =
    plan.objectives.length > 0 ||
    plan.mathExpressions.length > 0 ||
    LESSON_PLAN_SECTION_ORDER.some((key) => plan[key].trim().length > 0) ||
    (showTeacherNotes && plan.teacherNotes.trim().length > 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{lessonTitle}</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              plan.planType === "MATHEMATICS"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            }`}
          >
            {plan.planType === "MATHEMATICS" ? "Mathematics lesson" : "Standard lesson"}
          </span>
          {plan.estimatedDuration ? (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {plan.estimatedDuration} min
            </span>
          ) : null}
        </div>

        {moduleTitle ? (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Module: {moduleTitle}</p>
        ) : null}

        {lessonDescription ? (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{lessonDescription}</p>
        ) : null}
      </div>

      {!hasVisibleContent ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
          This lesson plan has not been authored yet.
        </div>
      ) : null}

      {plan.objectives.length > 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning objectives</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-200">
            {plan.objectives.map((objective, index) => (
              <li key={`${objective}-${index}`} className="flex gap-3">
                <span className="mt-0.5 text-blue-600 dark:text-blue-400">•</span>
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {plan.mathExpressions.length > 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Formula bank</h3>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              MathJax enabled
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {plan.mathExpressions.map((expression) => (
              <div
                key={expression.id}
                className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800 dark:bg-emerald-950/20"
              >
                <p className="font-semibold text-gray-900 dark:text-white">{expression.title}</p>
                {expression.notes ? (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{expression.notes}</p>
                ) : null}
                <MathText
                  content={`$$${expression.latex}$$`}
                  className="mt-4 rounded-lg bg-white/80 px-3 py-4 text-center text-gray-900 dark:bg-gray-900/60 dark:text-white"
                />
                <code className="mt-3 block overflow-x-auto rounded-lg bg-gray-900 px-3 py-2 text-xs text-emerald-200">
                  {expression.latex}
                </code>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {LESSON_PLAN_SECTION_ORDER.map((sectionKey) => {
        const sectionContent = plan[sectionKey].trim();
        if (!sectionContent) {
          return null;
        }

        return (
          <section
            key={sectionKey}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {LESSON_PLAN_SECTION_LABELS[sectionKey]}
            </h3>
            <MathText content={sectionContent} className="mt-4 text-sm text-gray-700 dark:text-gray-200" />
          </section>
        );
      })}

      {showTeacherNotes && plan.teacherNotes.trim().length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm dark:border-amber-800 dark:bg-amber-950/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Teacher notes</h3>
          <MathText content={plan.teacherNotes} className="mt-4 text-sm text-gray-700 dark:text-gray-200" />
        </section>
      ) : null}
    </div>
  );
}
