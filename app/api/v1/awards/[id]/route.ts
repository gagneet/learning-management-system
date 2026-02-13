import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/awards/:id - Get specific award
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: awardId } = await params;

  try {
    const award = await prisma.award.findUnique({
      where: { id: awardId },
      include: {
        centre: {
          select: {
            id: true,
            name: true,
          },
        },
        redemptions: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            redeemedAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!award) {
      return NextResponse.json(
        { success: false, error: "Award not found" },
        { status: 404 }
      );
    }

    // Check centre access
    if (user.role !== "SUPER_ADMIN" && award.centreId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: award,
    });
  } catch (error) {
    console.error("Error fetching award:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch award" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/awards/:id - Update award
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: awardId } = await params;

  // Only admins and teachers can update awards
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
    const { name, description, xpCost, awardType, imageUrl, stockQuantity, isActive } =
      body;

    // Get existing award
    const existing = await prisma.award.findUnique({
      where: { id: awardId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Award not found" },
        { status: 404 }
      );
    }

    // Verify centre access
    if (user.role !== "SUPER_ADMIN" && existing.centreId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (xpCost !== undefined) {
      if (xpCost < 0) {
        return NextResponse.json(
          {
            success: false,
            error: "xpCost must be non-negative",
          },
          { status: 400 }
        );
      }
      updateData.xpCost = xpCost;
    }

    if (awardType !== undefined) {
      const validAwardTypes = ["GIFT", "STICKER", "COURSE_UNLOCK", "CUSTOM"];
      if (!validAwardTypes.includes(awardType)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid awardType. Must be one of: ${validAwardTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.awardType = awardType;
    }

    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update award
    const award = await prisma.award.update({
      where: { id: awardId },
      data: updateData,
      include: {
        centre: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: award,
    });
  } catch (error) {
    console.error("Error updating award:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update award" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/awards/:id - Delete award
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: awardId } = await params;

  // Only admins can delete awards
  if (!["SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get existing award
    const existing = await prisma.award.findUnique({
      where: { id: awardId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Award not found" },
        { status: 404 }
      );
    }

    // Verify centre access
    if (user.role !== "SUPER_ADMIN" && existing.centreId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete award (will cascade delete redemptions)
    await prisma.award.delete({
      where: { id: awardId },
    });

    return NextResponse.json({
      success: true,
      message: "Award deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting award:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete award" },
      { status: 500 }
    );
  }
}
