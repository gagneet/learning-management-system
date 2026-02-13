"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SessionHeaderProps {
  sessionId: string;
  title: string;
  status: string;
  startTime: Date;
  duration: number;
  activeStudentsCount: number;
  totalStudentsCount: number;
  onStatusChange?: (newStatus: string) => void;
}

export default function SessionHeader({
  sessionId,
  title,
  status,
  startTime,
  duration,
  activeStudentsCount,
  totalStudentsCount,
  onStatusChange,
}: SessionHeaderProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(status === "LIVE");

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedTime(elapsed > 0 ? elapsed : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  useEffect(() => {
    setIsRunning(status === "LIVE");
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartSession = () => {
    setIsRunning(true);
    onStatusChange?.("LIVE");
  };

  const handlePauseSession = () => {
    setIsRunning(false);
    onStatusChange?.("SCHEDULED");
  };

  const handleEndSession = () => {
    setIsRunning(false);
    onStatusChange?.("COMPLETED");
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Session Info */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/tutor/sessions"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                {status === "LIVE" && (
                  <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                )}
                <span className="text-lg font-mono text-gray-900 dark:text-white">
                  {formatTime(elapsedTime)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  / {duration} min
                </span>
              </div>
            </div>
          </div>

          {/* Center: Active Students */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {activeStudentsCount}
            </span>
            <span className="text-gray-600 dark:text-gray-400">/</span>
            <span className="text-lg text-gray-700 dark:text-gray-300">
              {totalStudentsCount}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              🟢
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {status === "SCHEDULED" && (
              <button
                onClick={handleStartSession}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                ▶ Start Session
              </button>
            )}

            {status === "LIVE" && (
              <>
                <button
                  onClick={handlePauseSession}
                  className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={handleEndSession}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  ⏹ End Session
                </button>
              </>
            )}

            <button className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              ⚙
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
