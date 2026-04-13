import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AssessmentRiskClient } from "./AssessmentRiskClient";

export default async function AssessmentRiskPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { user } = session;
  if (
    user.role !== "CENTER_ADMIN" &&
    user.role !== "CENTER_SUPERVISOR" &&
    user.role !== "SUPER_ADMIN" &&
    user.role !== "TEACHER"
  ) {
    redirect("/dashboard");
  }

  const centreId = user.role !== "SUPER_ADMIN" ? user.centerId : undefined;
  const cutoffDate = new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago

  // Students with placements but NO lesson completions at all
  const noProgressPlacements = await prisma.studentAgeAssessment.findMany({
    where: {
      centreId: centreId ?? undefined,
      status: { in: ["ACTIVE", "PROMOTION_PENDING"] },
      lessonsCompleted: 0,
      placedAt: { lt: cutoffDate }, // placed more than 14 days ago
    },
    include: {
      student: { select: { id: true, name: true, email: true, dateOfBirth: true } },
      currentAge: { select: { displayLabel: true, australianYear: true, ageYear: true } },
      placedBy: { select: { name: true } },
    },
    orderBy: { placedAt: "asc" },
    take: 50,
  });

  // Students with NEEDS_REVISION lessons (awaiting resubmission)
  const needsRevisionPlacements = await prisma.ageLessonCompletion.findMany({
    where: {
      status: "NEEDS_REVISION",
      centreId: centreId ?? undefined,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      lesson: { select: { lessonNumber: true, title: true, subject: true } },
      placement: {
        select: {
          id: true,
          subject: true,
          currentAge: { select: { displayLabel: true, australianYear: true } },
        },
      },
    },
    orderBy: { gradedAt: "asc" },
    take: 50,
  });

  // Students ready for promotion but not yet tested (readyForPromotion=true for >7 days)
  const promotionOverdue = await prisma.studentAgeAssessment.findMany({
    where: {
      centreId: centreId ?? undefined,
      readyForPromotion: true,
      status: "PROMOTION_PENDING",
      updatedAt: { lt: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) },
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      currentAge: { select: { displayLabel: true, australianYear: true } },
      placedBy: { select: { name: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: 50,
  });

  // Serialise dates for client components
  const serialisedNoProgress = noProgressPlacements.map((p) => ({
    id: p.id,
    subject: p.subject,
    placedAt: p.placedAt.toISOString(),
    lessonsCompleted: p.lessonsCompleted,
    status: p.status,
    student: p.student,
    currentAge: p.currentAge,
    placedBy: p.placedBy,
  }));

  const serialisedNeedsRevision = needsRevisionPlacements.map((c) => ({
    id: c.id,
    status: c.status,
    gradedAt: c.gradedAt ? c.gradedAt.toISOString() : null,
    completedAt: c.completedAt ? c.completedAt.toISOString() : null,
    student: c.student,
    lesson: c.lesson,
    placement: c.placement,
  }));

  const serialisedPromotionOverdue = promotionOverdue.map((p) => ({
    id: p.id,
    subject: p.subject,
    updatedAt: p.updatedAt.toISOString(),
    status: p.status,
    student: p.student,
    currentAge: p.currentAge,
    placedBy: p.placedBy,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Assessment Risk Monitor"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessment Risk Monitor" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <AssessmentRiskClient
          noProgressPlacements={serialisedNoProgress}
          needsRevisionPlacements={serialisedNeedsRevision}
          promotionOverdue={serialisedPromotionOverdue}
        />
      </main>
    </div>
  );
}
