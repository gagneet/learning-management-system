import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { APP_CONFIG } from "@/lib/config/constants";

// GET /api/financial/transactions - List financial transactions
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const centerId = searchParams.get("centerId");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(APP_CONFIG.DEFAULT_PAGE_SIZE)),
    APP_CONFIG.MAX_TRANSACTIONS_PER_PAGE
  );

  try {
    const where: any = {};

    // Non-super-admins can only see transactions in their center
    if (user.role !== "SUPER_ADMIN") {
      where.centerId = user.centerId;
    } else if (centerId) {
      where.centerId = centerId;
    }

    // Role-based record filtering
    if (["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR", "FINANCE_ADMIN"].includes(user.role)) {
      // Admins can see any user's transactions in their center
      if (userId) {
        where.userId = userId;
      }
    } else if (user.role === "PARENT") {
      // Parents can see their own or their children's transactions
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      const allowedIds = [user.id, ...children.map((c) => c.id)];

      if (userId) {
        if (!allowedIds.includes(userId)) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        where.userId = userId;
      } else {
        where.userId = { in: allowedIds };
      }
    } else {
      // Students, Teachers, and other roles can only see their own transactions
      if (userId && userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      where.userId = user.id;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          center: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/financial/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only admins, supervisors, and finance admins can create transactions
  if (!["CENTER_SUPERVISOR", "CENTER_ADMIN", "FINANCE_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, amount, type, description, status, metadata } = body;

    if (!userId || !amount || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, centerId: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Non-super-admins can only create transactions in their center
    const targetCenterId =
      user.role === "SUPER_ADMIN" ? targetUser.centerId : user.centerId;

    if (user.role !== "SUPER_ADMIN" && targetUser.centerId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create transaction
    const transaction = await prisma.financialTransaction.create({
      data: {
        userId,
        centerId: targetCenterId,
        amount,
        type,
        description,
        status: status || "pending",
        metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        center: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
