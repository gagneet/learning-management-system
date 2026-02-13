import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Admin Dashboard" />

      <main className="container mx-auto px-4 py-8 flex-1">
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
