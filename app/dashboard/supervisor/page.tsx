import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ThemeToggle from "@/components/ThemeToggle";
import { SupervisorDashboardClient } from "./SupervisorDashboardClient";

export default async function SupervisorDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (!["CENTER_SUPERVISOR", "CENTER_ADMIN", "FINANCE_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
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
    recentSessions,
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
    // Recent sessions for attendance trends
    prisma.session.findMany({
      where: {
        studentEnrollments: {
          some: {
            course: centerFilter,
          },
        },
        status: { in: ["COMPLETED", "LIVE"] },
      },
      include: {
        attendance: true,
        studentEnrollments: {
          include: {
            course: {
              select: { title: true },
            },
            lesson: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { startTime: "desc" },
      take: 20,
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

  // Attendance trends
  const attendanceTrends = recentSessions.map((s) => {
    const totalExpected = s.studentEnrollments.length;
    const attended = s.attendance.filter(a => a.attended).length;
    const rate = totalExpected > 0 ? (attended / totalExpected) * 100 : 0;
    return {
      id: s.id,
      title: s.title,
      courseName: s.studentEnrollments[0]?.course?.title || 'Various Courses',
      date: s.startTime,
      attended,
      totalExpected,
      rate,
    };
  });

  const overallAttendanceRate = attendanceTrends.length > 0
    ? attendanceTrends.reduce((sum, t) => sum + t.rate, 0) / attendanceTrends.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Supervisor Dashboard
            </h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name}
              </span>
              {user.role !== "SUPER_ADMIN" && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {user.centerName}
                </span>
              )}
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
        <SupervisorDashboardClient
          data={{
            userName: user.name!,
            userRole: user.role,
            centerName: user.centerName,
            financialMetrics: {
              totalRevenue,
              totalTutorPayments,
              totalOperationalCosts,
              profitMargin,
              pendingPayments,
            },
            performanceMetrics: {
              studentsCount: students.length,
              tutorsCount: tutors.length,
              activeCourses: courses.filter(c => c.status === "PUBLISHED").length,
            },
            unallocatedStudents,
            attendanceTrends,
            overallAttendanceRate,
            tutorStats,
            recentTransactions,
          }}
        />
      </main>
    </div>
  );
}
