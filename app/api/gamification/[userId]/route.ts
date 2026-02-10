import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/gamification/[userId] - Get gamification profile for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { userId } = await params;

  try {
    // Check if user has permission to view this profile
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, centerId: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Students can only view their own profile
    if (user.role === "STUDENT" && userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role !== "SUPER_ADMIN" && targetUser.centerId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get or create gamification profile
    let profile = await prisma.gamificationProfile.findUnique({
      where: { userId },
      include: {
        badges: {
          orderBy: { earnedAt: "desc" },
        },
        achievements: {
          orderBy: { earnedAt: "desc" },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create profile if it doesn't exist (for students)
    if (!profile && targetUser.role === "STUDENT") {
      profile = await prisma.gamificationProfile.create({
        data: {
          userId,
        },
        include: {
          badges: true,
          achievements: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching gamification profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch gamification profile" },
      { status: 500 }
    );
  }
}
