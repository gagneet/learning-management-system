import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/config/constants";

export default async function SupervisorDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (!["CENTER_SUPERVISOR", "CENTER_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Determine which center(s) to query
  const centerFilter = user.role === "SUPER_ADMIN" ? {} : { centerId: user.centerId };

  // Fetch supervisor data
  const [
    students,
    tutors,
    courses,
    enrollments,
    financialSummary,
    recentTransactions,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...centerFilter,
        role: "STUDENT",
      },
      include: {
        enrollments: {
          include: {
            course: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        academicProfile: true,
      },
    }),
    prisma.user.findMany({
      where: {
        ...centerFilter,
        role: "TEACHER",
      },
      include: {
        taughtCourses: {
          include: {
            enrollments: true,
          },
        },
      },
    }),
    prisma.course.findMany({
      where: centerFilter,
      include: {
        enrollments: true,
        teacher: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      where: {
        course: centerFilter,
      },
    }),
    // Financial summary
    prisma.financialTransaction.groupBy({
      by: ["type", "status"],
      where: centerFilter,
      _sum: {
        amount: true,
      },
    }),
    prisma.financialTransaction.findMany({
      where: centerFilter,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  // Calculate financial metrics
  let totalRevenue = 0;
  let totalTutorPayments = 0;
  let totalOperationalCosts = 0;
  let pendingPayments = 0;

  financialSummary.forEach((item) => {
    const amount = item._sum.amount || 0;
    if (item.status === "completed") {
      switch (item.type) {
        case "STUDENT_PAYMENT":
          totalRevenue += amount;
          break;
        case "TUTOR_PAYMENT":
          totalTutorPayments += amount;
          break;
        case "OPERATIONAL_COST":
          totalOperationalCosts += amount;
          break;
      }
    } else if (item.status === "pending" && item.type === "STUDENT_FEE") {
      pendingPayments += amount;
    }
  });

  const profitMargin = totalRevenue - totalTutorPayments - totalOperationalCosts;

  // Tutor utilization
  const tutorStats = tutors.map((tutor) => {
    const totalStudents = tutor.taughtCourses.reduce(
      (sum, course) => sum + course.enrollments.length,
      0
    );
    return {
      ...tutor,
      totalStudents,
      totalCourses: tutor.taughtCourses.length,
    };
  });

  // Students needing tutor allocation
  const unallocatedStudents = students.filter((student) => {
    return student.enrollments.some((enrollment) => !enrollment.tutorId);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              👔 Supervisor Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name}
              </span>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Financial Dashboard */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            💰 Financial Overview
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-xl shadow-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
              <p className="text-4xl font-bold">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-400 to-red-600 p-6 rounded-xl shadow-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Tutor Payments</h3>
              <p className="text-4xl font-bold">
                ${totalTutorPayments.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-xl shadow-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Operational Costs</h3>
              <p className="text-4xl font-bold">
                ${totalOperationalCosts.toLocaleString()}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-xl shadow-lg text-white">
              <h3 className="text-lg font-semibold mb-2">Profit Margin</h3>
              <p className="text-4xl font-bold">
                ${profitMargin.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Center Performance Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Students
            </h3>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {students.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Tutors
            </h3>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {tutors.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Active Courses
            </h3>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {courses.filter(c => c.status === "PUBLISHED").length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Pending Payments
            </h3>
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
              ${pendingPayments.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tutor Allocation */}
        {unallocatedStudents.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-200 mb-4">
              ⚠️ Students Needing Tutor Allocation
            </h3>
            <p className="text-yellow-800 dark:text-yellow-300 mb-4">
              {unallocatedStudents.length} student(s) have enrollments without assigned tutors.
            </p>
            <div className="space-y-2">
              {unallocatedStudents.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {student.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {student.email}
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                      Allocate Tutor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tutor Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            👨‍🏫 Tutor Performance Analytics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Tutor Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Courses
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Students
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tutorStats.map((tutor) => {
                  const utilization = tutor.totalCourses > 0 
                    ? Math.min(100, (tutor.totalStudents / (tutor.totalCourses * APP_CONFIG.DEFAULT_STUDENTS_PER_COURSE)) * 100)
                    : 0;
                  return (
                    <tr key={tutor.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {tutor.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {tutor.totalCourses}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {tutor.totalStudents}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                utilization > 80
                                  ? "bg-red-600"
                                  : utilization > 50
                                  ? "bg-yellow-600"
                                  : "bg-green-600"
                              }`}
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 min-w-[40px]">
                            {utilization.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              💳 Recent Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {transaction.user.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded ${
                          transaction.type.includes("PAYMENT")
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        }`}>
                          {transaction.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">
                        ${transaction.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded ${
                          transaction.status === "completed"
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
