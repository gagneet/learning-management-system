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

  // Fetch parent's children with all related data in a single optimized query
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
      academicProfile: true,
      gamificationProfile: {
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
      },
      enrollments: {
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
      },
      studentSessionEnrollments: {
        where: {
          session: {
            startTime: {
              gte: now,
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
      },
      studentHomework: {
        where: {
          dueDate: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          exercise: {
            select: {
              id: true,
              title: true,
              exerciseType: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
        take: 10,
      },
    },
  });

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Parent Dashboard" />
        <main id="main-content" className="container mx-auto px-4 py-8 flex-1 scroll-mt-20">
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

  // Process children data to match expected format
  const childrenData = children.map((child) => {
    // Split sessions into upcoming (next 7 days) and today's sessions
    const upcomingSessions = child.studentSessionEnrollments.filter(
      (enrollment) =>
        enrollment.session.startTime >= now &&
        enrollment.session.startTime <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    );

    const todaySessions = child.studentSessionEnrollments.filter(
      (enrollment) =>
        enrollment.session.startTime >= todayStart &&
        enrollment.session.startTime < todayEnd
    );

    return {
      id: child.id,
      name: child.name,
      email: child.email,
      avatar: child.avatar,
      academicProfile: child.academicProfile,
      gamificationProfile: child.gamificationProfile,
      enrollments: child.enrollments,
      upcomingSessions,
      todaySessions,
      homeworkAssignments: child.studentHomework,
      recentActivity: [], // Can be populated separately if needed
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Parent Dashboard" />

      <main id="main-content" className="container mx-auto px-4 py-8 flex-1 scroll-mt-20">
        <ParentDashboardClient
          parentName={user.name!}
          childrenData={childrenData}
        />
      </main>
    </div>
  );
}
