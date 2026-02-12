/**
 * Payments API
 * 
 * POST /api/finance/payments - Record a payment against an invoice
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess, preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * POST /api/finance/payments
 * Record a payment against an invoice
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session, Permissions.FINANCE_PAYMENT_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    preventCentreIdInjection(body);

    if (!body.invoiceId || !body.amount || !body.method || !body.paymentDate) {
      return NextResponse.json(
        { error: "Missing required fields: invoiceId, amount, method, paymentDate" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
      include: {
        studentAccount: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    validateCentreAccess(session, invoice.centreId);

    const paymentAmount = new Decimal(body.amount);

    if (paymentAmount.lte(0)) {
      return NextResponse.json(
        { error: "Payment amount must be positive" },
        { status: 400 }
      );
    }

    if (paymentAmount.gt(invoice.balance)) {
      return NextResponse.json(
        { error: "Payment amount exceeds invoice balance" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: body.invoiceId,
        amount: paymentAmount,
        method: body.method,
        paymentDate: new Date(body.paymentDate),
        reference: body.reference,
        notes: body.notes,
        recordedById: session.user.id,
        centreId: session.user.centerId,
      },
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
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const newPaidAmount = invoice.paidAmount.add(paymentAmount);
    const newBalance = invoice.total.sub(newPaidAmount);

    let newStatus = invoice.status;
    if (newBalance.lte(0)) {
      newStatus = "PAID";
    } else if (newPaidAmount.gt(0)) {
      newStatus = "PARTIAL";
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        balance: newBalance,
        status: newStatus,
      },
    });

    await prisma.studentAccount.update({
      where: { id: invoice.studentAccountId },
      data: {
        totalPaid: invoice.studentAccount.totalPaid.add(paymentAmount),
        balance: invoice.studentAccount.balance.sub(paymentAmount),
      },
    });

    await auditCreate(
      session.user.id,
      session.user.name || session.user.email || 'Unknown',
      session.user.role as Role,
      "Payment",
      payment.id,
      {
        invoiceId: payment.invoiceId,
        amount: payment.amount.toString(),
        method: payment.method,
        invoiceStatus: newStatus,
      },
      session.user.centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error: any) {
    console.error("Error recording payment:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
