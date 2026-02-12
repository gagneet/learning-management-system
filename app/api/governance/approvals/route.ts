/**
 * Governance - Approvals API
 * 
 * GET /api/governance/approvals - List approval requests
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery } from "@/lib/tenancy";

/**
 * GET /api/governance/approvals
 * List approval requests with filters
 * 
 * Query params:
 * - status: Filter by status (PENDING, APPROVED, REJECTED)
 * - type: Filter by type (REFUND, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session, Permissions.APPROVAL_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Build where clause
    const where: any = { centreId };

    if (status) where.status = status;
    if (type) where.type = type;

    const approvals = await prisma.approvalRequest.findMany({
      where,
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
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
      take: 100,
    });

    return NextResponse.json({ approvals });
  } catch (error: any) {
    console.error("Error fetching approvals:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
