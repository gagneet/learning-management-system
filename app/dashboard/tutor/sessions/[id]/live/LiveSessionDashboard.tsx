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
  helpRequests: HelpRequest[];
  studentGoals: any[];
  assessments: any[];
  tutorNotes: any[];
  tutorId: string;
  tutorName: string;
}

export default function LiveSessionDashboard({
  session,
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
          if (sessionStatus === "LIVE" && Math.random() < 0.1) {
            const statuses = ["WORKING", "IDLE", "COMPLETED"] as const;
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            const newProgress = Math.min(100, student.progress + Math.floor(Math.random() * 10));

            return {
              ...student,
              status: randomStatus,
              progress: newProgress,
              currentExercise: student.currentExercise || "Fraction Problems",
            };
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
        // Mock data for timeline and content (replace with real data in production)
        sessionTimeline: [
          {
            time: new Date(),
            event: "Started working on Fraction Problems",
            type: "info" as const,
          },
        ],
        exerciseHistory: [],
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
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

      <main className="flex-1 pb-20 overflow-y-auto">
        <HelpRequestPanel
          requests={helpRequests}
          onAcknowledge={handleAcknowledgeRequest}
          onResolve={handleResolveRequest}
          onViewStudent={handleViewStudent}
        />

        <StudentGridView
          students={studentStatuses}
          onSelectStudent={handleViewStudent}
          selectedStudentId={selectedStudentId}
        />
      </main>

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
