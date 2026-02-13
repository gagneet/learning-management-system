import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { HomeworkTrackerClient } from "./HomeworkTrackerClient";

export default async function HomeworkTrackerPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch all homework assignments for the student
  const homeworkAssignments = await prisma.homeworkAssignment.findMany({
    where: {
      studentId: user.id,
    },
    include: {
      course: {
        select: {
          title: true,
        },
      },
      exercise: {
        select: {
          title: true,
        },
      },
      assignedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Homework Tracker"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/student" },
          { label: "Homework" },
        ]}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <HomeworkTrackerClient homework={homeworkAssignments} />
      </main>
    </div>
  );
}
