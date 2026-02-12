import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default async function TutorSessionsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const now = new Date();

  // Fetch tutor's sessions
  const [upcomingSessions, pastSessions] = await Promise.all([
    prisma.session.findMany({
      where: {
        tutorId: user.id,
        startTime: { gte: now },
      },
      include: {
        studentEnrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
              },
            },
            course: { select: { title: true } },
            lesson: { select: { title: true } },
          },
        },
        attendanceRecords: {
          include: {
            student: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.session.findMany({
      where: {
        tutorId: user.id,
        startTime: { lt: now },
      },
      include: {
        studentEnrollments: {
          include: {
            course: { select: { title: true } },
            lesson: { select: { title: true } },
          },
        },
        attendanceRecords: true,
      },
      orderBy: { startTime: "desc" },
      take: 20,
    }),
  ]);

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
              <span className="text-gray-600 dark:text-gray-300">My Sessions</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Sessions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your upcoming and past live sessions
          </p>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Upcoming Sessions
          </h2>

          {upcomingSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No upcoming sessions scheduled
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((s) => (
                <div
                  key={s.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${
                            s.status === "LIVE"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : s.status === "SCHEDULED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {s.status}
                        </span>
                        {s.status === "LIVE" && (
                          <span className="text-red-600 dark:text-red-400 animate-pulse">
                            ● Live Now
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {s.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {s.studentEnrollments.length > 0 ? `${s.studentEnrollments.length} student(s) enrolled` : 'No enrollments yet'}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>📅 {new Date(s.startTime).toLocaleDateString()}</span>
                        <span>
                          🕐 {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>⏱️ {s.duration || (s.endTime ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60)) : 60)} minutes</span>
                        <span>👥 {s.attendanceRecords.length} attendees</span>
                        <!-- TODO: Is the following correct?
                        {s.endTime && (
                          <span>⏱️ {Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60))} minutes</span>
                        )}
                        <span>👥 {s.attendance.length} attendees</span>
                        -->

                        {s.sessionMode === "PHYSICAL" && s.physicalLocation && (
                          <span>📍 {s.physicalLocation}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {s.sessionMode === "ONLINE" && s.meetingLink && (
                        <a
                          href={s.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            s.status === "LIVE"
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {s.status === "LIVE" ? "Join Now" : "Join Session"}
                        </a>
                      )}
                      <Link
                        href={`/dashboard/tutor/sessions/${s.id}`}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                  {s.description && (
                    <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
                      {s.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Past Sessions</h2>

          {pastSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No past sessions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastSessions.map((s) => {
                const attendanceRate = s.attendanceRecords.length > 0
                  ? (s.attendanceRecords.filter(a => a.status === "PRESENT").length / s.attendanceRecords.length) * 100
                  : 0;

                return (
                  <div
                    key={s.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {s.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                          {s.studentEnrollments.length > 0 ? `${s.studentEnrollments.length} student(s) enrolled` : 'No enrollments'}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>📅 {new Date(s.startTime).toLocaleDateString()}</span>
                          <span>
                            🕐 {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>
                            👥 {s.attendanceRecords.filter(a => a.status === "PRESENT").length}/{s.attendanceRecords.length} present
                          </span>
                          <span>📊 {Math.round(attendanceRate)}% attendance</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {s.recordingUrl && (
                          <a
                            href={s.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            Recording
                          </a>
                        )}
                        <Link
                          href={`/dashboard/tutor/sessions/${s.id}`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
