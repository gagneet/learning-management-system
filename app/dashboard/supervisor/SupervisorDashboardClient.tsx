"use client";

import Link from "next/link";
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection";
import { ActionCardsSection } from "@/components/dashboard/ActionCardsSection";
import { getActionCardsForRole } from "@/components/dashboard/config/dashboardActions";
import { APP_CONFIG } from "@/lib/config/constants";
import type { User, Course, FinancialTransaction, Session, SessionAttendance } from "@prisma/client";

interface SupervisorDashboardData {
  userName: string;
  userRole: string;
  centerName?: string;
  financialMetrics: {
    totalRevenue: number;
    totalTutorPayments: number;
    totalOperationalCosts: number;
    profitMargin: number;
    pendingPayments: number;
  };
  performanceMetrics: {
    studentsCount: number;
    tutorsCount: number;
    activeCourses: number;
  };
  unallocatedStudents: User[];
  attendanceTrends: Array<{
    id: string;
    title: string;
    courseName: string;
    date: Date;
    attended: number;
    totalExpected: number;
    rate: number;
  }>;
  overallAttendanceRate: number;
  tutorStats: Array<User & {
    totalStudents: number;
    totalCourses: number;
  }>;
  recentTransactions: (FinancialTransaction & {
    user: {
      name: string | null;
      email: string;
    };
  })[];
}

export function SupervisorDashboardClient({ data }: { data: SupervisorDashboardData }) {
  const {
    userName,
    userRole,
    centerName,
    financialMetrics,
    performanceMetrics,
    unallocatedStudents,
    attendanceTrends,
    overallAttendanceRate,
    tutorStats,
    recentTransactions,
  } = data;

  // Get action cards based on role
  const role = userRole as any;
  const actionCards = getActionCardsForRole(role, {
    pendingTransactionsCount: recentTransactions.filter(t => t.status === "pending").length,
  });

  return (
    <>
      {/* Quick Actions - NEW */}
      <CollapsibleSection
        title="Quick Actions"
        icon="🚀"
        defaultExpanded={true}
        persistKey="supervisor-actions"
      >
        <ActionCardsSection actions={actionCards} columns={3} />
      </CollapsibleSection>

      {/* Financial Overview */}
      <CollapsibleSection
        title="Financial Overview"
        icon="💰"
        defaultExpanded={true}
        persistKey="supervisor-financial"
      >
        <div className="grid md:grid-cols-4 gap-6 mt-4">
          <div className="bg-gradient-to-br from-green-400 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
            <p className="text-4xl font-bold">
              ${financialMetrics.totalRevenue.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-400 to-red-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-semibold mb-2">Tutor Payments</h3>
            <p className="text-4xl font-bold">
              ${financialMetrics.totalTutorPayments.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-semibold mb-2">Operational Costs</h3>
            <p className="text-4xl font-bold">
              ${financialMetrics.totalOperationalCosts.toLocaleString()}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-semibold mb-2">Profit Margin</h3>
            <p className="text-4xl font-bold">
              ${financialMetrics.profitMargin.toLocaleString()}
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Performance Metrics */}
      <CollapsibleSection
        title="Performance Metrics"
        icon="📊"
        defaultExpanded={true}
        persistKey="supervisor-metrics"
      >
        <div className="grid md:grid-cols-4 gap-6 mt-4">
          <Link href="/admin/users" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 transition-all cursor-pointer border border-transparent">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Total Students
              </h3>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {performanceMetrics.studentsCount}
              </p>
            </div>
          </Link>

          <Link href="/admin/users" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 transition-all cursor-pointer border border-transparent">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Total Tutors
              </h3>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                {performanceMetrics.tutorsCount}
              </p>
            </div>
          </Link>

          <Link href="/admin/courses" className="block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg hover:border-blue-500 hover:-translate-y-1 transition-all cursor-pointer border border-transparent">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Active Courses
              </h3>
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {performanceMetrics.activeCourses}
              </p>
            </div>
          </Link>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-transparent">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Pending Payments
            </h3>
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
              ${financialMetrics.pendingPayments.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tutor Allocation Alert */}
        {unallocatedStudents.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-200 mb-4">
              Students Needing Tutor Allocation
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
      </CollapsibleSection>

      {/* Attendance Trends */}
      <CollapsibleSection
        title="Attendance Trends"
        icon="📅"
        badge={overallAttendanceRate > 0 ? `${overallAttendanceRate.toFixed(0)}%` : undefined}
        defaultExpanded={false}
        persistKey="supervisor-attendance"
      >
        {attendanceTrends.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Session
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Attended
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {attendanceTrends.map((trend) => (
                  <tr key={trend.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {trend.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {trend.courseName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(trend.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {trend.attended} / {trend.totalExpected}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              trend.rate >= 80
                                ? "bg-green-600"
                                : trend.rate >= 60
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }`}
                            style={{ width: `${trend.rate}%` }}
                          />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 min-w-[40px]">
                          {trend.rate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4 mt-4">
            No session attendance data available yet.
          </p>
        )}
      </CollapsibleSection>

      {/* Tutor Performance */}
      <CollapsibleSection
        title="Tutor Performance Analytics"
        icon="👨‍🏫"
        defaultExpanded={false}
        persistKey="supervisor-tutors"
      >
        <div className="overflow-x-auto mt-4">
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
      </CollapsibleSection>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <CollapsibleSection
          title="Recent Transactions"
          icon="💳"
          badge={recentTransactions.length}
          defaultExpanded={false}
          persistKey="supervisor-transactions"
        >
          <div className="overflow-x-auto mt-4">
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
        </CollapsibleSection>
      )}
    </>
  );
}
