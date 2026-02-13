"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AttendanceMarkingClientProps {
  sessionData: any;
}

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

export function AttendanceMarkingClient({ sessionData }: AttendanceMarkingClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catchUpsGenerated, setCatchUpsGenerated] = useState<any[]>([]);

  // Initialize attendance state from existing records or default to empty
  const [attendanceData, setAttendanceData] = useState<
    Record<
      string,
      {
        status: AttendanceStatus | "";
        notes: string;
      }
    >
  >(() => {
    const initial: Record<string, { status: AttendanceStatus | ""; notes: string }> = {};
    sessionData.studentEnrollments.forEach((enrollment: any) => {
      const existingRecord = sessionData.attendanceRecords.find(
        (r: any) => r.studentId === enrollment.studentId
      );
      initial[enrollment.studentId] = {
        status: existingRecord?.status || "",
        notes: existingRecord?.notes || "",
      };
    });
    return initial;
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: typeof attendanceData = {};
    sessionData.studentEnrollments.forEach((enrollment: any) => {
      updated[enrollment.studentId] = {
        status,
        notes: attendanceData[enrollment.studentId]?.notes || "",
      };
    });
    setAttendanceData(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setCatchUpsGenerated([]);

    try {
      // Prepare attendance records
      const records = Object.entries(attendanceData)
        .filter(([_, data]) => data.status !== "")
        .map(([studentId, data]) => ({
          studentId,
          status: data.status,
          notes: data.notes || undefined,
        }));

      if (records.length === 0) {
        setError("Please mark attendance for at least one student");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/academic/attendance/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionData.id,
          attendanceRecords: records,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to mark attendance");
      }

      setSuccess(true);
      if (data.details?.catchUpsGenerated?.length > 0) {
        setCatchUpsGenerated(data.details.catchUpsGenerated);
      }

      // Refresh the page after a delay
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus | "") => {
    switch (status) {
      case "PRESENT":
        return "bg-green-600 text-white hover:bg-green-700";
      case "LATE":
        return "bg-orange-600 text-white hover:bg-orange-700";
      case "ABSENT":
        return "bg-red-600 text-white hover:bg-red-700";
      case "EXCUSED":
        return "bg-blue-600 text-white hover:bg-blue-700";
      default:
        return "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600";
    }
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const markedCount = Object.values(attendanceData).filter((d) => d.status !== "").length;
  const totalStudents = sessionData.studentEnrollments.length;
  const presentCount = Object.values(attendanceData).filter((d) => d.status === "PRESENT").length;
  const absentCount = Object.values(attendanceData).filter((d) => d.status === "ABSENT").length;

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {sessionData.title}
            </h1>
            <div className="text-gray-600 dark:text-gray-400 space-y-1">
              <div>📅 {formatDateTime(sessionData.startTime)}</div>
              <div>👨‍🏫 {sessionData.tutor.name}</div>
              <div>👥 {totalStudents} students enrolled</div>
            </div>
          </div>
          <Link
            href={`/dashboard/tutor/sessions/${sessionData.id}`}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600"
          >
            ← Back to Session
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">Marked</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {markedCount}/{totalStudents}
            </div>
          </div>
          <div className="border border-green-200 dark:border-green-700 rounded-lg p-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">Present</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{presentCount}</div>
          </div>
          <div className="border border-red-200 dark:border-red-700 rounded-lg p-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">Absent</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{absentCount}</div>
          </div>
          <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">Rate</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Quick Mark All:
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleMarkAll("PRESENT")}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll("ABSENT")}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <div className="font-semibold text-green-900 dark:text-green-100 mb-1">
                Attendance marked successfully!
              </div>
              {catchUpsGenerated.length > 0 && (
                <div className="text-sm text-green-800 dark:text-green-200 mt-2">
                  <div className="font-medium mb-1">
                    🎓 Catch-up packages auto-generated for {catchUpsGenerated.length} absent students:
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {catchUpsGenerated.map((catchUp) => (
                      <li key={catchUp.studentId}>{catchUp.studentName}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">❌</div>
            <div>
              <div className="font-semibold text-red-900 dark:text-red-100">Error</div>
              <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sessionData.studentEnrollments.map((enrollment: any) => {
                const studentData = attendanceData[enrollment.studentId];
                return (
                  <tr key={enrollment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          {enrollment.student.avatar ? (
                            <img
                              src={enrollment.student.avatar}
                              alt={enrollment.student.name}
                              className="w-full h-full rounded-full"
                            />
                          ) : (
                            <span className="text-lg">{enrollment.student.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {enrollment.student.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {enrollment.student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {enrollment.course?.title || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        {(["PRESENT", "LATE", "ABSENT", "EXCUSED"] as AttendanceStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(enrollment.studentId, status)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              studentData?.status === status
                                ? getStatusColor(status)
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={studentData?.notes || ""}
                        onChange={(e) => handleNotesChange(enrollment.studentId, e.target.value)}
                        placeholder="Add notes..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={loading || markedCount === 0}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
        >
          {loading ? "Saving..." : `Save Attendance (${markedCount}/${totalStudents})`}
        </button>
        <Link
          href={`/dashboard/tutor/sessions/${sessionData.id}`}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-lg text-center"
        >
          Cancel
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="text-sm text-yellow-900 dark:text-yellow-100">
            <div className="font-semibold mb-1">Automatic Catch-Up Generation</div>
            <div>
              When you mark a student as <strong>ABSENT</strong>, a catch-up package will be automatically
              created with the session content. The student will have 7 days to complete the catch-up work.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
