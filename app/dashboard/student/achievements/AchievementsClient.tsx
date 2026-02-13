"use client";

import { useState } from "react";
import Link from "next/link";
import type { GamificationProfile, Badge, Achievement, BadgeAward, BadgeDefinition } from "@prisma/client";

type GamificationProfileWithRelations = GamificationProfile & {
  badges: Badge[];
  achievements: Achievement[];
};

type BadgeAwardWithDefinition = BadgeAward & {
  badge: BadgeDefinition;
};

interface AchievementsClientProps {
  gamificationProfile: GamificationProfileWithRelations | null;
  badgeAwards: BadgeAwardWithDefinition[];
  leaderboard: Array<{ name: string; xp: number; level: number }>;
  leaderboardOptIn: boolean;
}

type BadgeFilter = "ALL" | "COMPLETION" | "STREAK" | "MASTERY" | "SOCIAL" | "SPECIAL";

export function AchievementsClient({
  gamificationProfile,
  badgeAwards,
  leaderboard,
  leaderboardOptIn,
}: AchievementsClientProps) {
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("ALL");

  // Filter badges by type
  const filteredBadgeAwards = badgeFilter === "ALL"
    ? badgeAwards
    : badgeAwards.filter((ba) => ba.badge.category === badgeFilter);

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "BRONZE":
        return "from-orange-700 to-orange-900";
      case "SILVER":
        return "from-gray-400 to-gray-600";
      case "GOLD":
        return "from-yellow-400 to-yellow-600";
      case "PLATINUM":
        return "from-purple-400 to-purple-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/student"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          My Achievements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Showcase your badges, achievements, and progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl mb-2">⭐</div>
          <h3 className="text-lg font-semibold mb-1">Total XP</h3>
          <p className="text-4xl font-bold">{gamificationProfile?.xp || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-lg font-semibold mb-1">Level</h3>
          <p className="text-4xl font-bold">{gamificationProfile?.level || 1}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl mb-2">🎖️</div>
          <h3 className="text-lg font-semibold mb-1">Badges Earned</h3>
          <p className="text-4xl font-bold">{badgeAwards.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-6 shadow-lg">
          <div className="text-4xl mb-2">🔥</div>
          <h3 className="text-lg font-semibold mb-1">Current Streak</h3>
          <p className="text-4xl font-bold">{gamificationProfile?.streak || 0}</p>
          <p className="text-sm opacity-90">days</p>
        </div>
      </div>

      {/* Badge Collection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Badge Collection</h2>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setBadgeFilter("ALL")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              badgeFilter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All ({badgeAwards.length})
          </button>
          <button
            onClick={() => setBadgeFilter("COMPLETION")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              badgeFilter === "COMPLETION"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Completion
          </button>
          <button
            onClick={() => setBadgeFilter("STREAK")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              badgeFilter === "STREAK"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Streak
          </button>
          <button
            onClick={() => setBadgeFilter("MASTERY")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              badgeFilter === "MASTERY"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Mastery
          </button>
          <button
            onClick={() => setBadgeFilter("SOCIAL")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              badgeFilter === "SOCIAL"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Social
          </button>
          <button
            onClick={() => setBadgeFilter("SPECIAL")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              badgeFilter === "SPECIAL"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Special
          </button>
        </div>

        {/* Badge Grid */}
        {filteredBadgeAwards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredBadgeAwards.map((badgeAward) => (
              <div
                key={badgeAward.id}
                className={`bg-gradient-to-br ${getTierColor(badgeAward.badge.tier)} p-6 rounded-xl text-center shadow-lg hover:shadow-xl transition transform hover:-translate-y-1`}
              >
                <div className="text-5xl mb-3">{badgeAward.badge.iconUrl || "🏅"}</div>
                <h4 className="font-bold text-white mb-1">{badgeAward.badge.name}</h4>
                <p className="text-xs text-white opacity-90 mb-2">{badgeAward.badge.tier}</p>
                <p className="text-xs text-white opacity-75">
                  {new Date(badgeAward.awardedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎖️</div>
            <p className="text-gray-600 dark:text-gray-400">
              {badgeFilter === "ALL"
                ? "No badges earned yet. Keep learning to unlock badges!"
                : `No ${badgeFilter.toLowerCase()} badges earned yet.`}
            </p>
          </div>
        )}
      </div>

      {/* Achievements Showcase */}
      {gamificationProfile && gamificationProfile.achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Achievements Showcase
          </h2>
          <div className="space-y-4">
            {gamificationProfile.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {achievement.title}
                    </h4>
                    {achievement.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {achievement.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                        {achievement.category}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                      </span>
                      {achievement.value && (
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {achievement.value}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {leaderboardOptIn && leaderboard.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Leaderboard - Top 10 Students
          </h2>
          <div className="space-y-3">
            {leaderboard.map((student, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40"
                    : index === 1
                    ? "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600"
                    : index === 2
                    ? "bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40"
                    : "bg-gray-50 dark:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 w-8">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Level {student.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{student.xp}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
