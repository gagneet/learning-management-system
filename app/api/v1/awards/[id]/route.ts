import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  checkCenterAccess,
} from "@/lib/api-middleware";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  withErrorHandling,
} from "@/lib/api-utils";

// GET /api/v1/awards/:id - Get specific award
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { session } = authResult;
  const { user } = session;
  const { id: awardId } = await params;

  try {
    const award = await withErrorHandling(
      async () =>
        await prisma.award.findUnique({
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
        }),
      "fetching award"
    );

    if (!award) {
      return notFoundResponse("Award");
    }

    // Check centre access
    const accessError = checkCenterAccess(
      user.role,
      user.centerId,
      award.centreId
    );
    if (accessError) return accessError;

    return successResponse(award);
  } catch (error) {
    console.error("Error fetching award:", error);
    return errorResponse("Failed to fetch award");
  }
}

// PATCH /api/v1/awards/:id - Update award
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { session } = authResult;
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
    const existingAward = await prisma.award.findUnique({
      where: { id: awardId },
    });

    if (!existingAward) {
      return notFoundResponse("Award");
    }

    // Verify centre access
    const accessError = checkCenterAccess(
      user.role,
      user.centerId,
      existingAward.centreId
    );
    if (accessError) return accessError;

    // Build award update payload
    const awardUpdatePayload: Record<string, unknown> = {};

    if (name !== undefined) awardUpdatePayload.name = name;
    if (description !== undefined) awardUpdatePayload.description = description;

    if (xpCost !== undefined) {
      if (xpCost < 0) {
        return errorResponse("xpCost must be non-negative", 400);
      }
      awardUpdatePayload.xpCost = xpCost;
    }

    if (awardType !== undefined) {
      const validAwardTypes = ["GIFT", "STICKER", "COURSE_UNLOCK", "CUSTOM"];
      if (!validAwardTypes.includes(awardType)) {
        return errorResponse(
          `Invalid awardType. Must be one of: ${validAwardTypes.join(", ")}`,
          400
        );
      }
      awardUpdatePayload.awardType = awardType;
    }

    if (imageUrl !== undefined) awardUpdatePayload.imageUrl = imageUrl;
    if (stockQuantity !== undefined) awardUpdatePayload.stockQuantity = stockQuantity;
    if (isActive !== undefined) awardUpdatePayload.isActive = isActive;

    // Update award
    const updatedAward = await withErrorHandling(
      async () =>
        await prisma.award.update({
          where: { id: awardId },
          data: awardUpdatePayload,
          include: {
            centre: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
      "updating award"
    );

    return successResponse(updatedAward);
  } catch (error) {
    console.error("Error updating award:", error);
    return errorResponse("Failed to update award");
  }
}

// DELETE /api/v1/awards/:id - Delete award
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const { session } = authResult;
  const { user } = session;
  const { id: awardId } = await params;

  // Only admins can delete awards
  if (!["SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get existing award
    const existingAward = await prisma.award.findUnique({
      where: { id: awardId },
    });

    if (!existingAward) {
      return notFoundResponse("Award");
    }

    // Verify centre access
    const accessError = checkCenterAccess(
      user.role,
      user.centerId,
      existingAward.centreId
    );
    if (accessError) return accessError;

    // Delete award (will cascade delete redemptions)
    await withErrorHandling(
      async () =>
        await prisma.award.delete({
          where: { id: awardId },
        }),
      "deleting award"
    );

    return successResponse(null, "Award deleted successfully");
  } catch (error) {
    console.error("Error deleting award:", error);
    return errorResponse("Failed to delete award");
  }
}
