import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AchievementsClient } from "./AchievementsClient";

export default async function AchievementsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch gamification profile with badges and achievements
  const gamificationProfile = await prisma.gamificationProfile.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      badges: {
        orderBy: { earnedAt: "desc" },
      },
      achievements: {
        orderBy: { earnedAt: "desc" },
      },
    },
  });

  // Fetch badge awards with definitions
  const badgeAwards = await prisma.badgeAward.findMany({
    where: {
      userId: user.id,
    },
    include: {
      badge: true,
    },
    orderBy: {
      awardedAt: "desc",
    },
  });

  // Fetch leaderboard opt-in status
  const leaderboardOptIn = await prisma.leaderboardOptIn.findUnique({
    where: {
      userId: user.id,
    },
  });

  // Fetch leaderboard data if opted in
  let leaderboard: Array<{ name: string; xp: number; level: number }> = [];
  if (leaderboardOptIn?.enabled) {
    const topStudents = await prisma.gamificationProfile.findMany({
      where: {
        user: {
          role: "STUDENT",
          centerId: user.centerId,
          leaderboardOptIn: {
            enabled: true,
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        xp: "desc",
      },
      take: 10,
    });

    leaderboard = topStudents.map((profile) => ({
      name: profile.user.name,
      xp: profile.xp,
      level: profile.level,
    }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Achievements"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/student" },
          { label: "Achievements" },
        ]}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <AchievementsClient
          gamificationProfile={gamificationProfile}
          badgeAwards={badgeAwards}
          leaderboard={leaderboard}
          leaderboardOptIn={leaderboardOptIn?.enabled || false}
        />
      </main>
    </div>
  );
}
