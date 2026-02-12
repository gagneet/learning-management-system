import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default async function StudentGamificationPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch gamification profile first to get ID for achievements
  const gamificationProfile = await prisma.gamificationProfile.findUnique({
    where: { userId: user.id },
    include: {
      achievements: {
        orderBy: { earnedAt: "desc" },
        take: 10,
      },
    },
  });

  // Fetch remaining data
  const [recentXPTransactions, allBadges, currentStreak] = await Promise.all([
    prisma.xPTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.badgeAward.findMany({
      where: { userId: user.id },
      include: {
        badge: true,
      },
      orderBy: { awardedAt: "desc" },
    }),
    prisma.streak.findFirst({
      where: {
        userId: user.id,
        currentStreak: { gt: 0 },
      },
    }),
  ]);

  const allAchievements = gamificationProfile?.achievements || [];

  const xpToNextLevel = gamificationProfile
    ? (gamificationProfile.level + 1) * 100 - (gamificationProfile.totalXP || 0)
    : 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                LMS
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-600 dark:text-gray-300">My Achievements</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Achievements
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your progress, badges, and achievements
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {gamificationProfile?.totalXP || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total XP</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Level {gamificationProfile?.level || 1}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{xpToNextLevel} XP to next level</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {allBadges.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Badges Earned</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {currentStreak?.currentStreak || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
        </div>

        {/* Progress Bar */}
        {gamificationProfile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Level Progress
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {gamificationProfile.level}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>{gamificationProfile.totalXP || 0} XP</span>
                  <span>{(gamificationProfile.level + 1) * 100} XP</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all"
                    style={{
                      width: `${
                        (((gamificationProfile.totalXP || 0) % 100) / 100) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {gamificationProfile.level + 1}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Badges */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              My Badges ({allBadges.length})
            </h2>

            {allBadges.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏅</div>
                <p className="text-gray-500 dark:text-gray-400">No badges earned yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Complete lessons and achieve milestones to earn badges!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {allBadges.map((award) => (
                  <div
                    key={award.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition-shadow"
                  >
                    <div className="text-4xl mb-2">
                      {award.badge.type === "COMPLETION"
                        ? "🎓"
                        : award.badge.type === "STREAK"
                        ? "🔥"
                        : award.badge.type === "MASTERY"
                        ? "🏆"
                        : award.badge.type === "PARTICIPATION"
                        ? "🌟"
                        : "⭐"}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                      {award.badge.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {award.badge.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(award.awardedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Achievements ({allAchievements.length})
            </h2>

            {allAchievements.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-gray-500 dark:text-gray-400">No achievements unlocked yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Keep learning to unlock achievements!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🏅</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        Category: {achievement.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent XP Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Recent XP Activity
          </h2>

          {recentXPTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-gray-500 dark:text-gray-400">No XP activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentXPTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.description || 'XP earned'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-lg font-bold text-green-600">+{transaction.amount} XP</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
