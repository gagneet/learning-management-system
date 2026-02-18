"use client";

import { useState, useEffect } from "react";
import SessionHeader from "@/components/dashboard/tutor/session/SessionHeader";
import HelpRequestPanel from "@/components/dashboard/tutor/session/HelpRequestPanel";
import StudentGridView from "@/components/dashboard/tutor/session/StudentGridView";
import StudentDetailSidebar from "@/components/dashboard/tutor/session/StudentDetailSidebar";
import SessionActionBar from "@/components/dashboard/tutor/session/SessionActionBar";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  email: string;
  gradeLevel: string;
  enrollmentId: string;
  courseTitle: string;
  academicProfile?: any;
}

interface HelpRequest {
  id: string;
  studentId: string;
  studentName: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  exerciseTitle?: string;
  timestamp: Date;
  status: "PENDING" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED";
}

interface StudentStatusState {
  id: string;
  name: string;
  gradeLevel: string;
  currentExercise?: string;
  status: "WORKING" | "WAITING_HELP" | "COMPLETED" | "IDLE" | "NOT_STARTED";
  progress: number;
  activeMs: number;
  lastActiveAt?: Date;
}

interface LiveSessionDashboardProps {
  session: {
    id: string;
    title: string;
    status: string;
    startTime: Date;
    duration: number;
    students: Student[];
  };
  exerciseAttempts: any[];
  helpRequests: HelpRequest[];
  studentGoals: any[];
  assessments: any[];
  tutorNotes: any[];
  tutorId: string;
  tutorName: string;
}

export default function LiveSessionDashboard({
  session,
  exerciseAttempts,
  helpRequests: initialHelpRequests,
  studentGoals,
  assessments,
  tutorNotes,
  tutorId,
  tutorName,
}: LiveSessionDashboardProps) {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState(session.status);
  const [helpRequests, setHelpRequests] = useState(initialHelpRequests);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentStatuses, setStudentStatuses] = useState<StudentStatusState[]>(
    session.students.map((student) => ({
      id: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      currentExercise: undefined,
      status: "NOT_STARTED" as const,
      progress: 0,
      activeMs: student.academicProfile?.activeMs || 0, // Fallback or from session
      lastActiveAt: undefined,
    }))
  );

  // Simulate real-time updates (in production, use WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate student progress updates
      setStudentStatuses((prev) =>
        prev.map((student) => {
          const hasHelpRequest = helpRequests.some(
            (req) => req.studentId === student.id && req.status === "PENDING"
          );

          if (hasHelpRequest && student.status !== "WAITING_HELP") {
            return { ...student, status: "WAITING_HELP" as const };
          }

          // Random status simulation for demo (remove in production)
          if (sessionStatus === "LIVE") {
            let updatedStudent = { ...student };

            // Increment active time if student is working
            if (student.status === "WORKING") {
              updatedStudent.activeMs += 5000;
            }

            if (Math.random() < 0.1) {
              const statuses = ["WORKING", "IDLE", "COMPLETED"] as const;
              const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
              const newProgress = Math.min(100, student.progress + Math.floor(Math.random() * 10));

              updatedStudent = {
                ...updatedStudent,
                status: randomStatus,
                progress: newProgress,
                currentExercise: student.currentExercise || "Fraction Problems",
              };
            }
            return updatedStudent;
          }

          return student;
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [helpRequests, sessionStatus]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setSessionStatus(newStatus);

        if (newStatus === "COMPLETED") {
          // Redirect to session detail page
          router.push(`/dashboard/tutor/sessions/${session.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to update session status:", error);
    }
  };

  const handleAcknowledgeRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/v1/help-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACKNOWLEDGED" }),
      });

      if (response.ok) {
        setHelpRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: "ACKNOWLEDGED" as const } : req
          )
        );
      }
    } catch (error) {
      console.error("Failed to acknowledge request:", error);
    }
  };

  const handleResolveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/v1/help-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          responseText: "Issue resolved during session",
        }),
      });

      if (response.ok) {
        setHelpRequests((prev) =>
          prev.filter((req) => req.id !== requestId)
        );

        // Update student status
        const request = helpRequests.find((req) => req.id === requestId);
        if (request) {
          setStudentStatuses((prev) =>
            prev.map((student) =>
              student.id === request.studentId && student.status === "WAITING_HELP"
                ? { ...student, status: "WORKING" as const }
                : student
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to resolve request:", error);
    }
  };

  const handleViewStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  const handleAddNote = async (content: string, visibility: "INTERNAL" | "EXTERNAL") => {
    if (!selectedStudentId) return;

    try {
      const enrollment = session.students.find((s) => s.id === selectedStudentId);
      if (!enrollment) return;

      const response = await fetch("/api/v1/tutor-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enrollment.enrollmentId,
          content,
          visibility,
        }),
      });

      if (response.ok) {
        // Refresh page to show new note
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  const handleAssignContent = async (contentId: string) => {
    if (!selectedStudentId) return;

    try {
      const enrollment = session.students.find((s) => s.id === selectedStudentId);
      if (!enrollment) return;

      // Assign exercise via homework API
      const response = await fetch("/api/v1/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          sessionEnrollmentId: enrollment.enrollmentId,
          exerciseId: contentId,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
        }),
      });

      if (response.ok) {
        alert("Content assigned successfully!");
      }
    } catch (error) {
      console.error("Failed to assign content:", error);
    }
  };

  const handleGenerateReport = () => {
    // Navigate to session report page (to be implemented)
    router.push(`/dashboard/tutor/sessions/${session.id}/report`);
  };

  const handleMarkAttendance = () => {
    // Navigate to attendance marking page (to be implemented)
    router.push(`/dashboard/tutor/sessions/${session.id}/attendance`);
  };

  const handleBroadcast = () => {
    // Open broadcast modal (to be implemented)
    alert("Broadcast feature coming soon!");
  };

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this session?")) {
      handleStatusChange("COMPLETED");
    }
  };

  const selectedStudent = selectedStudentId
    ? session.students.find((s) => s.id === selectedStudentId)
    : null;

  const selectedStudentDetail = selectedStudent
    ? {
        id: selectedStudent.id,
        name: selectedStudent.name,
        gradeLevel: selectedStudent.gradeLevel,
        academicProfile: selectedStudent.academicProfile,
        currentGoals: studentGoals.filter((g) => g.studentId === selectedStudent.id),
        assessments: assessments.filter((a) => a.studentId === selectedStudent.id),
        notes: tutorNotes,
        exerciseHistory: exerciseAttempts.filter((a) => a.studentId === selectedStudent.id),
        // Mock data for timeline and content (replace with real data in production)
        sessionTimeline: [
          {
            time: new Date(),
            event: "Started working on Fraction Problems",
            type: "info" as const,
          },
        ],
        nextContent: [
          {
            id: "demo-1",
            title: "Advanced Fraction Word Problems",
            type: "Exercise",
            difficulty: 3,
            estimatedTime: 25,
          },
        ],
      }
    : null;

  const activeStudentsCount = studentStatuses.filter(
    (s) => s.status === "WORKING" || s.status === "WAITING_HELP"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col h-screen overflow-hidden">
      <SessionHeader
        sessionId={session.id}
        title={session.title}
        status={sessionStatus}
        startTime={session.startTime}
        duration={session.duration}
        activeStudentsCount={activeStudentsCount}
        totalStudentsCount={session.students.length}
        onStatusChange={handleStatusChange}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Center Area: Video Grid & Student Columns */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700">
          {/* Top: Video Grid Placeholder (Phase 2A) */}
          <div className="h-48 bg-gray-200 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 p-4">
            <div className="flex gap-4 h-full overflow-x-auto">
              {session.students.map((student) => (
                <div key={student.id} className="aspect-video h-full bg-gray-900 rounded-lg flex items-center justify-center border-2 border-gray-700 relative overflow-hidden group">
                  <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded absolute bottom-2 left-2">
                    {student.name}
                  </span>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xl font-bold">
                    {student.name[0]}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  {/* Timer placeholder */}
                  <div className="absolute bottom-2 right-2 text-[10px] text-gray-400">
                    00:45:12
                  </div>
                </div>
              ))}
              <button className="aspect-video h-full border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                + Add Student
              </button>
            </div>
          </div>

          {/* Bottom: Student Work Columns */}
          <div className="flex-1 overflow-x-auto bg-gray-100 dark:bg-gray-900">
            <div className="h-full inline-flex min-w-full p-4 gap-4">
              {studentStatuses.map((student) => (
                <div key={student.id}
                  className={`w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 flex flex-col transition-all ${
                    selectedStudentId === student.id ? "border-blue-500 ring-2 ring-blue-500/20" : "border-transparent"
                  }`}
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{student.name}</h3>
                      <p className="text-xs text-gray-500">{student.gradeLevel}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      student.status === "WORKING" ? "bg-blue-100 text-blue-700" :
                      student.status === "WAITING_HELP" ? "bg-red-100 text-red-700" :
                      student.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {student.status}
                    </span>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-500 uppercase font-bold tracking-wider">Progress</span>
                        <span className="text-blue-600 font-bold">{student.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${student.progress}%` }}></div>
                      </div>
                    </div>

                    {/* Time Tracking */}
                    <div className="flex gap-2">
                      <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-100 dark:border-blue-800">
                        <div className="text-[9px] text-blue-600 dark:text-blue-400 uppercase font-bold">Time Online</div>
                        <div className="text-sm font-mono font-bold dark:text-gray-200">
                          {Math.floor(student.activeMs / 60000)}m {Math.floor((student.activeMs % 60000) / 1000)}s
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-100 dark:border-gray-700">
                        <div className="text-[9px] text-gray-400 uppercase font-bold">Last Active</div>
                        <div className="text-xs font-medium dark:text-gray-200">
                          {student.status === "IDLE" ? "Inactive" : "Just now"}
                        </div>
                      </div>
                    </div>

                    {/* Current Activity */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <div className="text-[10px] text-gray-400 uppercase font-bold mb-2">Currently Working On</div>
                      <div className="text-sm font-medium dark:text-gray-200">
                        {student.currentExercise || "No active exercise"}
                      </div>
                    </div>

                    {/* Whiteboard / Canvas Mini-Preview Placeholder */}
                    <div className="aspect-square bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center flex-col gap-2 group cursor-pointer hover:bg-gray-100">
                      <div className="text-2xl opacity-20 group-hover:opacity-100 transition-opacity">🎨</div>
                      <button
                        onClick={() => handleViewStudent(student.id)}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        VIEW WHITEBOARD
                      </button>
                    </div>
                  </div>

                  <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl flex gap-2">
                    <button className="flex-1 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-bold hover:bg-gray-50">TEACH</button>
                    <button className="flex-1 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-bold hover:bg-gray-50">OBSERVE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar: Help Requests & Activities */}
        <aside className="w-80 bg-white dark:bg-gray-800 flex flex-col shadow-xl">
          <div className="flex-1 flex flex-col overflow-hidden">
            <HelpRequestPanel
              requests={helpRequests}
              onAcknowledge={handleAcknowledgeRequest}
              onResolve={handleResolveRequest}
              onViewStudent={handleViewStudent}
            />

            {/* Activity Feed */}
            <div className="flex-1 flex flex-col overflow-hidden border-t border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Session Activity</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {session.students.map((student, idx) => (
                  <div key={student.id} className="flex gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      {student.name[0]}
                    </div>
                    <div>
                      <span className="font-bold dark:text-gray-200">{student.name}</span>
                      <span className="text-gray-500 ml-1">
                        {idx === 0 ? "joined the session" : idx === 1 ? "started Reading Exercise 4" : "completed quiz"}
                      </span>
                      <div className="text-[10px] text-gray-400 mt-0.5">2m ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {selectedStudentDetail && (
        <StudentDetailSidebar
          student={selectedStudentDetail}
          onClose={() => setSelectedStudentId(null)}
          onAddNote={handleAddNote}
          onAssignContent={handleAssignContent}
        />
      )}

      <SessionActionBar
        sessionId={session.id}
        onGenerateReport={handleGenerateReport}
        onMarkAttendance={handleMarkAttendance}
        onBroadcast={handleBroadcast}
        onEndSession={handleEndSession}
      />
    </div>
  );
}
