/**
 * Invoices API
 * 
 * GET /api/finance/invoices - List invoices (filtered by centre, optional studentId filter)
 * POST /api/finance/invoices - Create new invoice with invoice lines
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery, preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * GET /api/finance/invoices
 * List invoices (filtered by centre, optional studentId filter)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canViewAll = hasPermission(session, Permissions.FINANCE_INVOICE_VIEW_ALL);
    const canViewOwn = hasPermission(session, Permissions.FINANCE_INVOICE_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    const where: any = { centreId };

    if (canViewOwn && !canViewAll) {
      where.studentId = session.user.id;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
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
        feePlan: {
          select: {
            id: true,
            name: true,
            frequency: true,
          },
        },
        lineItems: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
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
 * POST /api/finance/invoices
 * Create new invoice with invoice lines
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_INVOICE_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    preventCentreIdInjection(body);

    if (!body.studentId || !body.dueDate || !body.lineItems || !Array.isArray(body.lineItems) || body.lineItems.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, dueDate, lineItems" },
        { status: 400 }
      );
    }

    let studentAccount = await prisma.studentAccount.findUnique({
      where: { studentId: body.studentId },
    });

    if (!studentAccount) {
      studentAccount = await prisma.studentAccount.create({
        data: {
          studentId: body.studentId,
          centreId: session.user.centerId,
          totalBilled: 0,
          totalPaid: 0,
          totalRefunded: 0,
          balance: 0,
        },
      });
    }

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: { centreId: session.user.centerId }
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = new Decimal(0);
    for (const item of body.lineItems) {
      const quantity = item.quantity || 1;
      const unitPrice = new Decimal(item.unitPrice);
      const amount = unitPrice.mul(quantity);
      subtotal = subtotal.add(amount);
    }

    const tax = body.tax ? new Decimal(body.tax) : new Decimal(0);
    const total = subtotal.add(tax);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        studentAccountId: studentAccount.id,
        studentId: body.studentId,
        feePlanId: body.feePlanId,
        dueDate: new Date(body.dueDate),
        status: body.status || "DRAFT",
        subtotal,
        tax,
        total,
        paidAmount: 0,
        balance: total,
        notes: body.notes,
        centreId: session.user.centerId,
        lineItems: {
          create: body.lineItems.map((item: any, index: number) => {
            const quantity = item.quantity || 1;
            const unitPrice = new Decimal(item.unitPrice);
            const amount = unitPrice.mul(quantity);
            return {
              description: item.description,
              quantity,
              unitPrice,
              amount,
              order: index,
            };
          }),
        },
      },
      include: {
        lineItems: true,
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
    });

    await prisma.studentAccount.update({
      where: { id: studentAccount.id },
      data: {
        totalBilled: studentAccount.totalBilled.add(total),
        balance: studentAccount.balance.add(total),
      },
    });

    await auditCreate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "Invoice",
      invoice.id,
      {
        invoiceNumber: invoice.invoiceNumber,
        studentId: invoice.studentId,
        total: invoice.total.toString(),
        status: invoice.status,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
