import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { StudentAssessmentClient } from "./StudentAssessmentClient";

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function TutorStudentAssessmentPage({ params }: Props) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (
    user.role !== "TEACHER" &&
    user.role !== "CENTER_ADMIN" &&
    user.role !== "CENTER_SUPERVISOR" &&
    user.role !== "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const { studentId } = await params;

  // Verify the student exists and belongs to the same centre
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      dateOfBirth: true,
      centerId: true,
      role: true,
    },
  });

  if (!student || student.role !== "STUDENT") {
    notFound();
  }

  if (user.role !== "SUPER_ADMIN" && student.centerId !== user.centerId) {
    redirect("/dashboard");
  }

  // Fetch all placements with details
  const placements = await prisma.studentAgeAssessment.findMany({
    where: { studentId, status: { not: "ARCHIVED" } },
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
          promotionTest: { select: { title: true, subject: true, totalMarks: true, passingScore: true } },
          promotedToAge: { select: { displayLabel: true } },
          gradedBy: { select: { name: true } },
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
    orderBy: { subject: "asc" },
  });

  // Fetch available assessment levels for placement creation
  const assessmentAges = await prisma.assessmentAge.findMany({
    where: { isActive: true },
    select: { id: true, ageYear: true, ageMonth: true, displayLabel: true, australianYear: true },
    orderBy: [{ ageYear: "asc" }, { ageMonth: "asc" }],
  });

  const today = new Date();
  const chronoAge = student.dateOfBirth
    ? Math.round(
        ((today.getTime() - new Date(student.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)) *
          10
      ) / 10
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title={`${student.name} — Assessment`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessment Grid", href: "/dashboard/tutor/assessment" },
          { label: student.name ?? "Student", href: `/dashboard/tutor/students/${studentId}` },
          { label: "Assessment" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {student.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {student.email}
              {chronoAge !== null && ` · Age ${chronoAge}`}
            </p>
          </div>
          <Link
            href={`/dashboard/tutor/students/${studentId}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to profile
          </Link>
        </div>

        <StudentAssessmentClient
          student={{ id: student.id, name: student.name ?? "Student", chronoAge }}
          placements={placements as any}
          assessmentAges={assessmentAges}
          canEdit
        />
      </main>
    </div>
  );
}
