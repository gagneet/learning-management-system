import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import ContentLibraryClient from "@/components/dashboard/tutor/ContentLibraryClient";

export default async function ContentLibraryPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER" && user.role !== "CENTER_ADMIN" && user.role !== "CENTER_SUPERVISOR" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all relevant content data
  const [courses, gradeLevels, exercises] = await Promise.all([
    prisma.course.findMany({
      where: { centerId: user.centerId },
      include: {
        courseUnits: {
          include: {
            lessons: {
              include: {
                exercises: true,
              }
            }
          }
        }
      }
    }),
    prisma.gradeLevel.findMany({
      orderBy: { level: 'asc' }
    }),
    prisma.exercise.findMany({
      where: {
        lesson: {
          module: {
            course: {
              centerId: user.centerId
            }
          }
        }
      },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Content Library" />

      <main id="main-content" className="container mx-auto px-4 py-8 flex-1 scroll-mt-20">
        <ContentLibraryClient
          initialCourses={courses}
          gradeLevels={gradeLevels}
          allExercises={exercises}
        />
      </main>
    </div>
  );
}
