import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AssessmentKPIClient } from "./AssessmentKPIClient";

export default async function AssessmentKPIsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { user } = session;

  if (
    user.role !== "CENTER_ADMIN" &&
    user.role !== "CENTER_SUPERVISOR" &&
    user.role !== "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const centreId =
    user.role === "SUPER_ADMIN" ? undefined : (user.centerId ?? undefined);

  const sevenDaysAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);

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
    prisma.studentAgeAssessment.count({
      where: {
        status: { not: "ARCHIVED" },
        ...(centreId ? { centreId } : {}),
      },
    }),

    prisma.studentAgeAssessment.groupBy({
      by: ["subject"],
      where: {
        status: { not: "ARCHIVED" },
        ...(centreId ? { centreId } : {}),
      },
      _count: true,
    }),

    prisma.studentAgeAssessment.aggregate({
      where: {
        status: { not: "ARCHIVED" },
        ...(centreId ? { centreId } : {}),
      },
      _avg: { lessonsCompleted: true },
    }),

    prisma.studentAgeAssessment.count({
      where: {
        readyForPromotion: true,
        status: { not: "ARCHIVED" },
        ...(centreId ? { centreId } : {}),
      },
    }),

    prisma.agePromotionAttempt.groupBy({
      by: ["outcome"],
      where: {
        outcome: { not: "PENDING" },
        ...(centreId ? { centreId } : {}),
      },
      _count: true,
    }),

    prisma.studentAgeAssessment.count({
      where: {
        status: "ACTIVE",
        lessonsCompleted: 0,
        placedAt: { lt: sevenDaysAgo },
        ...(centreId ? { centreId } : {}),
      },
    }),

    prisma.ageLessonCompletion.count({
      where: {
        status: "NEEDS_REVISION",
        ...(centreId ? { centreId } : {}),
      },
    }),

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

  // Promotion success rate
  const totalAttempts = promotionAttempts.reduce((s, a) => s + a._count, 0);
  const promoted =
    promotionAttempts.find((a) => a.outcome === "PROMOTED")?._count ?? 0;
  const levelSkipped =
    promotionAttempts.find((a) => a.outcome === "LEVEL_SKIPPED")?._count ?? 0;
  const promotionSuccessRate =
    totalAttempts > 0
      ? Math.round(((promoted + levelSkipped) / totalAttempts) * 100)
      : null;

  // Resolve level IDs to human-readable labels
  const ageIds = levelDistribution.map((l) => l.currentAgeId);
  const ages = await prisma.assessmentAge.findMany({
    where: { id: { in: ageIds } },
    select: { id: true, displayLabel: true, australianYear: true, ageYear: true },
  });
  const ageMap = Object.fromEntries(ages.map((a) => [a.id, a]));

  const kpiData = {
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
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Assessment KPI Dashboard"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessment KPI Dashboard" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment KPI Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Centre-wide key performance indicators for student assessment
            placements, progress, and promotions.
          </p>
        </div>
        <AssessmentKPIClient data={kpiData} />
      </main>
    </div>
  );
}
