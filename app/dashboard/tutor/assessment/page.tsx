import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AssessmentGridClient } from "./AssessmentGridClient";

export default async function TutorAssessmentGridPage() {
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

  const centreId = user.role === "SUPER_ADMIN" ? undefined : user.centerId;

  // Fetch students with their placements for the assessment grid
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(centreId ? { centerId: centreId } : {}),
    },
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
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Fetch available classes for filter dropdown
  const classes = await prisma.classCohort.findMany({
    where: {
      ...(centreId ? { centreId } : {}),
      isActive: true,
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Calculate chronological ages and assessment grid data
  const today = new Date();
  const SUBJECTS = ["ENGLISH", "MATHEMATICS", "SCIENCE", "STEM", "READING", "WRITING"] as const;

  function ageGap(chronoAge: number, ageYear: number, ageMonth: number) {
    const assessmentAge = ageYear + ageMonth / 12;
    return Math.round((assessmentAge - chronoAge) * 10) / 10;
  }

  function ageBandLabel(gap: number) {
    if (gap >= 0.5) return "ABOVE";
    if (gap >= -0.5) return "ON_LEVEL";
    if (gap >= -1.0) return "SLIGHTLY_BELOW";
    if (gap >= -2.0) return "BELOW";
    return "SIGNIFICANTLY_BELOW";
  }

  const gridData = students.map((student) => {
    const dobMs = student.dateOfBirth ? new Date(student.dateOfBirth).getTime() : null;
    const chronoAge = dobMs
      ? Math.round(((today.getTime() - dobMs) / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10
      : null;

    const placements: Record<string, {
      ageYear: number;
      ageMonth: number;
      displayLabel: string;
      australianYear: string | null;
      currentLessonNumber: number;
      lessonsCompleted: number;
      status: string;
      readyForPromotion: boolean;
      ageGap: number | null;
      ageBand: string | null;
    } | null> = {};

    for (const subject of SUBJECTS) {
      const placement = student.studentAgeAssessments.find((p) => p.subject === subject);
      if (!placement) {
        placements[subject] = null;
        continue;
      }
      const gap = chronoAge !== null
        ? ageGap(chronoAge, placement.currentAge.ageYear, placement.currentAge.ageMonth)
        : null;
      placements[subject] = {
        ageYear: placement.currentAge.ageYear,
        ageMonth: placement.currentAge.ageMonth,
        displayLabel: placement.currentAge.displayLabel,
        australianYear: placement.currentAge.australianYear ?? null,
        currentLessonNumber: placement.currentLessonNumber,
        lessonsCompleted: placement.lessonsCompleted,
        status: placement.status,
        readyForPromotion: placement.readyForPromotion,
        ageGap: gap,
        ageBand: gap !== null ? ageBandLabel(gap) : null,
      };
    }

    return {
      id: student.id,
      name: student.name ?? "Unknown",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString().split("T")[0] : null,
      chronologicalAge: chronoAge,
      placements,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Assessment Grid"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessment Grid" },
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment Grid
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All students × all subjects — current assessment age levels and progress at a glance
          </p>
        </div>
        <AssessmentGridClient
          initialData={gridData}
          subjects={[...SUBJECTS]}
          classes={classes}
        />
      </main>
    </div>
  );
}
