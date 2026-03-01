import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { LessonDetailClient } from "./LessonDetailClient";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ placementId: string; lessonId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { user } = session;
  if (user.role !== "STUDENT") redirect("/dashboard");

  const { placementId, lessonId } = await params;

  // Fetch placement and verify ownership
  const placement = await prisma.studentAgeAssessment.findUnique({
    where: { id: placementId },
    include: {
      currentAge: { select: { id: true, displayLabel: true, australianYear: true } },
    },
  });

  if (!placement || placement.studentId !== user.id) redirect("/dashboard/student/assessment");

  // Fetch the lesson
  const lesson = await prisma.ageAssessmentLesson.findUnique({
    where: { id: lessonId },
  });

  if (!lesson || lesson.assessmentAgeId !== placement.currentAgeId) redirect(`/dashboard/student/assessment`);

  // Fetch completion record if exists
  const completion = await prisma.ageLessonCompletion.findFirst({
    where: { studentId: user.id, placementId, lessonId },
    include: {
      gradedBy: { select: { name: true, role: true } },
    },
  });

  // Navigation: prev/next lessons
  const allLessons = await prisma.ageAssessmentLesson.findMany({
    where: { assessmentAgeId: placement.currentAgeId, subject: placement.subject, isActive: true },
    select: { id: true, lessonNumber: true, title: true },
    orderBy: { lessonNumber: "asc" },
  });
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Lesson Detail"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/student" },
          { label: "My Assessment", href: "/dashboard/student/assessment" },
          {
            label: `${placement.subject} Level ${placement.currentAge.displayLabel}`,
            href: "/dashboard/student/assessment",
          },
          { label: `Lesson ${lesson.lessonNumber}` },
        ]}
      />
      <LessonDetailClient
        placementId={placementId}
        placement={{
          id: placement.id,
          subject: placement.subject,
          lessonsCompleted: placement.lessonsCompleted,
          readyForPromotion: placement.readyForPromotion,
          currentAge: placement.currentAge,
        }}
        lesson={{
          id: lesson.id,
          lessonNumber: lesson.lessonNumber,
          title: lesson.title,
          description: lesson.description,
          learningObjectives: lesson.learningObjectives as Array<{
            objective: string;
            bloomsLevel?: string;
          }> | null,
          difficultyScore: lesson.difficultyScore,
          estimatedMinutes: lesson.estimatedMinutes,
          curriculumCode: lesson.curriculumCode,
          strandArea: lesson.strandArea,
          subject: lesson.subject,
        }}
        completion={
          completion
            ? {
                id: completion.id,
                status: completion.status,
                score: completion.score,
                percentageScore: completion.percentageScore,
                feedback: completion.feedback,
                timeSpentMinutes: completion.timeSpentMinutes,
                startedAt: completion.startedAt?.toISOString() ?? null,
                completedAt: completion.completedAt?.toISOString() ?? null,
                gradedBy: completion.gradedBy
                  ? { name: completion.gradedBy.name, role: completion.gradedBy.role }
                  : null,
              }
            : null
        }
        prevLesson={prevLesson}
        nextLesson={nextLesson}
        totalLessons={allLessons.length}
      />
    </div>
  );
}
