import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { GoalsClient } from "./GoalsClient";

export default async function GoalsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch all student goals
  const goals = await prisma.studentGoal.findMany({
    where: {
      studentId: user.id,
    },
    orderBy: [
      { isAchieved: "asc" },
      { targetDate: "asc" },
    ],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="My Goals"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/student" },
          { label: "Goals" },
        ]}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <GoalsClient goals={goals} studentId={user.id} />
      </main>
    </div>
  );
}
