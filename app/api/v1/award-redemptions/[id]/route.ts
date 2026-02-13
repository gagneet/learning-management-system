import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/award-redemptions/:id - Get specific redemption
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: redemptionId } = await params;

  try {
    const redemption = await prisma.awardRedemption.findUnique({
      where: { id: redemptionId },
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
            centerId: true,
            parentId: true,
          },
        },
      },
    });

    if (!redemption) {
      return NextResponse.json(
        { success: false, error: "Redemption not found" },
        { status: 404 }
      );
    }

    // Authorization
    if (user.role === "STUDENT" && redemption.studentId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (user.role === "PARENT") {
      if (redemption.student.parentId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      !["STUDENT", "PARENT"].includes(user.role)
    ) {
      if (redemption.student.centerId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: redemption,
    });
  } catch (error) {
    console.error("Error fetching redemption:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch redemption" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/award-redemptions/:id - Update redemption (fulfill or add notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: redemptionId } = await params;

  // Only admins and teachers can update redemptions
  if (
    ![
      "SUPER_ADMIN",
      "CENTER_ADMIN",
      "CENTER_SUPERVISOR",
      "TEACHER",
    ].includes(user.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { fulfilled, notes } = body;

    // Get existing redemption
    const existing = await prisma.awardRedemption.findUnique({
      where: { id: redemptionId },
      include: {
        student: {
          select: {
            id: true,
            centerId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Redemption not found" },
        { status: 404 }
      );
    }

    // Verify centre access
    if (
      user.role !== "SUPER_ADMIN" &&
      existing.student.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};

    if (fulfilled === true && !existing.fulfilledAt) {
      updateData.fulfilledAt = new Date();
    } else if (fulfilled === false && existing.fulfilledAt) {
      updateData.fulfilledAt = null;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update redemption
    const redemption = await prisma.awardRedemption.update({
      where: { id: redemptionId },
      data: updateData,
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
            gamificationProfile: {
              select: {
                totalXP: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: redemption,
    });
  } catch (error) {
    console.error("Error updating redemption:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update redemption" },
      { status: 500 }
    );
  }
}
