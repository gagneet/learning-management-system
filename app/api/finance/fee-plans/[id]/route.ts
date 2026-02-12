/**
 * Single Fee Plan API
 * 
 * GET /api/finance/fee-plans/[id] - Get fee plan details
 * PUT /api/finance/fee-plans/[id] - Update fee plan
 * DELETE /api/finance/fee-plans/[id] - Delete fee plan (if no active invoices)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess, preventCentreIdInjection } from "@/lib/tenancy";
import { auditUpdate, auditDelete } from "@/lib/audit";
import { Role } from "@prisma/client";

/**
 * GET /api/finance/fee-plans/[id]
 * Get fee plan details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_FEE_PLAN_VIEW)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const feePlan = await prisma.feePlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    if (!feePlan) {
      return NextResponse.json({ error: "Fee plan not found" }, { status: 404 });
    }

    validateCentreAccess(session, feePlan.centreId);

    return NextResponse.json({ feePlan });
  } catch (error: any) {
    console.error("Error fetching fee plan:", error);
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
 * PUT /api/finance/fee-plans/[id]
 * Update fee plan
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_FEE_PLAN_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    preventCentreIdInjection(body);

    const existingPlan = await prisma.feePlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Fee plan not found" }, { status: 404 });
    }

    validateCentreAccess(session, existingPlan.centreId);

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.applicableCourses !== undefined) updateData.applicableCourses = body.applicableCourses;
    if (body.applicableClasses !== undefined) updateData.applicableClasses = body.applicableClasses;
    if (body.status !== undefined) updateData.status = body.status;

    const beforeState = {
      name: existingPlan.name,
      amount: existingPlan.amount.toString(),
      frequency: existingPlan.frequency,
      status: existingPlan.status,
    };

    const updatedPlan = await prisma.feePlan.update({
      where: { id },
      data: updateData,
    });

    await auditUpdate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "FeePlan",
      updatedPlan.id,
      beforeState,
      {
        name: updatedPlan.name,
        amount: updatedPlan.amount.toString(),
        frequency: updatedPlan.frequency,
        status: updatedPlan.status,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ feePlan: updatedPlan });
  } catch (error: any) {
    console.error("Error updating fee plan:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/finance/fee-plans/[id]
 * Delete fee plan (if no active invoices)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_FEE_PLAN_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const feePlan = await prisma.feePlan.findUnique({
      where: { id },
      include: {
        invoices: {
          where: {
            status: {
              notIn: ["CANCELLED"],
            },
          },
        },
      },
    });

    if (!feePlan) {
      return NextResponse.json({ error: "Fee plan not found" }, { status: 404 });
    }

    validateCentreAccess(session, feePlan.centreId);

    if (feePlan.invoices.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete fee plan with active invoices" },
        { status: 400 }
      );
    }

    const beforeState = {
      name: feePlan.name,
      amount: feePlan.amount.toString(),
      frequency: feePlan.frequency,
      status: feePlan.status,
    };

    await prisma.feePlan.delete({
      where: { id },
    });

    await auditDelete(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "FeePlan",
      feePlan.id,
      beforeState,
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ message: "Fee plan deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting fee plan:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
