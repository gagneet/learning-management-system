import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AssessmentAnalyticsClient } from "./AssessmentAnalyticsClient";

export default async function AssessmentAnalyticsPage() {
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

  const centreId = user.role === "SUPER_ADMIN" ? undefined : user.centerId;

  // ── Total active placements ───────────────────────────────────────────────
  const totalPlacements = await prisma.studentAgeAssessment.count({
    where: {
      status: { not: "ARCHIVED" },
      ...(centreId ? { centreId } : {}),
    },
  });

  const readyForPromotion = await prisma.studentAgeAssessment.count({
    where: {
      readyForPromotion: true,
      status: { not: "ARCHIVED" },
      ...(centreId ? { centreId } : {}),
    },
  });

  // ── Distribution by age band ──────────────────────────────────────────────
  const SUBJECTS = ["ENGLISH", "MATHEMATICS", "SCIENCE", "STEM", "READING", "WRITING"] as const;
  const today = new Date();

  // Fetch all active placements with student DOB and current age for band calculation
  const placements = await prisma.studentAgeAssessment.findMany({
    where: {
      status: { not: "ARCHIVED" },
      ...(centreId ? { centreId } : {}),
    },
    select: {
      id: true,
      subject: true,
      readyForPromotion: true,
      lessonsCompleted: true,
      student: { select: { dateOfBirth: true } },
      currentAge: {
        select: { ageYear: true, ageMonth: true, displayLabel: true, australianYear: true },
      },
    },
  });

  // Compute age bands
  function ageGap(chronoAge: number, ageYear: number, ageMonth: number) {
    return Math.round((ageYear + ageMonth / 12 - chronoAge) * 10) / 10;
  }
  function ageBand(gap: number) {
    if (gap >= 0.5) return "ABOVE";
    if (gap >= -0.5) return "ON_LEVEL";
    if (gap >= -1.0) return "SLIGHTLY_BELOW";
    if (gap >= -2.0) return "BELOW";
    return "SIGNIFICANTLY_BELOW";
  }

  const bandCounts: Record<string, number> = {
    ABOVE: 0, ON_LEVEL: 0, SLIGHTLY_BELOW: 0, BELOW: 0, SIGNIFICANTLY_BELOW: 0, UNKNOWN: 0,
  };

  const subjectStats: Record<string, {
    total: number;
    readyForPromotion: number;
    belowLevel: number;
    avgLessonsCompleted: number;
  }> = {};

  for (const sub of SUBJECTS) {
    subjectStats[sub] = { total: 0, readyForPromotion: 0, belowLevel: 0, avgLessonsCompleted: 0 };
  }

  let totalLessonsCompleted = 0;
  let placementsWithDob = 0;

  for (const p of placements) {
    const dob = p.student.dateOfBirth;
    const subStat = subjectStats[p.subject as keyof typeof subjectStats];
    if (subStat) {
      subStat.total++;
      if (p.readyForPromotion) subStat.readyForPromotion++;
      subStat.avgLessonsCompleted += p.lessonsCompleted;
    }
    totalLessonsCompleted += p.lessonsCompleted;

    if (dob) {
      placementsWithDob++;
      const chronoAge =
        Math.round(
          ((today.getTime() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) * 10
        ) / 10;
      const gap = ageGap(chronoAge, p.currentAge.ageYear, p.currentAge.ageMonth);
      const band = ageBand(gap);
      bandCounts[band] = (bandCounts[band] ?? 0) + 1;

      if (subStat && (band === "BELOW" || band === "SIGNIFICANTLY_BELOW")) {
        subStat.belowLevel++;
      }
    } else {
      bandCounts.UNKNOWN++;
    }
  }

  // Finalise averages
  for (const sub of SUBJECTS) {
    const stat = subjectStats[sub];
    if (stat.total > 0) {
      stat.avgLessonsCompleted = Math.round((stat.avgLessonsCompleted / stat.total) * 10) / 10;
    }
  }

  // ── Promotion activity (last 30 days) ──────────────────────────────────────
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const promotionAttempts = await prisma.agePromotionAttempt.count({
    where: {
      startedAt: { gte: thirtyDaysAgo },
      ...(centreId ? { centreId } : {}),
    },
  });
  const successfulPromotions = await prisma.agePromotionAttempt.count({
    where: {
      startedAt: { gte: thirtyDaysAgo },
      outcome: "PROMOTED",
      ...(centreId ? { centreId } : {}),
    },
  });

  // ── Recent history entries ─────────────────────────────────────────────────
  const recentHistory = await prisma.ageAssessmentHistory.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      ...(centreId ? { centreId } : {}),
    },
    include: {
      student:  { select: { name: true } },
      toAge:    { select: { displayLabel: true, australianYear: true } },
      fromAge:  { select: { displayLabel: true, australianYear: true } },
      changedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const analyticsData = {
    totalPlacements,
    readyForPromotion,
    totalLessonsCompleted,
    bandCounts,
    subjectStats,
    promotionAttempts,
    successfulPromotions,
    recentHistory: recentHistory.map((h) => ({
      id:          h.id,
      changeType:  h.changeType,
      subject:     h.subject,
      studentName: h.student.name ?? "Unknown",
      toAge:       h.toAge.australianYear ?? h.toAge.displayLabel,
      fromAge:     h.fromAge ? (h.fromAge.australianYear ?? h.fromAge.displayLabel) : null,
      changedBy:   h.changedBy.name ?? "Unknown",
      createdAt:   h.createdAt.toISOString(),
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Assessment Analytics"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessment Analytics" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Centre-wide overview of student assessment age levels, age-band distribution, and promotion activity
          </p>
        </div>
        <AssessmentAnalyticsClient data={analyticsData} />
      </main>
    </div>
  );
}
