/**
 * Refunds API
 * 
 * GET /api/finance/refunds - List refund requests
 * POST /api/finance/refunds - Create refund request (status: PENDING)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery, validateCentreAccess, preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * GET /api/finance/refunds
 * List refund requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_REFUND_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);
    const status = searchParams.get("status");

    const where: any = { centreId };

    if (status) {
      where.status = status;
    }

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        payment: {
          include: {
            invoice: {
              include: {
                studentAccount: {
                  include: {
                    student: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ refunds });
  } catch (error: any) {
    console.error("Error fetching refunds:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/finance/refunds
 * Create refund request (status: PENDING)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_REFUND_REQUEST)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    preventCentreIdInjection(body);

    if (!body.paymentId || !body.amount || !body.reason) {
      return NextResponse.json(
        { error: "Missing required fields: paymentId, amount, reason" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: body.paymentId },
      include: {
        invoice: true,
        refunds: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    validateCentreAccess(session, payment.centreId);

    const refundAmount = new Decimal(body.amount);

    if (refundAmount.lte(0)) {
      return NextResponse.json(
        { error: "Refund amount must be positive" },
        { status: 400 }
      );
    }

    const totalRefunded = payment.refunds
      .filter(r => r.status !== "REJECTED")
      .reduce((sum, r) => sum.add(r.amount), new Decimal(0));

    if (totalRefunded.add(refundAmount).gt(payment.amount)) {
      return NextResponse.json(
        { error: "Refund amount exceeds payment amount" },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const count = await prisma.refund.count({
      where: { centreId: session.user.centerId }
    });
    const refundNumber = `REF-${year}-${String(count + 1).padStart(4, '0')}`;

    const refund = await prisma.refund.create({
      data: {
        refundNumber,
        paymentId: body.paymentId,
        amount: refundAmount,
        reason: body.reason,
        status: "PENDING",
        refundMethod: body.refundMethod,
        requestedById: session.user.id,
        centreId: session.user.centerId,
      },
      include: {
        payment: {
          include: {
            invoice: {
              include: {
                studentAccount: {
                  include: {
                    student: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await auditCreate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "Refund",
      refund.id,
      {
        refundNumber: refund.refundNumber,
        paymentId: refund.paymentId,
        amount: refund.amount.toString(),
        status: refund.status,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ refund }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating refund:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
