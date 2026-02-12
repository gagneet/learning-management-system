/**
 * Fee Plans API
 * 
 * GET /api/finance/fee-plans - List all fee plans (filtered by centre)
 * POST /api/finance/fee-plans - Create new fee plan
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery, preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * GET /api/finance/fee-plans
 * List all fee plans (filtered by centre)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_FEE_PLAN_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);
    const status = searchParams.get("status");

    const where: any = { centreId };

    if (status) {
      where.status = status;
    }

    const feePlans = await prisma.feePlan.findMany({
      where,
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ feePlans });
  } catch (error: any) {
    console.error("Error fetching fee plans:", error);
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
 * POST /api/finance/fee-plans
 * Create new fee plan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_FEE_PLAN_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    preventCentreIdInjection(body);

    if (!body.name || !body.amount || !body.frequency) {
      return NextResponse.json(
        { error: "Missing required fields: name, amount, frequency" },
        { status: 400 }
      );
    }

    const feePlan = await prisma.feePlan.create({
      data: {
        name: body.name,
        description: body.description,
        amount: body.amount,
        currency: body.currency || "USD",
        frequency: body.frequency,
        applicableCourses: body.applicableCourses,
        applicableClasses: body.applicableClasses,
        status: body.status || "ACTIVE",
        centreId: session.user.centerId,
      },
    });

    await auditCreate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "FeePlan",
      feePlan.id,
      {
        name: feePlan.name,
        amount: feePlan.amount.toString(),
        frequency: feePlan.frequency,
        status: feePlan.status,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ feePlan }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating fee plan:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
