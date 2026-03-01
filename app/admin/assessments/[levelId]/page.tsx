import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AssessmentLevelDetailClient } from "./AssessmentLevelDetailClient";

export default async function AssessmentLevelDetailPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (!["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR"].includes(user.role)) {
    redirect("/dashboard");
  }

  const { levelId } = await params;

  // Fetch the specific AssessmentAge level with all related data
  const level = await prisma.assessmentAge.findUnique({
    where: { id: levelId },
    include: {
      lessons: {
        where: { isActive: true },
        orderBy: [{ subject: "asc" }, { lessonNumber: "asc" }],
        select: {
          id: true,
          subject: true,
          lessonNumber: true,
          title: true,
          description: true,
          difficultyScore: true,
          estimatedMinutes: true,
          curriculumCode: true,
          strandArea: true,
          isActive: true,
          createdAt: true,
        },
      },
      promotionTests: {
        orderBy: [{ subject: "asc" }],
        select: {
          id: true,
          subject: true,
          title: true,
          description: true,
          totalMarks: true,
          passingScore: true,
          excellenceScore: true,
          timeLimit: true,
          isAutoGraded: true,
          isActive: true,
          createdAt: true,
          _count: { select: { attempts: true } },
        },
      },
      currentPlacements: {
        where: { status: { not: "ARCHIVED" } },
        orderBy: { placedAt: "desc" },
        take: 50,
        select: {
          id: true,
          subject: true,
          lessonsCompleted: true,
          currentLessonNumber: true,
          readyForPromotion: true,
          status: true,
          placedAt: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: { lessons: true, promotionTests: true, currentPlacements: true },
      },
    },
  });

  if (!level) {
    notFound();
  }

  // Group lessons by subject
  const lessonsBySubject: Record<string, typeof level.lessons> = {};
  for (const lesson of level.lessons) {
    if (!lessonsBySubject[lesson.subject]) {
      lessonsBySubject[lesson.subject] = [];
    }
    lessonsBySubject[lesson.subject].push(lesson);
  }

  // Serialise for client component
  const levelData = {
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
    lessonsBySubject: Object.fromEntries(
      Object.entries(lessonsBySubject).map(([subject, lessons]) => [
        subject,
        lessons.map((l) => ({
          id: l.id,
          subject: l.subject,
          lessonNumber: l.lessonNumber,
          title: l.title,
          description: l.description,
          difficultyScore: l.difficultyScore,
          estimatedMinutes: l.estimatedMinutes,
          curriculumCode: l.curriculumCode,
          strandArea: l.strandArea,
          isActive: l.isActive,
          createdAt: l.createdAt.toISOString(),
        })),
      ])
    ),
    promotionTests: level.promotionTests.map((t) => ({
      id: t.id,
      subject: t.subject,
      title: t.title,
      description: t.description,
      totalMarks: t.totalMarks,
      passingScore: t.passingScore,
      excellenceScore: t.excellenceScore,
      timeLimit: t.timeLimit,
      isAutoGraded: t.isAutoGraded,
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
      attemptCount: t._count.attempts,
    })),
    placements: level.currentPlacements.map((p) => ({
      id: p.id,
      subject: p.subject,
      lessonsCompleted: p.lessonsCompleted,
      currentLessonNumber: p.currentLessonNumber,
      readyForPromotion: p.readyForPromotion,
      status: p.status,
      placedAt: p.placedAt.toISOString(),
      student: {
        id: p.student.id,
        name: p.student.name ?? "Unknown",
        email: p.student.email,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title={`Level ${level.displayLabel}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessment Levels", href: "/admin/assessments" },
          { label: level.displayLabel },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <AssessmentLevelDetailClient level={levelData} />
      </main>
    </div>
  );
}
