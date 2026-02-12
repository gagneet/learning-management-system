/**
 * Approval API - Approve approval request
 * 
 * POST /api/governance/approvals/[id]/approve - Approve a pending approval request
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess } from "@/lib/tenancy";
import { auditApprove } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * POST /api/governance/approvals/[id]/approve
 * Approve an approval request
 * 
 * Body:
 * - comments: string (optional)
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

    if (!hasPermission(session, Permissions.APPROVAL_APPROVE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get approval request
    const approval = await prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!approval) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    // Validate centre access
    validateCentreAccess(session, approval.centreId);

    // Check if already processed
    if (approval.status !== "PENDING") {
      return NextResponse.json(
        { error: `Approval request is already ${approval.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check specific approval permissions based on type
    if (approval.type === "REFUND" && !hasPermission(session, Permissions.FINANCE_REFUND_APPROVE)) {
      return NextResponse.json({ error: "Forbidden - Missing refund approval permission" }, { status: 403 });
    }

    // Update approval request
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedById: session.user.id,
        approvedAt: new Date(),
        comment: body.comments,
      },
      include: {
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

    // Handle specific approval types
    if (approval.type === "REFUND") {
      // Find and update related refund
      const refund = await prisma.refund.findFirst({
        where: { approvalRequestId: approval.id },
      });

      if (refund) {
        await prisma.refund.update({
          where: { id: refund.id },
          data: {
            status: "APPROVED",
            approvedById: session.user.id,
            approvedAt: new Date(),
          },
        });
      }
    }

    // Audit log
    await auditApprove(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "ApprovalRequest",
      updatedApproval.id,
      {
        type: updatedApproval.type,
        status: updatedApproval.status,
      },
      session.user.centerId || '',
      request.headers.get("x-forwarded-for") || ''
    );

    return NextResponse.json({ approval: updatedApproval });
  } catch (error: any) {
    console.error("Error approving request:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
