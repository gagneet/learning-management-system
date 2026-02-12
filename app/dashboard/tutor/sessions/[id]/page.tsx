import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface SessionDetailsPageProps {
  params: {
    id: string;
  };
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

  // Fetch session details
  const sessionData = await prisma.session.findUnique({
    where: { id: params.id },
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
      attendance: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          user: {
            name: "asc",
          },
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

  const presentCount = sessionData.attendance.filter((a) => a.status === "PRESENT").length;
  const absentCount = sessionData.attendance.filter((a) => a.status === "ABSENT").length;
  const lateCount = sessionData.attendance.filter((a) => a.status === "LATE").length;
  const attendanceRate =
    sessionData.attendance.length > 0
      ? (presentCount / sessionData.attendance.length) * 100
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                LMS
              </Link>
              <span className="text-gray-400">›</span>
              <Link
                href="/dashboard/tutor/sessions"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                Sessions
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-600 dark:text-gray-300">Details</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/dashboard/tutor/sessions"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                ← Back to Sessions
              </Link>
            </div>
          </div>
        </div>
      </nav>

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
                {new Date(sessionData.startTime).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(sessionData.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {sessionData.duration} minutes
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mode</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {sessionData.sessionMode === "ONLINE" ? "🌐 Online" : "📍 Physical"}
              </div>
            </div>
          </div>

          {sessionData.sessionMode === "ONLINE" && sessionData.meetingLink && (
            <div className="mt-6">
              <a
                href={sessionData.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block px-8 py-3 rounded-lg transition-colors ${
                  sessionData.status === "LIVE"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {sessionData.status === "LIVE" ? "🔴 Join Live Session" : "Join Session"}
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
              {sessionData.attendance.length}
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
            Attendance ({sessionData.attendance.length})
          </h2>

          {sessionData.attendance.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessionData.attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        record.status === "PRESENT"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : record.status === "ABSENT"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {record.status}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {record.user.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {record.user.email}
                      </div>
                    </div>
                  </div>
                  {record.joinedAt && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Joined: {new Date(record.joinedAt).toLocaleTimeString()}
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
