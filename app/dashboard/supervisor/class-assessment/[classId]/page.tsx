import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { ClassAssessmentClient } from "./ClassAssessmentClient";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function ClassAssessmentDetailPage({ params }: PageProps) {
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

  const { classId } = await params;

  const classData = await prisma.classCohort.findUnique({
    where: { id: classId },
    include: {
      teacher: {
        select: { id: true, name: true },
      },
      members: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              dateOfBirth: true,
              studentAgeAssessments: {
                where: { status: { not: "ARCHIVED" } },
                include: {
                  currentAge: {
                    select: {
                      ageYear: true,
                      ageMonth: true,
                      displayLabel: true,
                      australianYear: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!classData) {
    redirect("/dashboard/supervisor/class-assessment");
  }

  // Multi-tenancy check: ensure class belongs to user's centre
  if (
    user.role !== "SUPER_ADMIN" &&
    classData.centreId !== user.centerId
  ) {
    redirect("/dashboard/supervisor/class-assessment");
  }

  const canEdit =
    user.role === "CENTER_ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    user.role === "CENTER_SUPERVISOR" ||
    user.role === "TEACHER";

  // Compute chronological age for each student from dateOfBirth
  const today = new Date();

  const membershipsWithAge = classData.members.map((membership) => {
    const dob = membership.student.dateOfBirth;
    let chronologicalAge: number | null = null;
    if (dob) {
      chronologicalAge =
        Math.round(
          ((today.getTime() - new Date(dob).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)) *
            10
        ) / 10;
    }

    return {
      student: {
        id: membership.student.id,
        name: membership.student.name,
        dateOfBirth: dob ? new Date(dob).toISOString() : null,
        chronologicalAge,
        studentAgeAssessments: membership.student.studentAgeAssessments.map(
          (assessment) => ({
            id: assessment.id,
            subject: assessment.subject,
            lessonsCompleted: assessment.lessonsCompleted,
            readyForPromotion: assessment.readyForPromotion,
            status: assessment.status,
            currentAge: {
              ageYear: assessment.currentAge.ageYear,
              ageMonth: assessment.currentAge.ageMonth,
              displayLabel: assessment.currentAge.displayLabel,
              australianYear: assessment.currentAge.australianYear,
            },
          })
        ),
      },
    };
  });

  const clientClassData = {
    id: classData.id,
    name: classData.name,
    subject: classData.subject,
    status: classData.status,
    centreId: classData.centreId,
    teacherName: classData.teacher.name,
    memberships: membershipsWithAge,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title={`Class Assessment – ${classData.name}`}
        breadcrumbs={[
          { label: "Supervisor Dashboard", href: "/dashboard/supervisor" },
          { label: "Class Assessment", href: "/dashboard/supervisor/class-assessment" },
          { label: classData.name },
        ]}
      />

      <main className="container mx-auto px-4 py-8">
        <ClassAssessmentClient classData={clientClassData} canEdit={canEdit} />
      </main>
    </div>
  );
}
