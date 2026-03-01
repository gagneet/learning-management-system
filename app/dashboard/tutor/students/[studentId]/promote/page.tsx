import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { PromoteStudentClient } from "./PromoteStudentClient";

interface Props {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ subject?: string; placementId?: string }>;
}

export default async function PromoteStudentPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

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
  const { subject, placementId } = await searchParams;

  // Verify student exists and belongs to the same centre
  const student = await prisma.user.findUnique({
    where: { id: studentId, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      dateOfBirth: true,
      centerId: true,
    },
  });

  if (!student) redirect("/dashboard/tutor/students");
  if (user.role !== "SUPER_ADMIN" && student.centerId !== user.centerId) {
    redirect("/dashboard/tutor/students");
  }

  // Load placements that are PROMOTION_PENDING or readyForPromotion
  const placements = await prisma.studentAgeAssessment.findMany({
    where: {
      studentId,
      ...(placementId ? { id: placementId } : {}),
      status: { not: "ARCHIVED" },
    },
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
    },
    orderBy: { subject: "asc" },
  });

  // Load available promotion tests for the relevant age levels
  const ageIds = [...new Set(placements.map((p) => p.currentAgeId))];
  const promotionTests = await prisma.agePromotionTest.findMany({
    where: {
      assessmentAgeId: { in: ageIds },
      isActive: true,
      ...(subject ? { subject: subject as any } : {}),
    },
    include: {
      assessmentAge: {
        select: { displayLabel: true, australianYear: true, ageYear: true, ageMonth: true },
      },
    },
    orderBy: [{ assessmentAge: { ageYear: "asc" } }, { subject: "asc" }],
  });

  // Chronological age for display
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
        title="Promotion Assessment"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Students", href: "/dashboard/tutor/students" },
          { label: student.name ?? "Student", href: `/dashboard/tutor/students/${studentId}` },
          { label: "Assessment", href: `/dashboard/tutor/students/${studentId}/assessment` },
          { label: "Promotion Assessment" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Promotion Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Record a promotion test result for{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {student.name}
            </span>
            {chronoAge && (
              <span className="ml-2 text-sm text-gray-500">
                (chronological age: {chronoAge} yrs)
              </span>
            )}
          </p>
        </div>

        {placements.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No active placements found for this student.
            </p>
          </div>
        ) : promotionTests.length === 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-8 text-center">
            <p className="text-yellow-700 dark:text-yellow-300 font-medium mb-2">
              No promotion tests available
            </p>
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">
              No active promotion tests exist for the student&apos;s current assessment levels.
              Ask your administrator to create promotion tests first.
            </p>
          </div>
        ) : (
          <PromoteStudentClient
            student={{ id: student.id, name: student.name ?? "Student", chronoAge }}
            placements={placements as any}
            promotionTests={promotionTests as any}
            selectedPlacementId={placementId}
            tutorId={user.id}
          />
        )}
      </main>
    </div>
  );
}
