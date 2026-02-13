"use client";

interface SessionActionBarProps {
  sessionId: string;
  onGenerateReport: () => void;
  onMarkAttendance: () => void;
  onBroadcast: () => void;
  onEndSession: () => void;
}

export default function SessionActionBar({
  sessionId,
  onGenerateReport,
  onMarkAttendance,
  onBroadcast,
  onEndSession,
}: SessionActionBarProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGenerateReport}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              📊 Session Report
            </button>
            <button
              onClick={onMarkAttendance}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              👤 Mark Attendance
            </button>
            <button
              onClick={onBroadcast}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              📢 Broadcast
            </button>
          </div>

          {/* Right: End Session */}
          <button
            onClick={onEndSession}
            className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            End Session ▶
          </button>
        </div>
      </div>
    </footer>
  );
}
