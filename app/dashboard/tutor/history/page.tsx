import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { Calendar, Clock, Users, ArrowRight } from "lucide-react";

export default async function SessionHistoryPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER" && user.role !== "CENTER_ADMIN" && user.role !== "CENTER_SUPERVISOR") {
    redirect("/dashboard");
  }

  const pastSessions = await prisma.session.findMany({
    where: {
      tutorId: user.id,
      status: "COMPLETED",
    },
    include: {
      studentEnrollments: {
        include: {
          student: {
            select: { name: true, avatar: true }
          },
          course: {
            select: { title: true }
          }
        }
      },
      attendance: true,
    },
    orderBy: {
      startTime: "desc",
    },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Session History" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Session History</h1>
            <p className="text-gray-600 dark:text-gray-400">Review your past completed teaching sessions</p>
          </div>
          <Link
            href="/dashboard/tutor/sessions"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            View Upcoming <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {pastSessions.length > 0 ? (
          <div className="space-y-6">
            {pastSessions.map((s) => (
              <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-bold rounded uppercase">
                          Completed
                        </span>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{s.title}</h2>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {new Date(s.startTime).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {s.endTime && ` - ${new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {s.studentEnrollments.length} Students
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/tutor/sessions/${s.id}`}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Participating Students</h3>
                    <div className="flex flex-wrap gap-3">
                      {s.studentEnrollments.map((en) => (
                        <div key={en.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-800">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                            {en.student.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{en.student.name}</span>
                          <span className="text-[10px] text-gray-400">• {en.course?.title || 'General'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">No session history found</h2>
            <p className="text-gray-500 mt-2">Sessions will appear here once they are marked as completed.</p>
          </div>
        )}
      </main>
    </div>
  );
}
