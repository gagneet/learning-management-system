import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/award-redemptions - List award redemptions
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);

  const studentId = searchParams.get("studentId");
  const awardId = searchParams.get("awardId");
  const fulfilled = searchParams.get("fulfilled");

  try {
    // Build where clause based on role and filters
    const where: any = {};

    // Authorization
    if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      // Parents can see their children's redemptions
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });

      where.studentId = {
        in: children.map((child) => child.id),
      };
    } else if (user.role !== "SUPER_ADMIN") {
      // Teachers, supervisors, admins - filter by centre
      where.student = {
        centerId: user.centerId,
      };
    }

    // Apply filters
    if (studentId && user.role !== "STUDENT") {
      where.studentId = studentId;
    }

    if (awardId) {
      where.awardId = awardId;
    }

    if (fulfilled === "true") {
      where.fulfilledAt = { not: null };
    } else if (fulfilled === "false") {
      where.fulfilledAt = null;
    }

    const redemptions = await prisma.awardRedemption.findMany({
      where,
      include: {
        award: {
          select: {
            id: true,
            name: true,
            description: true,
            awardType: true,
            xpCost: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { fulfilledAt: "asc" }, // Unfulfilled first (nulls first)
        { redeemedAt: "desc" }, // Most recent first
      ],
    });

    return NextResponse.json({
      success: true,
      data: redemptions,
    });
  } catch (error) {
    console.error("Error fetching award redemptions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch award redemptions" },
      { status: 500 }
    );
  }
}
