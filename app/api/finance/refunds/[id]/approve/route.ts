/**
 * Refund Approval API
 * 
 * POST /api/finance/refunds/[id]/approve - Approve refund (FINANCE_ADMIN only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess } from "@/lib/tenancy";
import { auditApprove } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * POST /api/finance/refunds/[id]/approve
 * Approve refund (FINANCE_ADMIN only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_REFUND_APPROVE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            invoice: {
              include: {
                studentAccount: true,
              },
            },
          },
        },
      },
    });

    if (!refund) {
      return NextResponse.json({ error: "Refund not found" }, { status: 404 });
    }

    validateCentreAccess(session, refund.centreId);

    if (refund.status !== "PENDING") {
      return NextResponse.json(
        { error: "Refund is not in PENDING status" },
        { status: 400 }
      );
    }

    const beforeState = {
      status: refund.status,
      approvedById: refund.approvedById,
      approvedAt: refund.approvedAt,
    };

    const updatedRefund = await prisma.refund.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
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
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const studentAccount = refund.payment.invoice.studentAccount;
    await prisma.studentAccount.update({
      where: { id: studentAccount.id },
      data: {
        totalRefunded: studentAccount.totalRefunded.add(refund.amount),
        balance: studentAccount.balance.add(refund.amount),
      },
    });

    await auditApprove(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "Refund",
      updatedRefund.id,
      beforeState,
      {
        status: updatedRefund.status,
        approvedById: updatedRefund.approvedById,
        approvedAt: updatedRefund.approvedAt?.toISOString(),
        amount: updatedRefund.amount.toString(),
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ refund: updatedRefund });
  } catch (error: any) {
    console.error("Error approving refund:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
