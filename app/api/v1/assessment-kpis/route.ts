import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasPermission(session, Permissions.ASSESSMENT_GRID_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user } = session;
  const centreId =
    user.role !== "SUPER_ADMIN" ? (user.centerId ?? undefined) : undefined;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalPlacements,
      subjectCounts,
      avgData,
      readyForPromotion,
      promotionAttempts,
      noProgress,
      needsRevision,
      levelDistribution,
    ] = await Promise.all([
      // Total active placements
      prisma.studentAgeAssessment.count({
        where: {
          status: { not: "ARCHIVED" },
          ...(centreId ? { centreId } : {}),
        },
      }),

      // Placements grouped by subject
      prisma.studentAgeAssessment.groupBy({
        by: ["subject"],
        where: {
          status: { not: "ARCHIVED" },
          ...(centreId ? { centreId } : {}),
        },
        _count: true,
      }),

      // Average lessons completed across all active placements
      prisma.studentAgeAssessment.aggregate({
        where: {
          status: { not: "ARCHIVED" },
          ...(centreId ? { centreId } : {}),
        },
        _avg: { lessonsCompleted: true },
      }),

      // Count of placements ready for promotion
      prisma.studentAgeAssessment.count({
        where: {
          readyForPromotion: true,
          status: { not: "ARCHIVED" },
          ...(centreId ? { centreId } : {}),
        },
      }),

      // Promotion attempts grouped by outcome (exclude PENDING to get resolved outcomes)
      prisma.agePromotionAttempt.groupBy({
        by: ["outcome"],
        where: {
          outcome: { not: "PENDING" },
          ...(centreId ? { centreId } : {}),
        },
        _count: true,
      }),

      // Students with zero progress placed more than 7 days ago
      prisma.studentAgeAssessment.count({
        where: {
          status: "ACTIVE",
          lessonsCompleted: 0,
          placedAt: { lt: sevenDaysAgo },
          ...(centreId ? { centreId } : {}),
        },
      }),

      // Lesson completions needing revision
      prisma.ageLessonCompletion.count({
        where: {
          status: "NEEDS_REVISION",
          ...(centreId ? { centreId } : {}),
        },
      }),

      // Student count per level (currentAgeId)
      prisma.studentAgeAssessment.groupBy({
        by: ["currentAgeId"],
        where: {
          status: { not: "ARCHIVED" },
          ...(centreId ? { centreId } : {}),
        },
        _count: true,
        orderBy: { _count: { currentAgeId: "desc" } },
      }),
    ]);

    // Compute promotion success rate
    const totalAttempts = promotionAttempts.reduce((s, a) => s + a._count, 0);
    const promoted =
      promotionAttempts.find((a) => a.outcome === "PROMOTED")?._count ?? 0;
    const levelSkipped =
      promotionAttempts.find((a) => a.outcome === "LEVEL_SKIPPED")?._count ?? 0;
    const promotionSuccessRate =
      totalAttempts > 0
        ? Math.round(((promoted + levelSkipped) / totalAttempts) * 100)
        : null;

    // Resolve assessment age IDs to their human-readable labels
    const ageIds = levelDistribution.map((l) => l.currentAgeId);
    const ages = await prisma.assessmentAge.findMany({
      where: { id: { in: ageIds } },
      select: {
        id: true,
        displayLabel: true,
        australianYear: true,
        ageYear: true,
      },
    });
    const ageMap = Object.fromEntries(ages.map((a) => [a.id, a]));

    return NextResponse.json({
      success: true,
      data: {
        totalPlacements,
        subjectBreakdown: Object.fromEntries(
          subjectCounts.map((s) => [s.subject, s._count])
        ),
        avgLessonsCompleted:
          Math.round((avgData._avg.lessonsCompleted ?? 0) * 10) / 10,
        readyForPromotion,
        promotionSuccessRate,
        totalPromotionAttempts: totalAttempts,
        studentsWithNoProgress: noProgress,
        studentsNeedingRevision: needsRevision,
        levelDistribution: levelDistribution
          .map((l) => ({
            levelId: l.currentAgeId,
            displayLabel: ageMap[l.currentAgeId]?.displayLabel ?? "Unknown",
            australianYear: ageMap[l.currentAgeId]?.australianYear ?? null,
            ageYear: ageMap[l.currentAgeId]?.ageYear ?? 0,
            count: l._count,
          }))
          .sort((a, b) => a.ageYear - b.ageYear),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching assessment KPIs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
