import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { StudentAssessmentClient } from "@/app/dashboard/tutor/students/[studentId]/assessment/StudentAssessmentClient";

export default async function StudentAssessmentPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch the student's own placements with full detail
  const placements = await prisma.studentAgeAssessment.findMany({
    where: { studentId: user.id, status: { not: "ARCHIVED" } },
    include: {
      currentAge: {
        select: {
          id: true,
          ageYear: true,
          ageMonth: true,
          displayLabel: true,
          australianYear: true,
        },
      },
      initialAge: {
        select: {
          id: true,
          ageYear: true,
          ageMonth: true,
          displayLabel: true,
        },
      },
      placedBy: {
        select: { id: true, name: true, role: true },
      },
      lessonCompletions: {
        include: {
          lesson: {
            select: {
              id: true,
              lessonNumber: true,
              title: true,
              difficultyScore: true,
              estimatedMinutes: true,
            },
          },
        },
        orderBy: { lesson: { lessonNumber: "asc" } },
      },
      historyLog: {
        include: {
          fromAge: { select: { displayLabel: true } },
          toAge: { select: { displayLabel: true } },
          changedBy: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      promotionAttempts: {
        include: {
          promotionTest: {
            select: { title: true, subject: true, totalMarks: true, passingScore: true },
          },
          promotedToAge: { select: { displayLabel: true } },
          gradedBy: { select: { name: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
    orderBy: { subject: "asc" },
  });

  // Get student's dateOfBirth for chronological age calculation
  const studentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { dateOfBirth: true },
  });

  const today = new Date();
  const chronoAge = studentUser?.dateOfBirth
    ? Math.round(
        ((today.getTime() - new Date(studentUser.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)) *
          10
      ) / 10
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="My Assessment Progress"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My Assessment" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Assessment Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your current assessment age levels, lesson progress, and promotion history
          </p>
        </div>

        <StudentAssessmentClient
          student={{ id: user.id, name: user.name!, chronoAge }}
          placements={placements as any}
          assessmentAges={[]}
          canEdit={false}
        />
      </main>
    </div>
  );
}
