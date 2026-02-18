"use client";

import { useState } from "react";

interface StudentDetail {
  id: string;
  name: string;
  gradeLevel: string;
  avatar?: string;
  // Profile Tab
  academicProfile?: {
    readingAge: number;
    numeracyAge: number;
    comprehensionIndex: number;
    writingProficiency: string;
  };
  currentGoals?: Array<{
    id: string;
    goalText: string;
    progress: number;
    isAchieved: boolean;
  }>;
  assessments?: Array<{
    subject: string;
    score: number;
    date: Date;
  }>;
  // Activity Tab
  sessionTimeline?: Array<{
    time: Date;
    event: string;
    type: "info" | "warning" | "success";
  }>;
  exerciseHistory?: Array<{
    id: string;
    title: string;
    completedAt: Date;
    score: number;
    timeSpent: number;
    questionTimes?: Array<{
      questionIndex: number;
      timeSpentSeconds: number;
    }>;
  }>;
  // Content Tab
  nextContent?: Array<{
    id: string;
    title: string;
    type: string;
    difficulty: number;
    estimatedTime: number;
  }>;
  // Notes Tab
  notes?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    createdBy: string;
    visibility: "INTERNAL" | "EXTERNAL";
  }>;
}

interface StudentDetailSidebarProps {
  student: StudentDetail | null;
  onClose: () => void;
  onAddNote: (content: string, visibility: "INTERNAL" | "EXTERNAL") => void;
  onAssignContent: (contentId: string) => void;
}

export default function StudentDetailSidebar({
  student,
  onClose,
  onAddNote,
  onAssignContent,
}: StudentDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "activity" | "content" | "notes">("profile");
  const [noteContent, setNoteContent] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<"INTERNAL" | "EXTERNAL">("INTERNAL");

  if (!student) {
    return null;
  }

  const tabs = [
    { id: "profile", label: "📊 Profile", icon: "📊" },
    { id: "activity", label: "⚡ Activity", icon: "⚡" },
    { id: "content", label: "📚 Content", icon: "📚" },
    { id: "notes", label: "📝 Notes", icon: "📝" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSaveNote = () => {
    if (noteContent.trim()) {
      onAddNote(noteContent, noteVisibility);
      setNoteContent("");
      setNoteVisibility("INTERNAL");
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(student.name)
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                {student.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {student.gradeLevel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors
                ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Academic Profile */}
            {student.academicProfile && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Academic Profile
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Reading Age</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {student.academicProfile.readingAge} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Numeracy Age</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {student.academicProfile.numeracyAge} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Comprehension</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {student.academicProfile.comprehensionIndex}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Writing</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {student.academicProfile.writingProficiency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Goals */}
            {student.currentGoals && student.currentGoals.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Current Goals ({student.currentGoals.filter(g => g.isAchieved).length}/{student.currentGoals.length})
                </h3>
                <div className="space-y-3">
                  {student.currentGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {goal.isAchieved ? "✅" : "○"}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {goal.goalText}
                          </p>
                          {!goal.isAchieved && (
                            <div className="mt-2">
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600"
                                  style={{ width: `${goal.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {goal.progress}% complete
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Assessments */}
            {student.assessments && student.assessments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Recent Assessments
                </h3>
                <div className="space-y-2">
                  {student.assessments.slice(0, 5).map((assessment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {assessment.subject}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {assessment.score}%
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(assessment.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            {/* Session Timeline */}
            {student.sessionTimeline && student.sessionTimeline.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Session Timeline
                </h3>
                <div className="space-y-3">
                  {student.sessionTimeline.map((event, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            event.type === "success"
                              ? "bg-green-500"
                              : event.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                        ></div>
                        {idx < student.sessionTimeline!.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(event.time).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {event.event}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exercise History & Time Analysis */}
            {student.exerciseHistory && student.exerciseHistory.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Activity Time Analysis
                </h3>
                <div className="space-y-4">
                  {student.exerciseHistory.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {exercise.title}
                        </span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {exercise.score}%
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span>⏱️ Total: {Math.round(exercise.timeSpent / 60)}m {exercise.timeSpent % 60}s</span>
                        <span>📅 {new Date(exercise.completedAt).toLocaleTimeString()}</span>
                      </div>

                      {/* Granular Question Times */}
                      {exercise.questionTimes && exercise.questionTimes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Time Per Question</p>
                          <div className="grid grid-cols-5 gap-1">
                            {exercise.questionTimes.map((qt, idx) => (
                              <div key={idx} className="text-center">
                                <div className="text-[9px] text-gray-500 mb-0.5">Q{qt.questionIndex + 1}</div>
                                <div className={`text-[10px] font-mono p-1 rounded ${
                                  qt.timeSpentSeconds > 120 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                }`}>
                                  {qt.timeSpentSeconds}s
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Recommended Next Content
              </h3>
              {student.nextContent && student.nextContent.length > 0 ? (
                <div className="space-y-3">
                  {student.nextContent.map((content) => (
                    <div
                      key={content.id}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {content.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {content.type} • {"★".repeat(content.difficulty)}{" "}
                            Difficulty • ~{content.estimatedTime} min
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAssignContent(content.id)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        ➕ Assign Now
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No recommendations available
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            {/* Add New Note */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                ✍️ Add New Note
              </h3>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write note here..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={noteVisibility === "INTERNAL"}
                      onChange={() => setNoteVisibility("INTERNAL")}
                      className="text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      🔒 Internal Only
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={noteVisibility === "EXTERNAL"}
                      onChange={() => setNoteVisibility("EXTERNAL")}
                      className="text-blue-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">
                      👁️ Share with Parents
                    </span>
                  </label>
                </div>
              </div>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save Note
              </button>
            </div>

            {/* Existing Notes */}
            {student.notes && student.notes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  📝 Today&apos;s Session Notes ({student.notes.length})
                </h3>
                <div className="space-y-3">
                  {student.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(note.createdAt).toLocaleTimeString()} - By{" "}
                          {note.createdBy}
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                          Edit
                        </button>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mb-2">
                        {note.content}
                      </p>
                      <div className="text-xs">
                        {note.visibility === "EXTERNAL" ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            👁️ Shared with parents
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            🔒 Internal only
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
