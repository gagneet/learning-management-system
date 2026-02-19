/**
 * Gamification Utility Functions
 * Provides reusable XP and badge management functions
 */

import { prisma } from "@/lib/prisma";
import { XPSource } from "@prisma/client";

export type { XPSource };

/**
 * Awards XP to a user and updates their gamification profile
 * @param userId User to award XP to
 * @param amount Amount of XP to award
 * @param description Description of why XP was awarded
 * @param source Source of the XP transaction
 * @param tx Optional Prisma transaction client
 */
export async function awardXP(
  userId: string,
  amount: number,
  description: string,
  source: XPSource,
  tx?: typeof prisma
) {
  const client = tx || prisma;

  await client.$transaction(async (transaction) => {
    // Create XP transaction record
    await transaction.xPTransaction.create({
      data: {
        userId,
        amount,
        description,
        source,
      },
    });

    // Update gamification profile
    await transaction.gamificationProfile.update({
      where: { userId },
      data: {
        totalXP: { increment: amount },
      },
    });
  });
}

/**
 * Deducts XP from a user (for award redemption, etc.)
 * @param userId User to deduct XP from
 * @param amount Amount of XP to deduct (positive number)
 * @param description Description of why XP was deducted
 * @param source Source of the XP transaction
 */
export async function deductXP(
  userId: string,
  amount: number,
  description: string,
  source: XPSource
) {
  await prisma.$transaction(async (tx) => {
    // Create XP transaction with negative amount
    await tx.xPTransaction.create({
      data: {
        userId,
        amount: -Math.abs(amount),
        description,
        source,
      },
    });

    // Update gamification profile
    await tx.gamificationProfile.update({
      where: { userId },
      data: {
        totalXP: { decrement: Math.abs(amount) },
      },
    });
  });
}

/**
 * Gets user's current XP balance
 * @param userId User ID
 * @returns Current XP total or null if profile doesn't exist
 */
export async function getUserXP(userId: string): Promise<number | null> {
  const profile = await prisma.gamificationProfile.findUnique({
    where: { userId },
    select: { totalXP: true },
  });

  return profile?.totalXP ?? null;
}

/**
 * Checks if user has enough XP for a transaction
 * @param userId User ID
 * @param requiredXP Amount of XP required
 * @returns true if user has enough XP, false otherwise
 */
export async function hasEnoughXP(
  userId: string,
  requiredXP: number
): Promise<boolean> {
  const currentXP = await getUserXP(userId);
  return currentXP !== null && currentXP >= requiredXP;
}

/**
 * Gets a student with their gamification profile
 * Commonly used pattern across API routes
 */
export async function getStudentWithGamification(studentId: string) {
  return await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      centerId: true,
      gamificationProfile: {
        select: {
          totalXP: true,
          level: true,
          streak: true,
        },
      },
    },
  });
}
