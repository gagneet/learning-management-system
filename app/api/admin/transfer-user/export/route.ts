/**
 * User Transfer Export API
 *
 * POST /api/admin/transfer-user/export
 *
 * Exports complete user data for transfer to another center.
 * Includes enrollments, progress, payments, academic profile, gamification data.
 *
 * SUPER_ADMIN only.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can export user data for transfer
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden - SUPER_ADMIN only" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, centerId } = body;

    if (!userId || !centerId) {
      return NextResponse.json(
        { error: "userId and centerId are required" },
        { status: 400 }
      );
    }

    // Fetch user with all relationships
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        center: true,
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            centerId: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            centerId: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user belongs to specified center
    if (user.centerId !== centerId) {
      return NextResponse.json(
        { error: "User does not belong to specified center" },
        { status: 400 }
      );
    }

    // Fetch enrollments with progress
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            status: true
          }
        }
      }
    });

    // Fetch all progress records
    const progress = await prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            order: true,
            module: {
              select: {
                id: true,
                title: true,
                courseId: true
              }
            }
          }
        }
      }
    });

    // Fetch academic profile
    const academicProfile = await prisma.academicProfile.findUnique({
      where: { userId }
    });

    // Fetch gamification profile
    const gamificationProfile = await prisma.gamificationProfile.findUnique({
      where: { userId },
      include: {
        badges: true,
        achievements: true
      }
    });

    // Fetch financial transactions
    const financialTransactions = await prisma.financialTransaction.findMany({
      where: { userId, centerId }
    });

    // Fetch session attendance
    const sessionAttendances = await prisma.sessionAttendance.findMany({
      where: { userId },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startTime: true,
            status: true
          }
        }
      }
    });

    // Fetch class memberships
    const classMemberships = await prisma.classMembership.findMany({
      where: { studentId: userId, centreId: centerId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            subject: true,
            status: true
          }
        }
      }
    });

    // Fetch attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: userId, centreId: centerId },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startTime: true
          }
        }
      }
    });

    // Check for outstanding invoices/payments
    const outstandingInvoices = await prisma.invoice.findMany({
      where: {
        studentId: userId,
        centreId: centerId,
        status: { in: ["SENT", "PARTIAL", "OVERDUE"] }
      }
    });

    // Create export package
    const exportId = `export_${Date.now()}_${userId.slice(0, 8)}`;
    const exportData = {
      exportId,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      sourceCenter: {
        id: user.center.id,
        name: user.center.name,
        slug: user.center.slug
      },
      user: {
        // Core user data (excluding password and sensitive fields)
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        languagePreference: user.languagePreference,
        accessibilitySettings: user.accessibilitySettings,
        specialNeeds: user.specialNeeds,
        dateOfBirth: user.dateOfBirth,
        ageTier: user.ageTier,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        parentId: user.parentId,
        parent: user.parent,
        children: user.children
      },
      enrollments,
      progress,
      academicProfile,
      gamificationProfile,
      financialTransactions,
      sessionAttendances,
      classMemberships,
      attendanceRecords,
      warnings: [] as string[],
      metadata: {
        totalEnrollments: enrollments.length,
        activeEnrollments: enrollments.filter(e => !e.completedAt).length,
        completedEnrollments: enrollments.filter(e => e.completedAt).length,
        totalProgress: progress.length,
        totalPayments: financialTransactions.filter(t => t.type === "STUDENT_PAYMENT").length,
        totalAttendances: attendanceRecords.length,
        hasOutstandingBalance: outstandingInvoices.length > 0
      }
    };

    // Add warnings
    if (outstandingInvoices.length > 0) {
      const totalOutstanding = outstandingInvoices.reduce(
        (sum, inv) => sum + Number(inv.balance),
        0
      );
      exportData.warnings.push(
        `User has ${outstandingInvoices.length} outstanding invoice(s) with total balance: $${totalOutstanding.toFixed(2)}`
      );
    }

    if (user.children.length > 0) {
      exportData.warnings.push(
        `User is a parent with ${user.children.length} child(ren). Consider transferring children as well.`
      );
    }

    if (user.parentId) {
      exportData.warnings.push(
        `User has a parent account. Parent may need to be notified or transferred.`
      );
    }

    const activeEnrollments = enrollments.filter(e => !e.completedAt);
    if (activeEnrollments.length > 0) {
      exportData.warnings.push(
        `User has ${activeEnrollments.length} active enrollment(s). These will need to be mapped to equivalent courses at the target center.`
      );
    }

    // Audit log the export
    await auditCreate(
      session.user.id,
      session.user.name || session.user.email || "Unknown",
      session.user.role as Role,
      "UserExport",
      exportId,
      exportData.metadata,
      centerId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({
      success: true,
      exportData
    });

  } catch (error: any) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
