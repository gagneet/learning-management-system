import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ScheduleRuleForm } from "./ScheduleRuleForm";

export default async function ClassSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (!["SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  const classData = await prisma.classCohort.findUnique({
    where: { id },
    include: {
      scheduleRules: true,
    },
  });

  if (!classData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/classes"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
            >
              ← Back to Classes
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Schedule: {classData.name}
            </h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6 dark:text-white">Add Schedule Rule</h2>
              <ScheduleRuleForm classId={id} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold dark:text-white">Existing Rules</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Recurrence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {classData.scheduleRules.map((rule) => (
                      <tr key={rule.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                          {rule.recurrence}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {rule.daysOfWeek.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {rule.startTime} ({rule.durationMin} min)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(rule.startDate).toLocaleDateString()} - {rule.endDate ? new Date(rule.endDate).toLocaleDateString() : "Ongoing"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {classData.scheduleRules.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No schedule rules defined yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
