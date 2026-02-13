import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/awards - List awards (catalog + student redemptions)
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);

  const awardType = searchParams.get("awardType");
  const isActive = searchParams.get("isActive");
  const studentId = searchParams.get("studentId");
  const includeRedemptions = searchParams.get("includeRedemptions");

  try {
    // Build where clause
    const where: any = {};

    // Filter by centre (except SUPER_ADMIN)
    if (user.role !== "SUPER_ADMIN") {
      where.centreId = user.centerId;
    }

    // Apply filters
    if (awardType) {
      where.awardType = awardType;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // Default to active awards only for students/parents
    if (
      ["STUDENT", "PARENT"].includes(user.role) &&
      isActive === null
    ) {
      where.isActive = true;
    }

    const awards = await prisma.award.findMany({
      where,
      include: {
        centre: {
          select: {
            id: true,
            name: true,
          },
        },
        redemptions:
          includeRedemptions === "true"
            ? {
                where: studentId
                  ? {
                      studentId,
                    }
                  : user.role === "STUDENT"
                  ? {
                      studentId: user.id,
                    }
                  : {},
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
              }
            : false,
      },
      orderBy: [
        { awardType: "asc" },
        { xpCost: "asc" },
      ],
    });

    // If student is viewing, include their XP balance
    let studentXP = null;
    if (user.role === "STUDENT") {
      const gamProfile = await prisma.gamificationProfile.findUnique({
        where: { userId: user.id },
        select: { totalXP: true },
      });
      studentXP = gamProfile?.totalXP || 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        awards,
        studentXP,
      },
    });
  } catch (error) {
    console.error("Error fetching awards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch awards" },
      { status: 500 }
    );
  }
}

// POST /api/v1/awards - Create a new award
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only admins and teachers can create awards
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
    const {
      name,
      description,
      xpCost,
      awardType,
      imageUrl,
      stockQuantity,
      isActive,
    } = body;

    // Validation
    if (!name || !xpCost || !awardType) {
      return NextResponse.json(
        {
          success: false,
          error: "name, xpCost, and awardType are required",
        },
        { status: 400 }
      );
    }

    if (xpCost < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "xpCost must be non-negative",
        },
        { status: 400 }
      );
    }

    // Verify valid awardType
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

    // Create award
    const award = await prisma.award.create({
      data: {
        name,
        description,
        xpCost,
        awardType,
        imageUrl,
        stockQuantity: stockQuantity !== undefined ? stockQuantity : null,
        isActive: isActive !== undefined ? isActive : true,
        centreId: user.centerId!,
      },
      include: {
        centre: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: award,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating award:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create award" },
      { status: 500 }
    );
  }
}
