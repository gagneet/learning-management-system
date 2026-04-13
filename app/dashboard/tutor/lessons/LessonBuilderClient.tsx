"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LessonPlanPreview from "@/components/lesson-plans/LessonPlanPreview";
import {
  EMPTY_LESSON_PLAN_VALUES,
  LESSON_PLAN_SECTION_LABELS,
  LESSON_PLAN_SECTION_ORDER,
  type LessonPlanFormValues,
  type LessonPlanMathExpression,
} from "@/lib/lesson-plans";

interface LessonRecord {
  id: string;
  title: string;
  description: string | null;
  order: number;
  plan: LessonPlanFormValues;
}

interface ModuleRecord {
  id: string;
  title: string;
  order: number;
  lessons: LessonRecord[];
}

interface CourseRecord {
  id: string;
  title: string;
  slug: string;
  modules: ModuleRecord[];
}

interface LessonBuilderClientProps {
  initialCourses: CourseRecord[];
  userRole: string;
}

interface BuilderFormState extends LessonPlanFormValues {
  lessonTitle: string;
  lessonDescription: string;
  lessonOrder: number;
}

function getNextLessonOrder(module?: ModuleRecord) {
  if (!module) {
    return 1;
  }

  return module.lessons.reduce((maxOrder, lesson) => Math.max(maxOrder, lesson.order), 0) + 1;
}

function createBlankForm(module?: ModuleRecord): BuilderFormState {
  return {
    ...EMPTY_LESSON_PLAN_VALUES,
    lessonTitle: "",
    lessonDescription: "",
    lessonOrder: getNextLessonOrder(module),
  };
}

function createFormFromLesson(lesson: LessonRecord): BuilderFormState {
  return {
    ...lesson.plan,
    estimatedDuration: lesson.plan.estimatedDuration ?? 60,
    lessonTitle: lesson.title,
    lessonDescription: lesson.description || "",
    lessonOrder: lesson.order,
  };
}

export default function LessonBuilderClient({
  initialCourses,
  userRole,
}: LessonBuilderClientProps) {
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourses[0]?.id || "");
  const [selectedModuleId, setSelectedModuleId] = useState(initialCourses[0]?.modules[0]?.id || "");
  const [useNewModule, setUseNewModule] = useState(initialCourses[0]?.modules.length === 0);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BuilderFormState>(() =>
    createBlankForm(initialCourses[0]?.modules[0])
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const currentCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const currentModule = useMemo(
    () =>
      currentCourse?.modules.find((module) => module.id === selectedModuleId) || null,
    [currentCourse, selectedModuleId]
  );

  const currentLessons = currentModule?.lessons || [];

  useEffect(() => {
    if (courses.length === 0 || selectedCourseId) {
      return;
    }

    setSelectedCourseId(courses[0].id);
    setSelectedModuleId(courses[0].modules[0]?.id || "");
    setUseNewModule(courses[0].modules.length === 0);
    setFormData(createBlankForm(courses[0].modules[0]));
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (!currentCourse) {
      return;
    }

    if (useNewModule) {
      return;
    }

    if (!selectedModuleId || !currentCourse.modules.some((module) => module.id === selectedModuleId)) {
      const firstModule = currentCourse.modules[0];
      setSelectedModuleId(firstModule?.id || "");
      setEditingLessonId(null);
      setFormData(createBlankForm(firstModule));
    }
  }, [currentCourse, selectedModuleId, useNewModule]);

  const handleCourseChange = (courseId: string) => {
    const course = courses.find((entry) => entry.id === courseId);
    const firstModule = course?.modules[0];

    setSelectedCourseId(courseId);
    setSelectedModuleId(firstModule?.id || "");
    setUseNewModule((course?.modules.length || 0) === 0);
    setNewModuleTitle("");
    setEditingLessonId(null);
    setFeedback(null);
    setFormData(createBlankForm(firstModule));
  };

  const handleModuleChange = (moduleId: string) => {
    const selectedModule = currentCourse?.modules.find((entry) => entry.id === moduleId);

    setSelectedModuleId(moduleId);
    setUseNewModule(false);
    setNewModuleTitle("");
    setEditingLessonId(null);
    setFeedback(null);
    setFormData(createBlankForm(selectedModule));
  };

  const handleNewLesson = () => {
    setEditingLessonId(null);
    setFeedback(null);
    setFormData(createBlankForm(currentModule || undefined));
  };

  const handleEditLesson = (lesson: LessonRecord) => {
    setUseNewModule(false);
    setEditingLessonId(lesson.id);
    setFeedback(null);
    setFormData(createFormFromLesson(lesson));
  };

  const handleSectionChange = (field: keyof BuilderFormState, value: string | number | null) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateMathExpression = (
    index: number,
    field: keyof LessonPlanMathExpression,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      mathExpressions: previous.mathExpressions.map((expression, expressionIndex) =>
        expressionIndex === index
          ? {
              ...expression,
              [field]: value,
            }
          : expression
      ),
    }));
  };

  const addMathExpression = () => {
    setFormData((previous) => ({
      ...previous,
      mathExpressions: [
        ...previous.mathExpressions,
        {
          id: `formula-${Date.now()}`,
          title: "",
          latex: "",
          notes: "",
        },
      ],
    }));
  };

  const removeMathExpression = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      mathExpressions: previous.mathExpressions.filter((_, expressionIndex) => expressionIndex !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!selectedCourseId) {
      setFeedback({ type: "error", message: "Select a course before saving the lesson." });
      return;
    }

    if (useNewModule && !newModuleTitle.trim()) {
      setFeedback({ type: "error", message: "Provide a title for the new module." });
      return;
    }

    if (!useNewModule && !selectedModuleId) {
      setFeedback({ type: "error", message: "Select a module before saving the lesson." });
      return;
    }

    if (!formData.lessonTitle.trim()) {
      setFeedback({ type: "error", message: "Lesson title is required." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/lesson-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          moduleId: useNewModule ? undefined : selectedModuleId,
          newModuleTitle: useNewModule ? newModuleTitle : undefined,
          lessonId: editingLessonId || undefined,
          lessonTitle: formData.lessonTitle,
          lessonDescription: formData.lessonDescription,
          lessonOrder: formData.lessonOrder,
          planType: formData.planType,
          estimatedDuration: formData.estimatedDuration,
          objectives: formData.objectives,
          overview: formData.overview,
          warmUp: formData.warmUp,
          directInstruction: formData.directInstruction,
          guidedPractice: formData.guidedPractice,
          independentPractice: formData.independentPractice,
          assessment: formData.assessment,
          homework: formData.homework,
          resources: formData.resources,
          teacherNotes: formData.teacherNotes,
          mathExpressions: formData.mathExpressions,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save lesson plan");
      }

      setUseNewModule(false);
      setSelectedModuleId(result.data.lesson.moduleId);
      setEditingLessonId(result.data.lesson.id);
      setFeedback({
        type: "success",
        message: editingLessonId ? "Lesson plan updated." : "Lesson plan created.",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save lesson plan",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const previewModuleTitle = useNewModule ? newModuleTitle : currentModule?.title;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lesson Builder</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
            Create full lesson plans for every lesson, then switch a lesson to{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Mathematics</span>{" "}
            whenever you need LaTeX formulas rendered with MathJax.
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
          Signed in as <span className="font-semibold">{userRole}</span>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No courses available</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Create a course first, then return here to add modules, lessons, and mathematics lesson plans.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Choose your scope</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Course
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(event) => handleCourseChange(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Module</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Use an existing module or create one on save.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={useNewModule}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setUseNewModule(checked);
                          setEditingLessonId(null);
                          setFeedback(null);
                          setFormData(createBlankForm(checked ? undefined : currentModule || undefined));
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Create new module
                    </label>
                  </div>

                  {useNewModule ? (
                    <input
                      type="text"
                      value={newModuleTitle}
                      onChange={(event) => setNewModuleTitle(event.target.value)}
                      placeholder="e.g. Algebra Foundations"
                      className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                  ) : (
                    <select
                      value={selectedModuleId}
                      onChange={(event) => handleModuleChange(event.target.value)}
                      className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    >
                      {currentCourse?.modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lessons in module</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pick a lesson to edit or start a new one.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNewLesson}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  New lesson
                </button>
              </div>

              {useNewModule ? (
                <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                  The new module will appear here after you save the first lesson.
                </p>
              ) : currentLessons.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                  No lessons in this module yet. Create the first one from the form.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {currentLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => handleEditLesson(lesson)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        editingLessonId === lesson.id
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
                          : "border-gray-200 bg-gray-50 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-gray-900 dark:text-white">{lesson.title}</p>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Lesson {lesson.order}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            lesson.plan.planType === "MATHEMATICS"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {lesson.plan.planType === "MATHEMATICS" ? "MathJax" : "Standard"}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {lesson.plan.objectives.length} objectives
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {lesson.plan.mathExpressions.length} formulas
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {editingLessonId ? "Edit lesson plan" : "Create lesson plan"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Author a structured lesson flow and switch on mathematics mode when the lesson needs LaTeX formulas.
                  </p>
                </div>
                {feedback ? (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm font-medium ${
                      feedback.type === "success"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {feedback.message}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Lesson title
                      </label>
                      <input
                        type="text"
                        value={formData.lessonTitle}
                        onChange={(event) => handleSectionChange("lessonTitle", event.target.value)}
                        placeholder="e.g. Solving linear equations"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Lesson order
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.lessonOrder}
                        onChange={(event) =>
                          handleSectionChange("lessonOrder", Number.parseInt(event.target.value, 10) || 1)
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lesson description
                    </label>
                    <textarea
                      value={formData.lessonDescription}
                      onChange={(event) => handleSectionChange("lessonDescription", event.target.value)}
                      rows={3}
                      placeholder="Brief summary of the lesson focus"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Lesson type
                      </label>
                      <select
                        value={formData.planType}
                        onChange={(event) =>
                          handleSectionChange(
                            "planType",
                            event.target.value === "MATHEMATICS" ? "MATHEMATICS" : "STANDARD"
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      >
                        <option value="STANDARD">Standard lesson</option>
                        <option value="MATHEMATICS">Mathematics lesson</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.estimatedDuration ?? 60}
                        onChange={(event) =>
                          handleSectionChange(
                            "estimatedDuration",
                            Number.parseInt(event.target.value, 10) || 60
                          )
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Learning objectives
                    </label>
                    <textarea
                      value={formData.objectives.join("\n")}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          objectives: event.target.value
                            .split("\n")
                            .map((entry) => entry.trim())
                            .filter(Boolean),
                        }))
                      }
                      rows={4}
                      placeholder={"One objective per line\nIdentify equivalent fractions\nExplain why denominators matter"}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                  </div>

                  {LESSON_PLAN_SECTION_ORDER.map((sectionKey) => (
                    <div key={sectionKey}>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {LESSON_PLAN_SECTION_LABELS[sectionKey]}
                      </label>
                      <textarea
                        value={formData[sectionKey]}
                        onChange={(event) => handleSectionChange(sectionKey, event.target.value)}
                        rows={sectionKey === "overview" ? 4 : 5}
                        placeholder={
                          formData.planType === "MATHEMATICS"
                            ? "You can type normal text and LaTeX, for example: Students simplify $\\frac{6}{8}$ to $\\frac{3}{4}$."
                            : "Describe this section of the lesson plan..."
                        }
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Internal teacher notes
                    </label>
                    <textarea
                      value={formData.teacherNotes}
                      onChange={(event) => handleSectionChange("teacherNotes", event.target.value)}
                      rows={4}
                      placeholder="Private teaching notes, interventions, or extension ideas"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-800 dark:bg-emerald-950/20">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mathematics formula bank</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          Add reusable formulas for mathematics lessons. They will preview with MathJax and appear on the lesson page.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addMathExpression}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Add formula
                      </button>
                    </div>

                    {formData.mathExpressions.length === 0 ? (
                      <p className="mt-4 rounded-xl border border-dashed border-emerald-300 p-4 text-sm text-emerald-900 dark:border-emerald-700 dark:text-emerald-200">
                        No formulas added yet. Use LaTeX such as <code>{"\\frac{a}{b}"}</code>, <code>{"x^2 + y^2 = r^2"}</code>, or <code>{"\\int_0^1 x^2\\,dx"}</code>.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {formData.mathExpressions.map((expression, index) => (
                          <div
                            key={expression.id}
                            className="rounded-xl border border-emerald-200 bg-white p-4 dark:border-emerald-800 dark:bg-gray-900"
                          >
                            <div className="grid gap-3">
                              <input
                                type="text"
                                value={expression.title}
                                onChange={(event) => updateMathExpression(index, "title", event.target.value)}
                                placeholder="Formula title"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                              <textarea
                                value={expression.latex}
                                onChange={(event) => updateMathExpression(index, "latex", event.target.value)}
                                rows={3}
                                placeholder={"\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                              <textarea
                                value={expression.notes || ""}
                                onChange={(event) => updateMathExpression(index, "notes", event.target.value)}
                                rows={2}
                                placeholder="Optional explanation for when to use this formula"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeMathExpression(index)}
                                className="text-xs font-semibold text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Remove formula
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSaving}
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {isSaving ? "Saving lesson plan..." : editingLessonId ? "Update lesson plan" : "Create lesson plan"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Live preview</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This preview uses the same MathJax rendering shown on lesson pages.
                </p>
              </div>

              <LessonPlanPreview
                lessonTitle={formData.lessonTitle || "Untitled lesson"}
                lessonDescription={formData.lessonDescription}
                moduleTitle={previewModuleTitle}
                plan={formData}
                showTeacherNotes={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
