"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  gradeLevel: string;
  recentPerformance?: {
    subject: string;
    score: number;
    trend: "up" | "down" | "stable";
  }[];
  currentGoals?: {
    id: string;
    goalText: string;
    progress: number;
  }[];
  lastSessionNote?: string;
}

interface Exercise {
  id: string;
  title: string;
  type: string;
  difficulty: number;
  estimatedTime: number;
  isRecommended?: boolean;
}

interface ActivityBlock {
  id: string;
  startMinute: number;
  duration: number;
  type: "WARMUP" | "MAIN" | "PRACTICE" | "WRAPUP";
  title: string;
  description: string;
  studentIds: string[];
  exerciseIds: string[];
}

interface SessionPlanningFormProps {
  students: Student[];
  courses: { id: string; title: string }[];
  exercises: Exercise[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: any;
}

export default function SessionPlanningForm({
  students,
  courses,
  exercises,
  onSave,
  onCancel,
  initialData,
}: SessionPlanningFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    date: initialData?.date || new Date().toISOString().split("T")[0],
    startTime: initialData?.startTime || "14:00",
    endTime: initialData?.endTime || "15:00",
    sessionType: initialData?.sessionType || "GROUP",
    courseId: initialData?.courseId || "",
    templateId: initialData?.templateId || "",

    // Step 2: Student Selection
    selectedStudentIds: initialData?.selectedStudentIds || [],

    // Step 3: Content Planning
    selectedExercises: initialData?.selectedExercises || [],

    // Step 4: Session Structure
    activityBlocks: initialData?.activityBlocks || [],

    // Step 5: Resources
    digitalResources: initialData?.digitalResources || [],
    physicalResources: initialData?.physicalResources || [],
    setupNotes: initialData?.setupNotes || "",

    // Step 6: Objectives
    objectives: initialData?.objectives || {},
    tutorNotes: initialData?.tutorNotes || "",
    contingencyPlans: initialData?.contingencyPlans || "",
  });

  const totalSteps = 6;
  const duration =
    formData.startTime && formData.endTime
      ? (new Date(`2000-01-01T${formData.endTime}:00`).getTime() -
          new Date(`2000-01-01T${formData.startTime}:00`).getTime()) /
        60000
      : 60;

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Failed to save session:", error);
      alert("Failed to save session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    const selected = formData.selectedStudentIds;
    if (selected.includes(studentId)) {
      updateFormData(
        "selectedStudentIds",
        selected.filter((id: string) => id !== studentId)
      );
    } else {
      updateFormData("selectedStudentIds", [...selected, studentId]);
    }
  };

  const addExercise = (exercise: Exercise) => {
    updateFormData("selectedExercises", [
      ...formData.selectedExercises,
      exercise,
    ]);
  };

  const removeExercise = (exerciseId: string) => {
    updateFormData(
      "selectedExercises",
      formData.selectedExercises.filter((e: Exercise) => e.id !== exerciseId)
    );
  };

  const getRecommendedExercises = () => {
    if (formData.selectedStudentIds.length === 0) return [];

    const selectedStudents = students.filter(s => formData.selectedStudentIds.includes(s.id));

    // Rule-based recommendation
    return exercises.filter(ex => {
      // 1. Basic subject/course matching
      // (In a real app, exercises would be filtered by courseId from props)

      // 2. Performance based rules
      const studentPerformances = selectedStudents.flatMap(s => s.recentPerformance || []);
      const avgScore = studentPerformances.length > 0
        ? studentPerformances.reduce((acc, p) => acc + p.score, 0) / studentPerformances.length
        : 70;

      if (avgScore < 50) return ex.difficulty <= 1; // Needs foundation
      if (avgScore > 85) return ex.difficulty >= 3; // Needs challenge
      return ex.difficulty >= 1 && ex.difficulty <= 3; // Standard
    }).slice(0, 4);
  };

  const addActivityBlock = () => {
    const newBlock: ActivityBlock = {
      id: Math.random().toString(36).substr(2, 9),
      startMinute: formData.activityBlocks.length * 15,
      duration: 15,
      type: "MAIN",
      title: "New Activity",
      description: "",
      studentIds: [...formData.selectedStudentIds],
      exerciseIds: [],
    };
    updateFormData("activityBlocks", [...formData.activityBlocks, newBlock]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              New Session Plan
            </h1>
            <button
              onClick={onCancel}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    step <= currentStep
                      ? "bg-blue-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                ></div>
                <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">
                  Step {step}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                📅 Session Details
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateFormData("date", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration: {duration} minutes
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        updateFormData("startTime", e.target.value)
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="flex items-center text-gray-600 dark:text-gray-400">
                      -
                    </span>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        updateFormData("endTime", e.target.value)
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Type
                </label>
                <div className="space-y-2">
                  {[
                    { value: "INDIVIDUAL", label: "Individual (1-on-1)" },
                    { value: "GROUP", label: "Group (2-10 students)" },
                    { value: "WORKSHOP", label: "Workshop (10+ students)" },
                  ].map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="radio"
                        name="sessionType"
                        value={type.value}
                        checked={formData.sessionType === type.value}
                        onChange={(e) =>
                          updateFormData("sessionType", e.target.value)
                        }
                        className="text-blue-600"
                      />
                      <span className="text-gray-900 dark:text-white">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course/Subject
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => updateFormData("courseId", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Student Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                👥 Select Students ({formData.selectedStudentIds.length}{" "}
                selected)
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {students.map((student) => {
                  const isSelected = formData.selectedStudentIds.includes(
                    student.id
                  );
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="mt-1 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {student.gradeLevel}
                          </div>
                        </div>
                      </div>

                      {student.recentPerformance &&
                        student.recentPerformance.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Recent Performance:
                            </div>
                            {student.recentPerformance
                              .slice(0, 2)
                              .map((perf, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-gray-600 dark:text-gray-400"
                                >
                                  • {perf.subject}: {perf.score}%{" "}
                                  {perf.trend === "up" && "↑"}
                                  {perf.trend === "down" && "↓"}
                                </div>
                              ))}
                          </div>
                        )}

                      {student.currentGoals && student.currentGoals.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Current Goals:
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {student.currentGoals[0].goalText} (
                            {student.currentGoals[0].progress}%)
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {formData.selectedStudentIds.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Please select at least one student
                </div>
              )}
            </div>
          )}

          {/* Step 3: Content Planning */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                📚 Plan Content
              </h2>

              {/* AI Recommendations */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  💡 Recommended Exercises
                </h3>
                <div className="space-y-2">
                  {exercises
                    .filter((e) => e.isRecommended)
                    .slice(0, 3)
                    .map((exercise) => (
                      <div
                        key={exercise.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            ⭐ {exercise.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {exercise.type} • {"★".repeat(exercise.difficulty)}{" "}
                            • ~{exercise.estimatedTime} min
                          </div>
                        </div>
                        <button
                          onClick={() => addExercise(exercise)}
                          disabled={formData.selectedExercises.some(
                            (e: Exercise) => e.id === exercise.id
                          )}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Selected Exercises */}
              {formData.selectedExercises.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    ✅ Selected Exercises ({formData.selectedExercises.length})
                  </h3>
                  <div className="space-y-2">
                    {formData.selectedExercises.map(
                      (exercise: Exercise, index: number) => (
                        <div
                          key={exercise.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 dark:text-gray-400">
                              {index + 1}.
                            </span>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {exercise.title}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {exercise.estimatedTime} min •{" "}
                                {"★".repeat(exercise.difficulty)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeExercise(exercise.id)}
                            className="text-red-600 hover:text-red-700 font-medium"
                          >
                            ❌
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Session Structure */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  🕒 Session Structure
                </h2>
                <button
                  onClick={addActivityBlock}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  + Add Block
                </button>
              </div>

              <div className="space-y-4">
                {formData.activityBlocks.map((block: ActivityBlock, idx: number) => (
                  <div key={block.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                        <select
                          value={block.type}
                          onChange={(e) => {
                            const newBlocks = [...formData.activityBlocks];
                            newBlocks[idx].type = e.target.value as any;
                            updateFormData("activityBlocks", newBlocks);
                          }}
                          className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                        >
                          <option value="WARMUP">Warm-up</option>
                          <option value="MAIN">Main Activity</option>
                          <option value="PRACTICE">Independent Practice</option>
                          <option value="WRAPUP">Wrap-up</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (min)</label>
                        <input
                          type="number"
                          value={block.duration}
                          onChange={(e) => {
                            const newBlocks = [...formData.activityBlocks];
                            newBlocks[idx].duration = parseInt(e.target.value);
                            updateFormData("activityBlocks", newBlocks);
                          }}
                          className="w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            const newBlocks = formData.activityBlocks.filter((_: any, i: number) => i !== idx);
                            updateFormData("activityBlocks", newBlocks);
                          }}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Remove Block
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Activity Title"
                      value={block.title}
                      onChange={(e) => {
                        const newBlocks = [...formData.activityBlocks];
                        newBlocks[idx].title = e.target.value;
                        updateFormData("activityBlocks", newBlocks);
                      }}
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm mb-2 font-semibold"
                    />
                    <textarea
                      placeholder="Instructions/Description"
                      value={block.description}
                      onChange={(e) => {
                        const newBlocks = [...formData.activityBlocks];
                        newBlocks[idx].description = e.target.value;
                        updateFormData("activityBlocks", newBlocks);
                      }}
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-20"
                    />
                  </div>
                ))}

                {formData.activityBlocks.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    <p className="text-gray-500">No activity blocks defined yet. Add blocks to structure your session.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Resources */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🛠️ Resources & Setup
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Physical Resources</h3>
                  <textarea
                    value={formData.setupNotes}
                    onChange={(e) => updateFormData("setupNotes", e.target.value)}
                    placeholder="e.g., Print worksheet page 4, prepare math counters, bring world map..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-40"
                  />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">Included Exercises</h3>
                  <div className="space-y-2">
                    {formData.selectedExercises.map((ex: Exercise) => (
                      <div key={ex.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        {ex.title}
                      </div>
                    ))}
                    {formData.selectedExercises.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No exercises selected in Step 3.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Objectives & Finalize */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🎯 Goals & Contingencies
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Objectives</label>
                  <textarea
                    value={formData.objectives.main || ""}
                    onChange={(e) => updateFormData("objectives", { ...formData.objectives, main: e.target.value })}
                    placeholder="What should students achieve by the end of this session?"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Tutor Notes</label>
                  <textarea
                    value={formData.tutorNotes}
                    onChange={(e) => updateFormData("tutorNotes", e.target.value)}
                    placeholder="Private notes for yourself or other tutors..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contingency Plans</label>
                  <textarea
                    value={formData.contingencyPlans}
                    onChange={(e) => updateFormData("contingencyPlans", e.target.value)}
                    placeholder="e.g., If Student A finishes early, give them challenge exercise X..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-24"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-900 font-medium rounded-lg transition-colors"
          >
            ← Back
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Step {currentStep} of {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !formData.courseId) ||
                (currentStep === 2 &&
                  formData.selectedStudentIds.length === 0)
              }
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? "Saving..." : "Schedule Session ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
