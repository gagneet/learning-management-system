"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Exercise {
  id: string;
  title: string;
  exerciseType: string;
  maxScore: number;
  difficulty: string | null;
  lesson: {
    id: string;
    title: string;
    module: {
      course: {
        id: string;
        title: string;
      };
    };
  };
}

interface AssessmentWizardClientProps {
  students: Student[];
  courses: Course[];
  exercises: Exercise[];
  tutorId: string;
}

type AssessmentComponent = {
  name: string;
  label: string;
  description: string;
  selected: boolean;
};

export default function AssessmentWizardClient({
  students,
  courses,
  exercises,
  tutorId,
}: AssessmentWizardClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Student and Subject
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assessedGradeLevel, setAssessedGradeLevel] = useState(5);

  // Step 2: Assessment Components
  const [components, setComponents] = useState<AssessmentComponent[]>([
    {
      name: "reading",
      label: "Reading Age",
      description: "Assess reading comprehension and fluency",
      selected: true,
    },
    {
      name: "numeracy",
      label: "Numeracy Age",
      description: "Assess mathematical abilities",
      selected: true,
    },
    {
      name: "comprehension",
      label: "Comprehension Level",
      description: "Assess understanding and interpretation",
      selected: false,
    },
    {
      name: "writing",
      label: "Writing Level",
      description: "Assess written expression and grammar",
      selected: false,
    },
  ]);

  const [readingAge, setReadingAge] = useState(5);
  const [numeracyAge, setNumeracyAge] = useState(5);
  const [comprehensionLevel, setComprehensionLevel] = useState(3);
  const [writingLevel, setWritingLevel] = useState(3);

  // Step 3: Exercise Recommendations and Scheduling
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");

  const toggleComponent = (name: string) => {
    setComponents((prev) =>
      prev.map((comp) =>
        comp.name === name ? { ...comp, selected: !comp.selected } : comp
      )
    );
  };

  const getRecommendedExercises = () => {
    if (!selectedCourse) return [];

    // Filter exercises for selected course
    const courseExercises = exercises.filter(
      (ex) => ex.lesson.module.course.id === selectedCourse
    );

    // Sort by difficulty matching assessed grade level
    const sortedExercises = courseExercises.sort((a, b) => {
      const aDiff = getDifficultyScore(a.difficulty);
      const bDiff = getDifficultyScore(b.difficulty);
      const targetScore = Math.floor(assessedGradeLevel / 3); // Map grade to difficulty (1-4)

      return (
        Math.abs(aDiff - targetScore) - Math.abs(bDiff - targetScore)
      );
    });

    return sortedExercises.slice(0, 10); // Top 10 recommendations
  };

  const getDifficultyScore = (difficulty: string | null): number => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return 1;
      case "medium":
        return 2;
      case "hard":
        return 3;
      case "challenge":
        return 4;
      default:
        return 2; // Default to medium
    }
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const canProceedStep1 = selectedStudent && selectedCourse && assessedGradeLevel;
  const canProceedStep2 = components.some((c) => c.selected);

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedCourse) {
      alert("Please select a student and course");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the assessment
      const assessmentData: any = {
        courseId: selectedCourse,
        assessedGradeLevel,
        notes: assessmentNotes,
      };

      // Add component values if selected
      const readingComp = components.find((c) => c.name === "reading");
      const numeracyComp = components.find((c) => c.name === "numeracy");
      const comprehensionComp = components.find((c) => c.name === "comprehension");
      const writingComp = components.find((c) => c.name === "writing");

      if (readingComp?.selected) assessmentData.readingAge = readingAge;
      if (numeracyComp?.selected) assessmentData.numeracyAge = numeracyAge;
      if (comprehensionComp?.selected) assessmentData.comprehensionLevel = comprehensionLevel;
      if (writingComp?.selected) assessmentData.writingLevel = writingLevel;

      const assessmentResponse = await fetch(
        `/api/v1/students/${selectedStudent}/assessments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assessmentData),
        }
      );

      if (!assessmentResponse.ok) {
        const error = await assessmentResponse.json();
        throw new Error(error.error || "Failed to create assessment");
      }

      // Assign recommended exercises if any selected
      if (selectedExercises.length > 0 && scheduleDate) {
        for (const exerciseId of selectedExercises) {
          await fetch("/api/v1/homework", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              studentId: selectedStudent,
              courseId: selectedCourse,
              exerciseId,
              notes: "Assessment follow-up exercise",
              dueDate: new Date(scheduleDate).toISOString(),
            }),
          });
        }
      }

      alert("Assessment created successfully!");
      router.push(`/dashboard/tutor/students/${selectedStudent}`);
    } catch (error: any) {
      console.error("Error creating assessment:", error);
      alert(error.message || "Failed to create assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Select Student and Subject
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the student and subject area for this assessment
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Student *
        </label>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        >
          <option value="">Select a student...</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} ({student.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Subject / Course *
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        >
          <option value="">Select a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Assessed Grade Level: {assessedGradeLevel}
        </label>
        <input
          type="range"
          min="1"
          max="12"
          value={assessedGradeLevel}
          onChange={(e) => setAssessedGradeLevel(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>Grade 1</span>
          <span>Grade 6</span>
          <span>Grade 12</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Assessment Components
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select the components to assess and set their levels
        </p>
      </div>

      <div className="space-y-4">
        {components.map((component) => (
          <div
            key={component.name}
            className={`border-2 rounded-lg p-4 transition-all ${
              component.selected
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={component.selected}
                onChange={() => toggleComponent(component.name)}
                className="mt-1 w-5 h-5"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {component.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {component.description}
                </p>

                {component.selected && (
                  <div>
                    {component.name === "reading" && (
                      <>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reading Age: {readingAge}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          value={readingAge}
                          onChange={(e) => setReadingAge(Number(e.target.value))}
                          className="w-full"
                        />
                      </>
                    )}
                    {component.name === "numeracy" && (
                      <>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Numeracy Age: {numeracyAge}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          value={numeracyAge}
                          onChange={(e) => setNumeracyAge(Number(e.target.value))}
                          className="w-full"
                        />
                      </>
                    )}
                    {component.name === "comprehension" && (
                      <>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Comprehension Level: {comprehensionLevel}/5
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={comprehensionLevel}
                          onChange={(e) => setComprehensionLevel(Number(e.target.value))}
                          className="w-full"
                        />
                      </>
                    )}
                    {component.name === "writing" && (
                      <>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Writing Level: {writingLevel}/5
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={writingLevel}
                          onChange={(e) => setWritingLevel(Number(e.target.value))}
                          className="w-full"
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => {
    const recommendedExercises = getRecommendedExercises();

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Review and Schedule
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Review recommended exercises and schedule follow-up work
          </p>
        </div>

        {/* Assessment Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Assessment Summary
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>Student:</strong>{" "}
              {students.find((s) => s.id === selectedStudent)?.name}
            </p>
            <p>
              <strong>Subject:</strong>{" "}
              {courses.find((c) => c.id === selectedCourse)?.title}
            </p>
            <p>
              <strong>Grade Level:</strong> {assessedGradeLevel}
            </p>
            <div>
              <strong>Components:</strong>
              <ul className="ml-4 mt-1">
                {components
                  .filter((c) => c.selected)
                  .map((c) => (
                    <li key={c.name}>• {c.label}</li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assessment Notes
          </label>
          <textarea
            value={assessmentNotes}
            onChange={(e) => setAssessmentNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Add any notes about this assessment..."
          />
        </div>

        {/* Recommended Exercises */}
        {recommendedExercises.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Recommended Exercises ({recommendedExercises.length})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Based on the assessed level, these exercises are recommended for follow-up
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recommendedExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedExercises.includes(exercise.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                  onClick={() => toggleExercise(exercise.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedExercises.includes(exercise.id)}
                      onChange={() => toggleExercise(exercise.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {exercise.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {exercise.lesson.title} • {exercise.difficulty || "Medium"} •{" "}
                        {exercise.maxScore} pts
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Date */}
        {selectedExercises.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule Due Date for Exercises
            </label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Create Assessment
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Multi-step wizard to create a comprehensive student assessment
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step === currentStep
                    ? "bg-blue-600 text-white"
                    : step < currentStep
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {step < currentStep ? "✓" : step}
              </div>
              {step < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step < currentStep
                      ? "bg-green-600"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Student & Subject
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Components
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Review & Schedule
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              ← Previous
            </button>
          ) : (
            <Link
              href="/dashboard/tutor"
              className="inline-block px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </Link>
          )}
        </div>

        <div>
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={
                (currentStep === 1 && !canProceedStep1) ||
                (currentStep === 2 && !canProceedStep2)
              }
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Assessment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
