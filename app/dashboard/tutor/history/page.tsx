import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import SessionHistoryClient from "./SessionHistoryClient";

export default async function SessionHistoryPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch past sessions (completed or cancelled)
  const sessions = await prisma.session.findMany({
    where: {
      tutorId: user.id,
      status: {
        in: ["COMPLETED", "CANCELLED"],
      },
    },
    include: {
      studentEnrollments: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      attendanceRecords: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });

  // Get unique students from enrollments for filter
  const studentSet = new Set<string>();
  const studentMap = new Map<string, { id: string; name: string }>();

  sessions.forEach((session) => {
    session.studentEnrollments.forEach((enrollment) => {
      if (!studentSet.has(enrollment.student.id)) {
        studentSet.add(enrollment.student.id);
        studentMap.set(enrollment.student.id, {
          id: enrollment.student.id,
          name: enrollment.student.name || "Unknown",
        });
      }
    });
  });

  const students = Array.from(studentMap.values());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{
          name: user.name || "",
          email: user.email || "",
          role: user.role,
        }}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/tutor" },
          { label: "Session History" },
        ]}
      />

      <main className="container mx-auto px-4 py-8">
        <SessionHistoryClient sessions={sessions} students={students} />
      </main>
    </div>
  );
}
