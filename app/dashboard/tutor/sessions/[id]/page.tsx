import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/Header";

interface SessionDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionDetailsPage({ params }: SessionDetailsPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Await params in Next.js 16
  const { id } = await params;

  // Fetch session details
  const sessionData = await prisma.session.findUnique({
    where: { id },
    include: {
      studentEnrollments: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: { select: { id: true, title: true } },
          lesson: { select: { id: true, title: true } },
        },
      },
      tutor: {
        select: {
          name: true,
          email: true,
        },
      },
      attendanceRecords: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!sessionData) {
    notFound();
  }

  // Verify tutor owns this session
  if (sessionData.tutorId !== user.id) {
    redirect("/dashboard");
  }

  // Calculate duration from startTime and endTime
  const durationMinutes = sessionData.endTime
    ? Math.round((new Date(sessionData.endTime).getTime() - new Date(sessionData.startTime).getTime()) / (1000 * 60))
    : sessionData.duration || null;

  const presentCount = sessionData.attendanceRecords?.filter((a) => a.status === "PRESENT").length || 0;
  const absentCount = sessionData.attendanceRecords?.filter((a) => a.status === "ABSENT").length || 0;
  const lateCount = sessionData.attendanceRecords?.filter((a) => a.status === "LATE").length || 0;
  const totalRecords = sessionData.attendanceRecords?.length || 0;
  const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

  // Format dates consistently on the server
  const startDate = new Date(sessionData.startTime);
  const dateStr = startDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name || "", email: user.email || "", role: user.role || "" }}
        breadcrumbs={[
          { label: "Sessions", href: "/dashboard/tutor/sessions" },
          { label: "Details" },
        ]}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Session Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    sessionData.status === "LIVE"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : sessionData.status === "SCHEDULED"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : sessionData.status === "COMPLETED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {sessionData.status}
                </span>
                {sessionData.status === "LIVE" && (
                  <span className="text-red-600 dark:text-red-400 animate-pulse text-lg">
                    ● Live Now
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {sessionData.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Multi-student session with {sessionData.studentEnrollments.length} enrolled student(s)
              </p>
              {sessionData.description && (
                <p className="text-gray-600 dark:text-gray-400">{sessionData.description}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Date</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {dateStr}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {timeStr}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {durationMinutes ? `${durationMinutes} minutes` : 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mode</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {sessionData.sessionMode === "ONLINE" ? "🌐 Online" : "📍 Physical"}
              </div>
            </div>
          </div>

          {/* Video Session button - show for all ONLINE/HYBRID sessions (room auto-created on video page) */}
          {(sessionData.sessionMode === "ONLINE" || sessionData.sessionMode === "HYBRID") && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/tutor/sessions/${sessionData.id}/video`}
                className={`inline-block px-8 py-3 rounded-lg transition-colors ${
                  sessionData.status === "LIVE"
                    ? "bg-purple-600 text-white hover:bg-purple-700 animate-pulse"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {sessionData.status === "LIVE" ? "📹 Live Video Session" : "📹 Start Video Session"}
              </Link>
              {sessionData.status !== "LIVE" && (
                <Link
                  href={`/dashboard/tutor/sessions/${sessionData.id}/live`}
                  className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🎯 Session Dashboard
                </Link>
              )}
            </div>
          )}

          {sessionData.sessionMode === "PHYSICAL" && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/tutor/sessions/${sessionData.id}/live`}
                className={`inline-block px-8 py-3 rounded-lg transition-colors ${
                  sessionData.status === "LIVE"
                    ? "bg-green-600 text-white hover:bg-green-700 animate-pulse"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {sessionData.status === "LIVE" ? "🎯 Live Dashboard" : "▶ Start Session"}
              </Link>
            </div>
          )}

          {sessionData.meetingLink && (
            <div className="mt-3">
              <a
                href={sessionData.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                🔗 External Meeting Link
              </a>
            </div>
          )}

          {sessionData.sessionMode === "PHYSICAL" && sessionData.physicalLocation && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Location</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                📍 {sessionData.physicalLocation}
              </div>
            </div>
          )}

          {sessionData.recordingUrl && (
            <div className="mt-6">
              <a
                href={sessionData.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                📹 View Recording
              </a>
            </div>
          )}
        </div>

        {/* Attendance Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {totalRecords}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Registered</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-3xl font-bold text-green-600 mb-1">{presentCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Present</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">❌</div>
            <div className="text-3xl font-bold text-red-600 mb-1">{absentCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Absent</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {Math.round(attendanceRate)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Attendance ({totalRecords})
          </h2>

          {totalRecords === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessionData.attendanceRecords?.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        record.status === "PRESENT"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : record.status === "LATE"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {record.status}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {record.student.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {record.student.email}
                      </div>
                    </div>
                  </div>
                  {record.markedAt && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Marked: {new Date(record.markedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
