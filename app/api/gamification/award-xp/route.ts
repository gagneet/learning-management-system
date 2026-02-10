import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/gamification/award-xp - Award XP to a user
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only teachers, supervisors, and admins can award XP
  if (!["TEACHER", "CENTER_SUPERVISOR", "CENTER_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, xp, reason } = body;

    if (!userId || !xp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if target user exists and is in the same center
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, centerId: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && targetUser.centerId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get or create gamification profile
    let profile = await prisma.gamificationProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.gamificationProfile.create({
        data: { userId },
      });
    }

    // Calculate new XP and level
    const newXp = profile.xp + xp;
    const newLevel = Math.floor(newXp / 100) + 1; // Simple level calculation: 100 XP per level

    // Update streak if active today
    const now = new Date();
    const lastActivity = profile.lastActivityAt;
    let newStreak = profile.streak;

    if (lastActivity) {
      const daysSinceLastActivity = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastActivity === 0) {
        // Same day, keep streak
        newStreak = profile.streak;
      } else if (daysSinceLastActivity === 1) {
        // Consecutive day, increment streak
        newStreak = profile.streak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Update profile
    const updatedProfile = await prisma.gamificationProfile.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastActivityAt: now,
      },
      include: {
        badges: true,
        achievements: true,
      },
    });

    return NextResponse.json({
      profile: updatedProfile,
      awarded: {
        xp,
        reason,
        levelUp: newLevel > profile.level,
      },
    });
  } catch (error) {
    console.error("Error awarding XP:", error);
    return NextResponse.json(
      { error: "Failed to award XP" },
      { status: 500 }
    );
  }
}
