/**
 * Approval API - Reject approval request
 * 
 * POST /api/governance/approvals/[id]/reject - Reject a pending approval request
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess } from "@/lib/tenancy";
import { auditReject } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * POST /api/governance/approvals/[id]/reject
 * Reject an approval request
 * 
 * Body:
 * - comments: string (required - reason for rejection)
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

    // Require rejection reason
    if (!body.comments) {
      return NextResponse.json(
        { error: "Rejection reason (comments) is required" },
        { status: 400 }
      );
    }

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

    // Update approval request
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedById: session.user.id,
        approvedAt: new Date(),
        approverComments: body.comments,
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
    if (approval.type === "REFUND" && approval.relatedId) {
      // Update refund status
      await prisma.refund.update({
        where: { id: approval.relatedId },
        data: {
          status: "REJECTED",
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      });
    }

    // Audit log
    await auditReject(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "ApprovalRequest",
      updatedApproval.id,
      {
        type: updatedApproval.type,
        relatedId: updatedApproval.relatedId,
        status: updatedApproval.status,
        reason: body.comments,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ approval: updatedApproval });
  } catch (error: any) {
    console.error("Error rejecting request:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
