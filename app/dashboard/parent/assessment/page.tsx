import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { ParentAssessmentClient } from "./ParentAssessmentClient";

export default async function ParentAssessmentPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "PARENT") {
    redirect("/dashboard");
  }

  // Fetch the parent's children
  const children = await prisma.user.findMany({
    where: { parentId: user.id, role: "STUDENT" },
    include: {
      studentAgeAssessments: {
        where: { status: { not: "ARCHIVED" } },
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
            take: 10,
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
            take: 3,
          },
        },
        orderBy: { subject: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const today = new Date();

  const childrenData = children.map((child) => {
    const chronoAge = child.dateOfBirth
      ? Math.round(
          ((today.getTime() - new Date(child.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)) *
            10
        ) / 10
      : null;

    return {
      id: child.id,
      name: child.name ?? "Child",
      chronoAge,
      placements: child.studentAgeAssessments,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Assessment Progress"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessment Progress" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your {children.length > 1 ? "children's" : "child's"} assessment age levels and lesson progress
          </p>
        </div>

        {children.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">No children found on your account.</p>
          </div>
        ) : (
          <ParentAssessmentClient children={childrenData as any} />
        )}
      </main>
    </div>
  );
}
