import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import AssessmentWizard from "@/components/dashboard/tutor/AssessmentWizard";

export default async function CreateAssessmentPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER" && user.role !== "CENTER_ADMIN" && user.role !== "CENTER_SUPERVISOR") {
    redirect("/dashboard");
  }

  // Fetch students enrolled in tutor's courses
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      centerId: user.centerId,
      enrollments: {
        some: {
          course: {
            teacherId: user.id
          }
        }
      }
    },
    select: {
      id: true,
      name: true
    }
  });

  // Fetch courses taught by tutor
  const courses = await prisma.course.findMany({
    where: {
      teacherId: user.id
    },
    select: {
      id: true,
      title: true
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="New Assessment" />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Record Subject Assessment</h1>
          <p className="text-gray-600 dark:text-gray-400">Update a student&apos;s academic progress and grade level</p>
        </div>

        <AssessmentWizard students={students} courses={courses} />
      </main>
    </div>
  );
}
