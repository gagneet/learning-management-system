import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function TutorCatchupsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch catch-ups assigned by this tutor or for sessions belonging to this tutor
  const catchups = await prisma.catchUpPackage.findMany({
    where: {
      session: {
        tutorId: user.id,
      },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      session: {
        select: {
          id: true,
          title: true,
          startTime: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const pending = catchups.filter(c => c.status !== "COMPLETED");
  const completed = catchups.filter(c => c.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Catch-Up Management"
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Catch-Ups</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage and monitor catch-up progress for absent students.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-orange-500">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{pending.length}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-red-500">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Overdue</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {pending.filter(p => new Date(p.dueDate) < new Date()).length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-green-500">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Completed</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{completed.length}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold dark:text-white">All Catch-Up Packages</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {catchups.map((cp) => (
                    <tr key={cp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            {cp.student.avatar ? (
                              <img src={cp.student.avatar} alt={cp.student.name} className="w-full h-full rounded-full" />
                            ) : (
                              <span className="text-xs font-bold">{cp.student.name[0]}</span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{cp.student.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">{cp.session.title}</div>
                        <div className="text-xs text-gray-500">Missed: {new Date(cp.session.startTime).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(cp.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          cp.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                          new Date(cp.dueDate) < new Date() ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                        }`}>
                          {cp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/dashboard/tutor/catchups/${cp.id}`} className="text-blue-600 hover:text-blue-900">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {catchups.length === 0 && (
                <div className="p-12 text-center text-gray-500">No catch-up packages found.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
