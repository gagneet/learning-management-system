import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AwardsRedemptionClient } from "./AwardsRedemptionClient";

export default async function AwardsRedemptionPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch gamification profile for XP balance
  const gamificationProfile = await prisma.gamificationProfile.findUnique({
    where: {
      userId: user.id,
    },
  });

  // Fetch available awards for the center
  const availableAwards = await prisma.award.findMany({
    where: {
      centreId: user.centerId!,
      isActive: true,
    },
    orderBy: {
      xpCost: "asc",
    },
  });

  // Fetch redemption history
  const redemptions = await prisma.awardRedemption.findMany({
    where: {
      studentId: user.id,
    },
    include: {
      award: true,
    },
    orderBy: {
      redeemedAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Awards & Rewards"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/student" },
          { label: "Awards" },
        ]}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <AwardsRedemptionClient
          currentXP={gamificationProfile?.xp || 0}
          awards={availableAwards}
          redemptions={redemptions}
          studentId={user.id}
        />
      </main>
    </div>
  );
}
