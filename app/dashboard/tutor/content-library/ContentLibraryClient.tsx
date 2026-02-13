"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Exercise {
  id: string;
  title: string;
  exerciseType: string;
  instructions: string | null;
  maxScore: number;
  timeLimit: number | null;
  difficulty: string | null;
  sequenceOrder: number;
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

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface ContentLibraryClientProps {
  exercises: Exercise[];
  courses: Course[];
  students: Student[];
}

type ViewMode = "grid" | "list";

export default function ContentLibraryClient({
  exercises,
  courses,
  students,
}: ContentLibraryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch =
        searchTerm === "" ||
        exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.lesson.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCourse =
        selectedCourse === "all" ||
        exercise.lesson.module.course.id === selectedCourse;

      const matchesDifficulty =
        selectedDifficulty === "all" ||
        (exercise.difficulty?.toLowerCase() || "none") === selectedDifficulty;

      const matchesType =
        selectedType === "all" || exercise.exerciseType === selectedType;

      return matchesSearch && matchesCourse && matchesDifficulty && matchesType;
    });
  }, [exercises, searchTerm, selectedCourse, selectedDifficulty, selectedType]);

  // Get unique exercise types
  const exerciseTypes = useMemo(() => {
    const types = new Set(exercises.map((e) => e.exerciseType));
    return Array.from(types);
  }, [exercises]);

  const handlePreview = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const handleAssign = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowAssignModal(true);
    // Set default due date to 7 days from now
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    setDueDate(defaultDue.toISOString().split("T")[0]);
  };

  const handleAssignSubmit = async () => {
    if (!selectedExercise || !selectedStudent || !dueDate) {
      alert("Please select a student and due date");
      return;
    }

    setIsAssigning(true);

    try {
      const response = await fetch("/api/v1/homework", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          courseId: selectedExercise.lesson.module.course.id,
          exerciseId: selectedExercise.id,
          notes: assignmentNotes,
          dueDate: new Date(dueDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign exercise");
      }

      alert("Exercise assigned successfully!");
      setShowAssignModal(false);
      setSelectedStudent("");
      setAssignmentNotes("");
    } catch (error: any) {
      console.error("Error assigning exercise:", error);
      alert(error.message || "Failed to assign exercise");
    } finally {
      setIsAssigning(false);
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "challenge":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "☑️";
      case "FILL_IN_BLANK":
        return "📝";
      case "SHORT_ANSWER":
        return "✍️";
      case "LONG_ANSWER":
        return "📄";
      case "NUMERICAL":
        return "🔢";
      case "MATCHING":
        return "🔗";
      case "WORKSHEET":
        return "📋";
      default:
        return "📚";
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Content Library
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and assign exercises from your courses
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {exercises.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Exercises
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-3xl mb-2">📖</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {courses.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Courses
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {students.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Your Students
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {filteredExercises.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Filtered Results
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="challenge">Challenge</option>
              <option value="none">Not Set</option>
            </select>
          </div>

          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              {exerciseTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No exercises found
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{getTypeIcon(exercise.exerciseType)}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {exercise.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {exercise.lesson.module.course.title} • {exercise.lesson.title}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(
                      exercise.difficulty
                    )}`}
                  >
                    {exercise.difficulty || "Not Set"}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {exercise.exerciseType.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span>📊 {exercise.maxScore} pts</span>
                  {exercise.timeLimit && <span>⏱️ {exercise.timeLimit} min</span>}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(exercise)}
                    className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleAssign(exercise)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl">{getTypeIcon(exercise.exerciseType)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {exercise.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {exercise.lesson.module.course.title} • {exercise.lesson.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(
                          exercise.difficulty
                        )}`}
                      >
                        {exercise.difficulty || "Not Set"}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {exercise.maxScore} pts
                      </span>
                      {exercise.timeLimit && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {exercise.timeLimit} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handlePreview(exercise)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleAssign(exercise)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {selectedExercise && !showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedExercise.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedExercise.lesson.module.course.title} •{" "}
                    {selectedExercise.lesson.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${getDifficultyColor(
                    selectedExercise.difficulty
                  )}`}
                >
                  {selectedExercise.difficulty || "Not Set"}
                </span>
                <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {selectedExercise.exerciseType.replace(/_/g, " ")}
                </span>
                <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {selectedExercise.maxScore} points
                </span>
                {selectedExercise.timeLimit && (
                  <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    {selectedExercise.timeLimit} minutes
                  </span>
                )}
              </div>

              {selectedExercise.instructions && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Instructions
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedExercise.instructions}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    handleAssign(selectedExercise);
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign to Student
                </button>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Assign Exercise
              </h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Exercise
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedExercise.title}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Student *
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Choose a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Add any notes for the student..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAssignSubmit}
                  disabled={isAssigning}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssigning ? "Assigning..." : "Assign"}
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStudent("");
                    setAssignmentNotes("");
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  disabled={isAssigning}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
