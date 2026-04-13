import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import LessonBuilderClient from "./LessonBuilderClient";
import { lessonPlanFromSource } from "@/lib/lesson-plans";

const LESSON_EDITOR_ROLES = ["TEACHER", "CENTER_ADMIN", "CENTER_SUPERVISOR", "SUPER_ADMIN"];

export default async function TutorLessonsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (!LESSON_EDITOR_ROLES.includes(user.role)) {
    redirect("/dashboard");
  }

  const courseWhere =
    user.role === "SUPER_ADMIN"
      ? {}
      : user.role === "TEACHER"
        ? { centerId: user.centerId, teacherId: user.id }
        : { centerId: user.centerId };

  const courses = await prisma.course.findMany({
    where: courseWhere,
    select: {
      id: true,
      title: true,
      slug: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              plan: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const serializedCourses = courses.map((course) => ({
    ...course,
    modules: course.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        plan: lessonPlanFromSource(lesson.plan),
      })),
    })),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name || "", email: user.email || "", role: user.role || "" }}
        breadcrumbs={[
          { label: "Tutor Dashboard", href: "/dashboard/tutor" },
          { label: "Lesson Builder" },
        ]}
      />

      <main className="container mx-auto px-4 py-8">
        <LessonBuilderClient
          initialCourses={serializedCourses}
          userRole={user.role}
        />
      </main>
    </div>
  );
}
