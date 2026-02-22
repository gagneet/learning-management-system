import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/financial/reports - Get financial summary and reports
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only admins, supervisors, and finance admins can view financial reports
  if (!["CENTER_SUPERVISOR", "CENTER_ADMIN", "FINANCE_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const centerId = searchParams.get("centerId");

  try {
    const where: any = {};

    // Non-super-admins can only see reports for their center
    if (user.role !== "SUPER_ADMIN") {
      where.centerId = user.centerId;
    } else if (centerId) {
      where.centerId = centerId;
    }

    // Get all transactions for the center(s)
    const transactions = await prisma.financialTransaction.findMany({
      where,
    });

    // Calculate summary statistics
    const summary = {
      totalRevenue: 0,
      totalTutorPayments: 0,
      totalOperationalCosts: 0,
      totalRefunds: 0,
      pendingPayments: 0,
      completedPayments: 0,
      transactionCount: transactions.length,
    };

    transactions.forEach((transaction) => {
      if (transaction.status === "completed") {
        switch (transaction.type) {
          case "STUDENT_PAYMENT":
            summary.totalRevenue += transaction.amount;
            summary.completedPayments += transaction.amount;
            break;
          case "TUTOR_PAYMENT":
            summary.totalTutorPayments += transaction.amount;
            break;
          case "OPERATIONAL_COST":
            summary.totalOperationalCosts += transaction.amount;
            break;
          case "REFUND":
            summary.totalRefunds += transaction.amount;
            summary.totalRevenue -= transaction.amount;
            break;
        }
      } else if (transaction.status === "pending") {
        if (transaction.type === "STUDENT_FEE" || transaction.type === "STUDENT_PAYMENT") {
          summary.pendingPayments += transaction.amount;
        }
      }
    });

    // Calculate profit margin
    const totalCosts = summary.totalTutorPayments + summary.totalOperationalCosts;
    const netRevenue = summary.totalRevenue - summary.totalRefunds;
    const profitMargin = netRevenue - totalCosts;
    const profitMarginPercentage = netRevenue > 0 ? (profitMargin / netRevenue) * 100 : 0;

    return NextResponse.json({
      summary: {
        ...summary,
        netRevenue,
        totalCosts,
        profitMargin,
        profitMarginPercentage: Math.round(profitMarginPercentage * 100) / 100,
      },
      currency: "USD", // Could be configurable per center
    });
  } catch (error) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      { error: "Failed to generate financial report" },
      { status: 500 }
    );
  }
}
