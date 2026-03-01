import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AssessmentAdminClient } from "./AssessmentAdminClient";

export default async function AdminAssessmentsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (!["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR"].includes(user.role)) {
    redirect("/dashboard");
  }

  const levels = await prisma.assessmentAge.findMany({
    include: {
      _count: {
        select: { lessons: true, promotionTests: true, currentPlacements: true },
      },
      lessons: {
        where: { isActive: true },
        select: { subject: true },
      },
      promotionTests: {
        where: { isActive: true },
        select: { id: true, subject: true, title: true, passingScore: true },
      },
    },
    orderBy: [{ ageYear: "asc" }, { ageMonth: "asc" }],
  });

  const levelsWithStats = levels.map((level) => {
    const subjectCounts: Record<string, number> = {};
    for (const lesson of level.lessons) {
      subjectCounts[lesson.subject] = (subjectCounts[lesson.subject] || 0) + 1;
    }
    return {
      id: level.id,
      ageYear: level.ageYear,
      ageMonth: level.ageMonth,
      displayLabel: level.displayLabel,
      australianYear: level.australianYear,
      description: level.description,
      isActive: level.isActive,
      createdAt: level.createdAt.toISOString(),
      totalLessons: level._count.lessons,
      totalPromotionTests: level._count.promotionTests,
      totalPlacements: level._count.currentPlacements,
      subjectLessonCounts: subjectCounts,
      promotionTests: level.promotionTests,
    };
  });

  const totalLessons = levelsWithStats.reduce((sum, l) => sum + l.totalLessons, 0);
  const totalPlacements = levelsWithStats.reduce((sum, l) => sum + l.totalPlacements, 0);
  const activeLevels = levelsWithStats.filter((l) => l.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Assessment Level Management"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessment Levels" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment Level Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage assessment age levels, lesson plans, and promotion tests across all subjects
          </p>
        </div>
        <AssessmentAdminClient
          levels={levelsWithStats}
          stats={{
            totalLevels: levelsWithStats.length,
            activeLevels,
            totalLessons,
            totalPlacements,
          }}
        />
      </main>
    </div>
  );
}
