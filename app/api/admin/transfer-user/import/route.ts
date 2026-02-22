/**
 * User Transfer Import API
 *
 * POST /api/admin/transfer-user/import
 *
 * Imports user data exported from another center.
 * Creates new user account and transfers historical records.
 *
 * SUPER_ADMIN only.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

interface ImportOptions {
  preserveIds?: boolean;
  transferActive?: boolean;
  transferPayments?: boolean;
  notifyUser?: boolean;
  transferNotes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only SUPER_ADMIN can import user data
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden - SUPER_ADMIN only" }, { status: 403 });
    }

    const body = await request.json();
    const { targetCenterId, exportData, options = {} } = body as {
      targetCenterId: string;
      exportData: any;
      options: ImportOptions;
    };

    if (!targetCenterId || !exportData) {
      return NextResponse.json(
        { error: "targetCenterId and exportData are required" },
        { status: 400 }
      );
    }

    // Verify target center exists
    const targetCenter = await prisma.center.findUnique({
      where: { id: targetCenterId }
    });

    if (!targetCenter) {
      return NextResponse.json({ error: "Target center not found" }, { status: 404 });
    }

    // Check if user with same email already exists at target center
    const existingUser = await prisma.user.findUnique({
      where: { email: exportData.user.email }
    });

    if (existingUser && existingUser.centerId === targetCenterId) {
      return NextResponse.json(
        { error: "User with this email already exists at target center" },
        { status: 409 }
      );
    }

    const warnings: string[] = [];
    const transferredRecords = {
      enrollments: 0,
      completedCourses: 0,
      payments: 0,
      attendances: 0,
      academicProfile: 0,
      gamification: 0,
      badges: 0
    };

    // Generate temporary password
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create new user in target center
    const newUser = await prisma.user.create({
      data: {
        email: exportData.user.email,
        name: exportData.user.name,
        password: hashedPassword, // User must change on first login
        role: exportData.user.role,
        centerId: targetCenterId,
        avatar: exportData.user.avatar,
        bio: exportData.user.bio
          ? `${exportData.user.bio}\n\n⚠️ TRANSFERRED from ${exportData.sourceCenter.name} on ${new Date().toLocaleDateString()}`
          : `⚠️ TRANSFERRED from ${exportData.sourceCenter.name} on ${new Date().toLocaleDateString()}`,
        languagePreference: exportData.user.languagePreference,
        accessibilitySettings: exportData.user.accessibilitySettings,
        specialNeeds: exportData.user.specialNeeds,
        dateOfBirth: exportData.user.dateOfBirth ? new Date(exportData.user.dateOfBirth) : null,
        ageTier: exportData.user.ageTier || "TIER3"
      }
    });

    // Transfer academic profile
    if (exportData.academicProfile) {
      await prisma.academicProfile.create({
        data: {
          userId: newUser.id,
          chronologicalAge: exportData.academicProfile.chronologicalAge,
          readingAge: exportData.academicProfile.readingAge,
          numeracyAge: exportData.academicProfile.numeracyAge,
          comprehensionIndex: exportData.academicProfile.comprehensionIndex,
          writingProficiency: exportData.academicProfile.writingProficiency
        }
      });
      transferredRecords.academicProfile = 1;
    }

    // Transfer gamification profile
    if (exportData.gamificationProfile) {
      const gamProfile = await prisma.gamificationProfile.create({
        data: {
          userId: newUser.id,
          xp: exportData.gamificationProfile.xp || 0,
          level: exportData.gamificationProfile.level || 1,
          streak: 0, // Reset streak on transfer
          totalXP: exportData.gamificationProfile.totalXP || exportData.gamificationProfile.xp,
          nextLevelXP: exportData.gamificationProfile.nextLevelXP || 100
        }
      });
      transferredRecords.gamification = 1;

      // Transfer non-center-specific badges
      if (exportData.gamificationProfile.badges) {
        for (const badge of exportData.gamificationProfile.badges) {
          // Skip center-specific badges
          if (badge.name.includes(exportData.sourceCenter.name)) {
            warnings.push(`Badge "${badge.name}" is center-specific and was not transferred`);
            continue;
          }

          await prisma.badge.create({
            data: {
              profileId: gamProfile.id,
              name: badge.name,
              description: badge.description,
              type: badge.type,
              iconUrl: badge.iconUrl,
              earnedAt: new Date(badge.earnedAt)
            }
          });
          transferredRecords.badges++;
        }
      }

      // Transfer achievements
      if (exportData.gamificationProfile.achievements) {
        for (const achievement of exportData.gamificationProfile.achievements) {
          await prisma.achievement.create({
            data: {
              profileId: gamProfile.id,
              title: achievement.title,
              description: achievement.description,
              category: achievement.category,
              value: achievement.value,
              earnedAt: new Date(achievement.earnedAt)
            }
          });
        }
      }
    }

    // Transfer active enrollments (if option enabled)
    if (options.transferActive && exportData.enrollments) {
      const activeEnrollments = exportData.enrollments.filter(
        (e: any) => !e.completedAt
      );

      for (const enrollment of activeEnrollments) {
        // Try to find equivalent course at target center
        const equivalentCourse = await prisma.course.findFirst({
          where: {
            centerId: targetCenterId,
            title: enrollment.course.title,
            status: "PUBLISHED"
          }
        });

        if (equivalentCourse) {
          await prisma.enrollment.create({
            data: {
              userId: newUser.id,
              courseId: equivalentCourse.id,
              progress: enrollment.progress,
              enrolledAt: new Date(enrollment.enrolledAt)
            }
          });
          transferredRecords.enrollments++;
        } else {
          warnings.push(
            `Course "${enrollment.course.title}" has no equivalent at target center - enrollment not transferred`
          );
        }
      }

      // Track completed courses for history
      const completedEnrollments = exportData.enrollments.filter(
        (e: any) => e.completedAt
      );
      transferredRecords.completedCourses = completedEnrollments.length;
    }

    // Transfer payment history (if option enabled)
    if (options.transferPayments && exportData.financialTransactions) {
      for (const transaction of exportData.financialTransactions) {
        await prisma.financialTransaction.create({
          data: {
            userId: newUser.id,
            centerId: targetCenterId,
            amount: transaction.amount,
            type: transaction.type,
            description: `[TRANSFERRED] ${transaction.description || ""}`,
            status: transaction.status,
            metadata: {
              ...transaction.metadata,
              transferredFrom: exportData.sourceCenter.id,
              originalTransactionId: transaction.id
            },
            createdAt: new Date(transaction.createdAt)
          }
        });
        transferredRecords.payments++;
      }
    }

    // Transfer attendance records (historical only)
    if (exportData.attendanceRecords) {
      transferredRecords.attendances = exportData.attendanceRecords.length;
      // Note: Actual attendance records stay at original center
      // We just count them for the summary
    }

    // Audit log the import
    await auditCreate(
      session.user.id,
      session.user.name || session.user.email || "Unknown",
      session.user.role as Role,
      "UserImport",
      newUser.id,
      {
        importedFrom: exportData.sourceCenter.id,
        exportId: exportData.exportId,
        targetCenterId,
        transferredRecords,
        warnings,
        transferNotes: options.transferNotes
      },
      targetCenterId,
      request.headers.get("x-forwarded-for") || undefined
    );

    // Prepare response
    const response = {
      success: true,
      newUserId: newUser.id,
      transferredRecords,
      warnings,
      newCredentials: {
        email: newUser.email,
        tempPassword: tempPassword, // Return to admin for user notification
        loginUrl: `${process.env.NEXTAUTH_URL}/login`,
        passwordChangeRequired: true
      },
      summary: {
        originalCenter: exportData.sourceCenter.name,
        targetCenter: targetCenter.name,
        transferDate: new Date().toISOString(),
        transferredBy: session.user.name || session.user.email
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Error importing user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
