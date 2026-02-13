import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ThemeToggle from "@/components/ThemeToggle";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Redirect students to their enhanced dashboard
  if (user.role === "STUDENT") {
    redirect("/dashboard/student");
  }

  // Redirect teachers to their tutor dashboard
  if (user.role === "TEACHER") {
    redirect("/dashboard/tutor");
  }

  // Redirect parents to their parent dashboard
  if (user.role === "PARENT") {
    redirect("/dashboard/parent");
  }

  // Redirect supervisors, finance admins, and center admins to supervisor dashboard
  if (user.role === "CENTER_SUPERVISOR" || user.role === "CENTER_ADMIN" || user.role === "FINANCE_ADMIN") {
    redirect("/dashboard/supervisor");
  }

  // SUPER_ADMIN: fetch real data across all centres
  const centerFilter = user.role === "SUPER_ADMIN" ? {} : { centerId: user.centerId };

  const [courseCount, userCount, enrollmentCount, activeStudents, recentEnrollments] = await Promise.all([
    prisma.course.count({ where: centerFilter }),
    prisma.user.count({ where: centerFilter }),
  prisma.enrollment.count({
    where: { 
      course: centerFilter.centerId ? { centerId: centerFilter.centerId } : {} 
    },
  }),
    prisma.user.count({
      where: {
        ...centerFilter,
        role: "STUDENT",
      },
    }),
  prisma.enrollment.findMany({
    where: { course: centerFilter.centerId ? { centerId: centerFilter.centerId } : {} },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
      orderBy: { enrolledAt: "desc" },
      take: 10,
    }),
  ]);

  const avgProgress = enrollmentCount > 0
    ? await prisma.enrollment.aggregate({
        where: { course: centerFilter.centerId ? { centerId: centerFilter.centerId } : {} },
        _avg: { progress: true },
      }).then(r => r._avg.progress || 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              LMS Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                {user.role}
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <AdminDashboardClient
          data={{
            userName: user.name!,
            userRole: user.role,
            centerName: user.centerName,
            courseCount,
            avgProgress,
            userCount,
            activeStudents,
            recentEnrollments,
          }}
        />
      </main>
    </div>
  );
}
