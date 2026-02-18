"use client";

import { useState, useEffect } from "react";
import MultiStudentVideoGrid from "@/components/video/MultiStudentVideoGrid";

interface Student {
  id: string;
  name: string;
  email: string;
  gradeLevel: string;
  enrollmentId: string;
  courseTitle: string;
  currentExercise?: string;
  progress: number;
  status: "WORKING" | "WAITING_HELP" | "COMPLETED" | "IDLE" | "NOT_STARTED";
  sessionTime: number; // seconds
  totalTime: number; // seconds
}

interface MultiStudentSessionPageProps {
  session: {
    id: string;
    title: string;
    status: string;
    startTime: Date;
    duration: number;
    videoRoomUrl?: string;
    videoRoomId?: string;
    students: Student[];
  };
  videoToken: string;
  isTutor: boolean;
  tutorName: string;
}

export default function MultiStudentSessionPage({
  session,
  videoToken,
  isTutor,
  tutorName,
}: MultiStudentSessionPageProps) {
  const [students, setStudents] = useState<Student[]>(session.students);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mode, setMode] = useState<Record<string, "TEACH" | "OBSERVE">>({});

  // Initialize modes
  useEffect(() => {
    const initialModes: Record<string, "TEACH" | "OBSERVE"> = {};
    session.students.forEach((student) => {
      initialModes[student.id] = "TEACH";
    });
    setMode(initialModes); // eslint-disable-line react-hooks/set-state-in-effect
  }, [session.students]);

  const handleParticipantUpdate = (participants: any[]) => {
    // Update student session times based on video participant data
    setStudents((prev) =>
      prev.map((student) => {
        const participant = participants.find((p) => p.userId === student.id);
        if (participant) {
          return {
            ...student,
            sessionTime: participant.sessionTime,
            totalTime: participant.totalTime,
          };
        }
        return student;
      })
    );
  };

  const toggleMode = (studentId: string) => {
    setMode((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "TEACH" ? "OBSERVE" : "TEACH",
    }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: Student["status"]) => {
    switch (status) {
      case "WORKING":
        return "bg-green-100 text-green-800 border-green-300";
      case "WAITING_HELP":
        return "bg-red-100 text-red-800 border-red-300";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "IDLE":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (!session.videoRoomUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-xl font-semibold text-gray-800 mb-4">
            Video room not yet created
          </p>
          <p className="text-gray-600">
            Please wait for the tutor to start the session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-[1920px] mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>Tutor: {tutorName}</span>
            <span>•</span>
            <span>
              {new Date(session.startTime).toLocaleDateString()} at{" "}
              {new Date(session.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>•</span>
            <span>{students.length} Students</span>
            <span>•</span>
            <span className={`px-2 py-1 rounded ${
              session.status === "LIVE" ? "bg-green-100 text-green-800" : 
              session.status === "SCHEDULED" ? "bg-blue-100 text-blue-800" : 
              "bg-gray-100 text-gray-800"
            }`}>
              {session.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Two-Panel Layout */}
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* LEFT PANEL: Video Grid */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Video Screens
            </h2>
            <div className="flex-1 min-h-0">
              <MultiStudentVideoGrid
                sessionId={session.id}
                videoToken={videoToken}
                roomUrl={session.videoRoomUrl}
                isTutor={isTutor}
                students={students.map((s) => ({
                  id: s.id,
                  name: s.name,
                  enrollmentId: s.enrollmentId,
                }))}
                onParticipantUpdate={handleParticipantUpdate}
              />
            </div>
          </div>

          {/* RIGHT PANEL: Student Columns */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Student Information
            </h2>
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`flex-shrink-0 w-64 border-2 rounded-lg p-4 ${
                      selectedStudentId === student.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    } cursor-pointer hover:border-blue-300 transition-colors`}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    {/* Student Header */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-600">{student.gradeLevel}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {student.courseTitle}
                      </p>
                    </div>

                    {/* Time Tracking */}
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Session Time:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          {formatTime(student.sessionTime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Time:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          {formatTime(student.totalTime)}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mb-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          student.status
                        )}`}
                      >
                        {student.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Mode Toggle (Tutor Only) */}
                    {isTutor && (
                      <div className="mb-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMode(student.id);
                            }}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                              mode[student.id] === "TEACH"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            Teach
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMode(student.id);
                            }}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                              mode[student.id] === "OBSERVE"
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            Observe
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Current Exercise */}
                    {student.currentExercise && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-1">Current Exercise:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {student.currentExercise}
                        </p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{student.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions (Tutor Only) */}
                    {isTutor && (
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle assign exercise
                          }}
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
                        >
                          Assign
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle send message
                          }}
                          className="flex-1 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium transition-colors"
                        >
                          Message
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll Hint */}
            {students.length > 3 && (
              <div className="text-center text-xs text-gray-500 mt-2">
                ← Scroll to see more students →
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
