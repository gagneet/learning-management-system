"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarView from "@/components/dashboard/tutor/planner/CalendarView";
import SessionPlanningForm from "@/components/dashboard/tutor/planner/SessionPlanningForm";

interface SessionPlannerClientProps {
  initialSessions: any[];
  students: any[];
  courses: any[];
  exercises: any[];
  tutorId: string;
  tutorName: string;
}

export default function SessionPlannerClient({
  initialSessions,
  students,
  courses,
  exercises,
  tutorId,
  tutorName,
}: SessionPlannerClientProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPlanningForm, setShowPlanningForm] = useState(false);

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    // TODO: Fetch sessions for the new date range
  };

  const handleCreateSession = () => {
    setShowPlanningForm(true);
  };

  const handleSaveSession = async (data: any) => {
    try {
      // Calculate duration in minutes
      const startTime = new Date(`${data.date}T${data.startTime}:00`);
      const endTime = new Date(`${data.date}T${data.endTime}:00`);
      const duration = Math.round(
        (endTime.getTime() - startTime.getTime()) / 60000
      );

      // Create session via API
      const response = await fetch("/api/sessions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${courses.find((c) => c.id === data.courseId)?.title || "Session"} - ${data.sessionType}`,
          description: data.tutorNotes || "Planned session",
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration,
          sessionMode: "PHYSICAL",
          status: "SCHEDULED",
          studentIds: data.selectedStudentIds,
          courseId: data.courseId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const newSession = await response.json();

      // Create homework assignments for selected exercises if any
      if (data.selectedExercises && data.selectedExercises.length > 0) {
        for (const studentId of data.selectedStudentIds) {
          for (const exercise of data.selectedExercises) {
            await fetch("/api/v1/homework", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                studentId,
                courseId: data.courseId,
                exerciseId: exercise.id,
                dueDate: endTime.toISOString(),
                notes: `Assigned during ${data.sessionType} session`,
              }),
            });
          }
        }
      }

      // Close form and refresh
      setShowPlanningForm(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to save session:", error);
      throw error;
    }
  };

  const handleCancelPlanning = () => {
    setShowPlanningForm(false);
  };

  if (showPlanningForm) {
    return (
      <SessionPlanningForm
        students={students}
        courses={courses}
        exercises={exercises}
        onSave={handleSaveSession}
        onCancel={handleCancelPlanning}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-2xl font-bold text-blue-600"
              >
                LMS
              </Link>
              <span className="text-gray-400">›</span>
              <Link
                href="/dashboard/tutor/sessions"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                Sessions
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-600 dark:text-gray-300">Planner</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/tutor/sessions"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                ← Back to Sessions
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <CalendarView
          sessions={sessions}
          currentDate={currentDate}
          onDateChange={handleDateChange}
          onCreateSession={handleCreateSession}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">📅</div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sessions.filter((s) => s.status === "SCHEDULED").length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Upcoming Sessions
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">👥</div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {students.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Available Students
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">📚</div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {courses.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Your Courses
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Planning Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>
              • Plan sessions at least 24 hours in advance for better student
              preparation
            </li>
            <li>
              • Review student performance data before assigning exercises
            </li>
            <li>
              • Use templates to save time when planning similar sessions
            </li>
            <li>
              • Consider grouping students with similar learning levels for
              group sessions
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
