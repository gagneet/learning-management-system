import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AssessmentReportClient } from "./AssessmentReportClient";

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function AssessmentReportPage({ params }: Props) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  const allowedRoles = ["TEACHER", "CENTER_ADMIN", "CENTER_SUPERVISOR", "SUPER_ADMIN", "PARENT"];
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  const { studentId } = await params;

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      academicProfile: true,
      center: { select: { name: true } },
    },
  });

  if (!student || student.role !== "STUDENT") {
    notFound();
  }

  // PARENT role: verify the student is one of their children
  if (user.role === "PARENT") {
    if (student.parentId !== user.id) {
      redirect("/dashboard");
    }
  } else if (user.role !== "SUPER_ADMIN") {
    // All other non-super-admin roles must share the same centre
    if (student.centerId !== user.centerId) {
      redirect("/dashboard");
    }
  }

  const placements = await prisma.studentAgeAssessment.findMany({
    where: { studentId, status: { not: "ARCHIVED" } },
    include: {
      currentAge: true,
      initialAge: true,
      placedBy: { select: { name: true, role: true } },
      lessonCompletions: {
        include: {
          lesson: {
            select: {
              lessonNumber: true,
              title: true,
              difficultyScore: true,
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
        },
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
    orderBy: { subject: "asc" },
  });

  const reportDate = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AssessmentReportClient
      student={{
        id: student.id,
        name: student.name ?? "Unknown Student",
        email: student.email,
        academicProfile: student.academicProfile
          ? {
              chronologicalAge: student.academicProfile.chronologicalAge,
              readingAge: student.academicProfile.readingAge,
              numeracyAge: student.academicProfile.numeracyAge,
            }
          : null,
        center: { name: student.center.name },
      }}
      placements={placements.map((p) => ({
        id: p.id,
        subject: p.subject,
        lessonsCompleted: p.lessonsCompleted,
        status: p.status,
        readyForPromotion: p.readyForPromotion,
        placedAt: p.placedAt.toISOString(),
        placementMethod: p.placementMethod,
        placementNotes: p.placementNotes,
        currentAge: {
          displayLabel: p.currentAge.displayLabel,
          australianYear: p.currentAge.australianYear,
        },
        initialAge: p.initialAge
          ? { displayLabel: p.initialAge.displayLabel }
          : null,
        placedBy: { name: p.placedBy.name, role: p.placedBy.role },
        lessonCompletions: p.lessonCompletions.map((lc) => ({
          status: lc.status,
          lesson: {
            lessonNumber: lc.lesson.lessonNumber,
            title: lc.lesson.title,
            difficultyScore: lc.lesson.difficultyScore,
          },
        })),
        historyLog: p.historyLog.map((h) => ({
          changeType: h.changeType,
          reason: h.reason,
          testScore: h.testScore,
          createdAt: h.createdAt.toISOString(),
          fromAge: h.fromAge ? { displayLabel: h.fromAge.displayLabel } : null,
          toAge: { displayLabel: h.toAge.displayLabel },
          changedBy: { name: h.changedBy.name, role: h.changedBy.role },
        })),
        promotionAttempts: p.promotionAttempts.map((pa) => ({
          outcome: pa.outcome,
          percentageScore: pa.percentageScore,
          startedAt: pa.startedAt.toISOString(),
          promotionTest: pa.promotionTest
            ? {
                title: pa.promotionTest.title,
                totalMarks: pa.promotionTest.totalMarks,
                passingScore: pa.promotionTest.passingScore,
              }
            : null,
          promotedToAge: pa.promotedToAge
            ? { displayLabel: pa.promotedToAge.displayLabel }
            : null,
        })),
      }))}
      reportGeneratedBy={{ name: user.name ?? null, role: user.role }}
      reportDate={reportDate}
    />
  );
}
