import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/gamification/award-badge - Award a badge to a user
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only teachers, supervisors, and admins can award badges
  if (!["TEACHER", "CENTER_SUPERVISOR", "CENTER_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, name, description, type, iconUrl } = body;

    if (!userId || !name || !type) {
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

    // Create badge
    const badge = await prisma.badge.create({
      data: {
        profileId: profile.id,
        name,
        description,
        type,
        iconUrl,
      },
    });

    return NextResponse.json(badge);
  } catch (error) {
    console.error("Error awarding badge:", error);
    return NextResponse.json(
      { error: "Failed to award badge" },
      { status: 500 }
    );
  }
}
