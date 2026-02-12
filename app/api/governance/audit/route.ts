/**
 * Governance - Audit Log API
 * 
 * GET /api/governance/audit - View audit events (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery } from "@/lib/tenancy";

/**
 * GET /api/governance/audit
 * View audit log with filters (admin only)
 * 
 * Query params:
 * - userId: Filter by user
 * - action: Filter by action (CREATE, UPDATE, DELETE, APPROVE, REJECT, ESCALATE)
 * - resourceType: Filter by resource type
 * - startDate: Filter from date
 * - endDate: Filter to date
 * - page: Page number (default: 1)
 * - perPage: Results per page (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only admins can view audit log
    if (!hasPermission(session, Permissions.AUDIT_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const resourceType = searchParams.get("resourceType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = Math.min(parseInt(searchParams.get("perPage") || "50"), 100);

    // Build where clause
    const where: any = { centreId };

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Fetch audit events with pagination
    const [auditEvents, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return NextResponse.json({
      auditEvents,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error: any) {
    console.error("Error fetching audit log:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
