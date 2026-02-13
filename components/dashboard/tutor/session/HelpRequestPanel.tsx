"use client";

import { useState } from "react";

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

interface HelpRequestPanelProps {
  requests: HelpRequest[];
  onAcknowledge: (requestId: string) => void;
  onResolve: (requestId: string) => void;
  onViewStudent: (studentId: string) => void;
}

export default function HelpRequestPanel({
  requests,
  onAcknowledge,
  onResolve,
  onViewStudent,
}: HelpRequestPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const priorityConfig = {
    URGENT: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-300 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
      badge: "bg-red-600 text-white",
      icon: "🚨",
    },
    HIGH: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-300 dark:border-orange-800",
      text: "text-orange-800 dark:text-orange-200",
      badge: "bg-orange-600 text-white",
      icon: "⚠️",
    },
    MEDIUM: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-300 dark:border-yellow-800",
      text: "text-yellow-800 dark:text-yellow-200",
      badge: "bg-yellow-600 text-white",
      icon: "💬",
    },
    LOW: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-300 dark:border-green-800",
      text: "text-green-800 dark:text-green-200",
      badge: "bg-green-600 text-white",
      icon: "📝",
    },
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const urgentCount = pendingRequests.filter((r) => r.priority === "URGENT").length;
  const highCount = pendingRequests.filter((r) => r.priority === "HIGH").length;
  const mediumCount = pendingRequests.filter((r) => r.priority === "MEDIUM").length;
  const lowCount = pendingRequests.filter((r) => r.priority === "LOW").length;

  const sortedRequests = [...pendingRequests].sort((a, b) => {
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (pendingRequests.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4 mx-6 mt-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              All Clear!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              No pending help requests at the moment
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mx-6 mt-4 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🆘</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Help Requests ({pendingRequests.length})
          </h2>
          <div className="flex items-center gap-2">
            {urgentCount > 0 && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
                {urgentCount} URGENT
              </span>
            )}
            {highCount > 0 && (
              <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-semibold rounded-full">
                {highCount} HIGH
              </span>
            )}
            {mediumCount > 0 && (
              <span className="px-2 py-0.5 bg-yellow-600 text-white text-xs font-semibold rounded-full">
                {mediumCount}
              </span>
            )}
            {lowCount > 0 && (
              <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full">
                {lowCount}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm"
        >
          {isMinimized ? "Expand ▼" : "Minimize ▲"}
        </button>
      </div>

      {/* Request List */}
      {!isMinimized && (
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {sortedRequests.map((request) => {
            const config = priorityConfig[request.priority];
            return (
              <div
                key={request.id}
                className={`${config.bg} ${config.border} border-l-4 rounded-lg p-4 transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Student & Message */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{config.icon}</span>
                      <span className={`${config.badge} px-2 py-0.5 text-xs font-bold rounded`}>
                        {request.priority}
                      </span>
                      <button
                        onClick={() => onViewStudent(request.studentId)}
                        className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {request.studentName}
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getTimeAgo(request.timestamp)}
                      </span>
                    </div>

                    {request.exerciseTitle && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        📚 {request.exerciseTitle}
                      </div>
                    )}

                    <p className="text-gray-800 dark:text-gray-200">
                      {request.message}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onViewStudent(request.studentId)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onAcknowledge(request.id)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => onResolve(request.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
