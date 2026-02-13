import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { ParentDashboardClient } from "./ParentDashboardClient";

export default async function ParentDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "PARENT") {
    redirect("/dashboard");
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Fetch parent's children
  const children = await prisma.user.findMany({
    where: {
      parentId: user.id,
      role: "STUDENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Parent Dashboard" />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Children Linked
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please contact your center administrator to link your children&apos;s accounts.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Fetch data for all children
  const childrenData = await Promise.all(
    children.map(async (child) => {
      const [
        academicProfile,
        gamificationProfile,
        enrollments,
        upcomingSessions,
        todaySessions,
        homeworkAssignments,
        recentActivity,
      ] = await Promise.all([
        // Academic Profile
        prisma.academicProfile.findUnique({
          where: { userId: child.id },
        }),

        // Gamification Profile
        prisma.gamificationProfile.findUnique({
          where: { userId: child.id },
          include: {
            badges: {
              orderBy: { earnedAt: "desc" },
              take: 5,
            },
            achievements: {
              orderBy: { earnedAt: "desc" },
              take: 5,
            },
          },
        }),

        // Enrollments with progress
        prisma.enrollment.findMany({
          where: { userId: child.id },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                teacher: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        }),

        // Upcoming Sessions (next 7 days)
        prisma.studentSessionEnrollment.findMany({
          where: {
            studentId: child.id,
            session: {
              startTime: {
                gte: now,
                lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
              },
              status: {
                in: ["SCHEDULED", "LIVE"],
              },
            },
          },
          include: {
            session: {
              select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                duration: true,
                sessionMode: true,
                physicalLocation: true,
                status: true,
                tutor: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            course: {
              select: {
                title: true,
              },
            },
            lesson: {
              select: {
                title: true,
              },
            },
          },
          orderBy: {
            session: {
              startTime: "asc",
            },
          },
          take: 10,
        }),

        // Today's Sessions
        prisma.studentSessionEnrollment.findMany({
          where: {
            studentId: child.id,
            session: {
              startTime: {
                gte: todayStart,
                lt: todayEnd,
              },
            },
          },
          include: {
            session: {
              select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                duration: true,
                status: true,
                sessionMode: true,
                physicalLocation: true,
                tutor: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            course: {
              select: {
                title: true,
              },
            },
          },
          orderBy: {
            session: {
              startTime: "asc",
            },
          },
        }),

        // Homework Assignments (pending and recent)
        prisma.homeworkAssignment.findMany({
          where: {
            studentId: child.id,
            status: {
              in: ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED"],
            },
          },
          include: {
            course: {
              select: {
                title: true,
              },
            },
            exercise: {
              select: {
                title: true,
              },
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 10,
        }),

        // Recent Activity (last 30 days)
        prisma.exerciseAttempt.findMany({
          where: {
            studentId: child.id,
            submittedAt: {
              gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            exercise: {
              select: {
                title: true,
                exerciseType: true,
              },
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
          take: 20,
        }),
      ]);

      return {
        ...child,
        academicProfile,
        gamificationProfile,
        enrollments,
        upcomingSessions,
        todaySessions,
        homeworkAssignments,
        recentActivity,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Parent Dashboard" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <ParentDashboardClient
          parentName={user.name!}
          childrenData={childrenData}
        />
      </main>
    </div>
  );
}
