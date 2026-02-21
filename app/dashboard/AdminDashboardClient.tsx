"use client";

import Link from "next/link";
import { CollapsibleSection } from "@/components/dashboard/CollapsibleSection";
import { ActionCardsSection } from "@/components/dashboard/ActionCardsSection";
import { getActionCardsForRole } from "@/components/dashboard/config/dashboardActions";
import { ProgressBar } from "@/components/ProgressBar";
import type { Enrollment, User, Course } from "@prisma/client";

interface AdminDashboardData {
  userName: string;
  userRole: string;
  centerName?: string;
  courseCount: number;
  avgProgress: number;
  userCount: number;
  activeStudents: number;
  recentEnrollments: (Enrollment & {
    user: Pick<User, "name" | "email">;
    course: Pick<Course, "title">;
  })[];
}

export function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
  const {
    userName,
    userRole,
    centerName,
    courseCount,
    avgProgress,
    userCount,
    activeStudents,
    recentEnrollments,
  } = data;

  // Get action cards for SUPER_ADMIN
  const actionCards = getActionCardsForRole("SUPER_ADMIN", {});

  return (
    <>
      {/* Welcome - Always visible */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome, {userName}!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {userRole === "SUPER_ADMIN" ? "Global Admin Overview" : `Center: ${centerName}`}
        </p>
      </div>

      {/* Quick Actions - NEW */}
      <CollapsibleSection
        title="Quick Actions"
        icon="🚀"
        defaultExpanded={true}
        persistKey="admin-actions"
      >
        <ActionCardsSection actions={actionCards} columns={3} />
      </CollapsibleSection>

      {/* Key Metrics */}
      <CollapsibleSection
        title="Key Metrics"
        icon="📊"
        defaultExpanded={true}
        persistKey="admin-metrics"
      >
        <div className="grid md:grid-cols-4 gap-6 mt-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Courses
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{courseCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Across all centres
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Avg Progress
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{avgProgress.toFixed(0)}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Overall completion
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Active Users
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Registered users
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Students
            </h3>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{activeStudents}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Enrolled students
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Recent Enrollments */}
      <CollapsibleSection
        title="Recent Enrollments"
        icon="🎓"
        badge={recentEnrollments.length > 0 ? recentEnrollments.length : undefined}
        defaultExpanded={true}
        persistKey="admin-enrollments"
      >
        {recentEnrollments.length > 0 ? (
          <div className="overflow-x-auto mt-4">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Enrolled
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentEnrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {enrollment.user.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {enrollment.course.title}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <ProgressBar
                        progress={enrollment.progress}
                        showLabel={true}
                        className="max-w-[150px]"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8 mt-4">
            No enrollments yet. Start by creating courses and enrolling students!
          </p>
        )}
      </CollapsibleSection>
    </>
  );
}
