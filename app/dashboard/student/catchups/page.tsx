import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function StudentCatchupsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch catch-ups for the student
  const catchups = await prisma.catchUpPackage.findMany({
    where: {
      studentId: user.id,
    },
    include: {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="My Catch-Ups"
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Catch-Up Work</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Complete the work for sessions you missed to stay on track with your learning.
            </p>
          </div>

          {catchups.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All caught up!</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                You don&apos;t have any pending catch-up tasks. Great job!
              </p>
              <Link
                href="/dashboard"
                className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {catchups.map((cp) => (
                <div
                  key={cp.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border-l-4 ${
                    cp.status === "COMPLETED"
                      ? "border-green-500"
                      : new Date(cp.dueDate) < new Date()
                      ? "border-red-500"
                      : "border-blue-500"
                  }`}
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                          cp.status === "COMPLETED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : cp.status === "OVERDUE" || new Date(cp.dueDate) < new Date()
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {cp.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-500">
                          Missed: {new Date(cp.session.startTime).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {cp.session.title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Due: {new Date(cp.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      {cp.status !== "COMPLETED" ? (
                        <Link
                          href={`/dashboard/student/catchups/${cp.id}`}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block text-center w-full md:w-auto"
                        >
                          Start Catch-Up
                        </Link>
                      ) : (
                        <div className="text-green-600 dark:text-green-400 font-medium">
                          Completed on {cp.completedAt && new Date(cp.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
