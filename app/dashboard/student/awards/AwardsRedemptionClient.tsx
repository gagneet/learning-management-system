"use client";

import { useState } from "react";
import Link from "next/link";
import type { Award, AwardRedemption } from "@prisma/client";

type RedemptionWithAward = AwardRedemption & {
  award: Award;
};

interface AwardsRedemptionClientProps {
  currentXP: number;
  awards: Award[];
  redemptions: RedemptionWithAward[];
  studentId: string;
}

type AwardTypeFilter = "ALL" | "GIFT" | "STICKER" | "COURSE_UNLOCK" | "CUSTOM";
type RedemptionStatusFilter = "ALL" | "PENDING" | "FULFILLED" | "REJECTED";

export function AwardsRedemptionClient({
  currentXP,
  awards,
  redemptions,
  studentId,
}: AwardsRedemptionClientProps) {
  const [awardTypeFilter, setAwardTypeFilter] = useState<AwardTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<RedemptionStatusFilter>("ALL");

  // Filter awards by type
  const filteredAwards = awardTypeFilter === "ALL"
    ? awards
    : awards.filter((a) => a.awardType === awardTypeFilter);

  // Filter redemptions by status
  const filteredRedemptions = statusFilter === "ALL"
    ? redemptions
    : redemptions.filter((r) => r.status === statusFilter);

  // Get award type icon
  const getAwardTypeIcon = (type: string) => {
    switch (type) {
      case "GIFT":
        return "🎁";
      case "STICKER":
        return "⭐";
      case "COURSE_UNLOCK":
        return "🔓";
      case "CUSTOM":
        return "🎨";
      default:
        return "🏆";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "FULFILLED":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "REJECTED":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  // Check if student can afford an award
  const canAfford = (xpCost: number) => currentXP >= xpCost;

  // Handle redemption
  const handleRedeem = async (awardId: string, xpCost: number) => {
    if (!canAfford(xpCost)) {
      alert("Not enough XP to redeem this award!");
      return;
    }

    // TODO: Implement API call to create redemption request
    console.log("Redeeming award:", awardId);
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
          Awards & Rewards
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Redeem your XP for exciting rewards!
        </p>
      </div>

      {/* XP Balance Banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl p-8 mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-7xl">⭐</div>
            <div>
              <h3 className="text-xl font-semibold mb-1">Your XP Balance</h3>
              <p className="text-6xl font-bold">{currentXP}</p>
              <p className="text-yellow-100 mt-2">Keep earning XP to unlock more rewards!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Rewards Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Available Rewards</h2>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setAwardTypeFilter("ALL")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              awardTypeFilter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All Rewards
          </button>
          <button
            onClick={() => setAwardTypeFilter("GIFT")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              awardTypeFilter === "GIFT"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            🎁 Gifts
          </button>
          <button
            onClick={() => setAwardTypeFilter("STICKER")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              awardTypeFilter === "STICKER"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            ⭐ Stickers
          </button>
          <button
            onClick={() => setAwardTypeFilter("COURSE_UNLOCK")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              awardTypeFilter === "COURSE_UNLOCK"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            🔓 Course Unlocks
          </button>
          <button
            onClick={() => setAwardTypeFilter("CUSTOM")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              awardTypeFilter === "CUSTOM"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            🎨 Custom
          </button>
        </div>

        {/* Awards Grid */}
        {filteredAwards.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAwards.map((award) => {
              const affordable = canAfford(award.xpCost);
              return (
                <div
                  key={award.id}
                  className={`border-2 rounded-xl p-6 transition ${
                    affordable
                      ? "border-blue-300 dark:border-blue-600 hover:shadow-lg"
                      : "border-gray-200 dark:border-gray-700 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl">{getAwardTypeIcon(award.awardType)}</div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {award.xpCost}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">XP</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {award.name}
                  </h3>

                  {award.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {award.description}
                    </p>
                  )}

                  {award.stockQuantity !== null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Stock: {award.stockQuantity > 0 ? award.stockQuantity : "Out of stock"}
                    </p>
                  )}

                  <button
                    onClick={() => handleRedeem(award.id, award.xpCost)}
                    disabled={!affordable || (award.stockQuantity !== null && award.stockQuantity === 0)}
                    className={`w-full py-3 rounded-lg font-medium transition ${
                      affordable && (award.stockQuantity === null || award.stockQuantity > 0)
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {!affordable
                      ? `Need ${award.xpCost - currentXP} more XP`
                      : award.stockQuantity !== null && award.stockQuantity === 0
                      ? "Out of Stock"
                      : "Redeem"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-600 dark:text-gray-400">
              No rewards available at the moment. Check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Redemption History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Redemption History</h2>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            All ({redemptions.length})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "PENDING"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Pending ({redemptions.filter((r) => r.status === "PENDING").length})
          </button>
          <button
            onClick={() => setStatusFilter("FULFILLED")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "FULFILLED"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Fulfilled ({redemptions.filter((r) => r.status === "FULFILLED").length})
          </button>
          <button
            onClick={() => setStatusFilter("REJECTED")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              statusFilter === "REJECTED"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Rejected ({redemptions.filter((r) => r.status === "REJECTED").length})
          </button>
        </div>

        {/* Redemption List */}
        {filteredRedemptions.length > 0 ? (
          <div className="space-y-4">
            {filteredRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">{getAwardTypeIcon(redemption.award.awardType)}</div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {redemption.award.name}
                      </h4>
                      <div className="flex items-center gap-3 text-sm mb-2">
                        <span className={`px-3 py-1 rounded-full font-medium ${getStatusBadge(redemption.status)}`}>
                          {redemption.status}
                        </span>
                        <span className="text-orange-600 dark:text-orange-400 font-semibold">
                          {redemption.xpSpent} XP
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Redeemed: {new Date(redemption.redeemedAt).toLocaleDateString()}
                      </p>
                      {redemption.fulfilledAt && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Fulfilled: {new Date(redemption.fulfilledAt).toLocaleDateString()}
                        </p>
                      )}
                      {redemption.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Note: {redemption.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📜</div>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === "ALL"
                ? "No redemptions yet. Start earning XP and redeem your first reward!"
                : `No ${statusFilter.toLowerCase()} redemptions.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
