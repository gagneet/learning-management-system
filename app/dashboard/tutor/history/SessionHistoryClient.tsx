"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
}

interface Session {
  id: string;
  title: string;
  description: string | null;
  startTime: Date | string;
  endTime: Date | string | null;
  duration: number | null;
  status: string;
  sessionMode: string;
  physicalLocation: string | null;
  recordingUrl: string | null;
  studentEnrollments: {
    student: {
      id: string;
      name: string | null;
    };
  }[];
  attendanceRecords: {
    student: {
      id: string;
      name: string | null;
    };
    status: string;
  }[];
}

interface SessionHistoryClientProps {
  sessions: Session[];
  students: Student[];
}

export default function SessionHistoryClient({
  sessions,
  students,
}: SessionHistoryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        searchTerm === "" ||
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStudent =
        selectedStudent === "all" ||
        session.studentEnrollments.some(
          (enrollment) => enrollment.student.id === selectedStudent
        );

      const sessionDate = new Date(session.startTime);
      const matchesStartDate =
        !startDate || sessionDate >= new Date(startDate);
      const matchesEndDate =
        !endDate || sessionDate <= new Date(endDate + "T23:59:59");

      return matchesSearch && matchesStudent && matchesStartDate && matchesEndDate;
    });
  }, [sessions, searchTerm, selectedStudent, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate stats
  const stats = useMemo(() => {
    const totalSessions = filteredSessions.length;
    const completedSessions = filteredSessions.filter(
      (s) => s.status === "COMPLETED"
    ).length;
    const cancelledSessions = filteredSessions.filter(
      (s) => s.status === "CANCELLED"
    ).length;

    const totalAttendance = filteredSessions.reduce((acc, session) => {
      const present = session.attendanceRecords.filter(
        (a) => a.status === "PRESENT"
      ).length;
      const total = session.attendanceRecords.length;
      return acc + (total > 0 ? (present / total) * 100 : 0);
    }, 0);

    const avgAttendance =
      completedSessions > 0 ? totalAttendance / completedSessions : 0;

    const totalDuration = filteredSessions.reduce((acc, session) => {
      if (session.duration) return acc + session.duration;
      if (session.endTime && session.startTime) {
        const duration = Math.round(
          (new Date(session.endTime).getTime() -
            new Date(session.startTime).getTime()) /
            (1000 * 60)
        );
        return acc + duration;
      }
      return acc;
    }, 0);

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      avgAttendance,
      totalDuration,
    };
  }, [filteredSessions]);

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Title",
      "Status",
      "Duration (min)",
      "Students Enrolled",
      "Attendance Rate",
      "Location",
    ];

    const rows = filteredSessions.map((session) => {
      const date = new Date(session.startTime).toLocaleDateString();
      const duration =
        session.duration ||
        (session.endTime && session.startTime
          ? Math.round(
              (new Date(session.endTime).getTime() -
                new Date(session.startTime).getTime()) /
                (1000 * 60)
            )
          : 0);
      const studentsEnrolled = session.studentEnrollments.length;
      const presentCount = session.attendanceRecords.filter(
        (a) => a.status === "PRESENT"
      ).length;
      const totalAttendance = session.attendanceRecords.length;
      const attendanceRate =
        totalAttendance > 0
          ? Math.round((presentCount / totalAttendance) * 100)
          : 0;
      const location =
        session.sessionMode === "PHYSICAL"
          ? session.physicalLocation || "Physical"
          : "Online";

      return [
        date,
        session.title,
        session.status,
        duration,
        studentsEnrolled,
        `${attendanceRate}%`,
        location,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `session-history-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Session History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and analyze your past teaching sessions
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            📥 Export to CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.totalSessions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Sessions
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.completedSessions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Completed
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-3xl mb-2">❌</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {stats.cancelledSessions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Cancelled
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {Math.round(stats.avgAttendance)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg Attendance
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-3xl mb-2">⏱️</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {Math.round(stats.totalDuration / 60)}h
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Hours
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
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedStudent("all");
              setStartDate("");
              setEndDate("");
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {paginatedSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No sessions found
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedSessions.map((session) => {
                const attendanceRate =
                  session.attendanceRecords.length > 0
                    ? Math.round(
                        (session.attendanceRecords.filter(
                          (a) => a.status === "PRESENT"
                        ).length /
                          session.attendanceRecords.length) *
                          100
                      )
                    : 0;

                const duration =
                  session.duration ||
                  (session.endTime && session.startTime
                    ? Math.round(
                        (new Date(session.endTime).getTime() -
                          new Date(session.startTime).getTime()) /
                          (1000 * 60)
                      )
                    : 0);

                return (
                  <div
                    key={session.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 text-xs rounded-full ${getStatusBadge(
                              session.status
                            )}`}
                          >
                            {session.status}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(session.startTime).toLocaleDateString()} •{" "}
                            {new Date(session.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {session.title}
                        </h3>
                        {session.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {session.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            👥 {session.studentEnrollments.length} student(s)
                          </span>
                          <span>📊 {attendanceRate}% attendance</span>
                          <span>⏱️ {duration} minutes</span>
                          {session.sessionMode === "PHYSICAL" &&
                            session.physicalLocation && (
                              <span>📍 {session.physicalLocation}</span>
                            )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {session.recordingUrl && (
                          <a
                            href={session.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            Recording
                          </a>
                        )}
                        <Link
                          href={`/dashboard/tutor/sessions/${session.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredSessions.length)}{" "}
                  of {filteredSessions.length} sessions
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                      )
                      .map((page, idx, arr) => (
                        <>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span
                              key={`ellipsis-${page}`}
                              className="text-gray-500"
                            >
                              ...
                            </span>
                          )}
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                            }`}
                          >
                            {page}
                          </button>
                        </>
                      ))}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
