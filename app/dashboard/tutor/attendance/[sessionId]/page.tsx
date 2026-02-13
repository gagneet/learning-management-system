import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AttendanceMarkingClient } from "./AttendanceMarkingClient";

interface AttendancePageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function AttendanceMarkingPage({ params }: AttendancePageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const { sessionId } = await params;

  // Fetch session data with students and existing attendance
  const sessionData = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      tutor: {
        select: {
          name: true,
        },
      },
      studentEnrollments: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
      },
      attendanceRecords: {
        include: {
          student: {
            select: {
              name: true,
            },
          },
          markedBy: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!sessionData) {
    notFound();
  }

  // Verify tutor owns this session
  if (sessionData.tutorId !== user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title={`Mark Attendance`}
        breadcrumbs={[
          { label: "Sessions", href: "/dashboard/tutor/sessions" },
          { label: sessionData.title },
        ]}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <AttendanceMarkingClient sessionData={sessionData} />
      </main>
    </div>
  );
}
