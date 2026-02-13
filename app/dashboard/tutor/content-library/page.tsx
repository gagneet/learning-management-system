import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import ContentLibraryClient from "./ContentLibraryClient";

export default async function ContentLibraryPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch courses taught by this tutor
  const courses = await prisma.course.findMany({
    where: {
      teacherId: user.id,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  // Fetch all exercises from lessons in tutor's courses
  const exercises = await prisma.exercise.findMany({
    where: {
      lesson: {
        module: {
          course: {
            teacherId: user.id,
          },
        },
      },
      isActive: true,
    },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          module: {
            select: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      { lesson: { module: { course: { title: "asc" } } } },
      { sequenceOrder: "asc" },
    ],
  });

  // Get all students enrolled in tutor's courses
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      enrollments: {
        some: {
          course: {
            teacherId: user.id,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

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
          { label: "Content Library" },
        ]}
      />

      <main className="container mx-auto px-4 py-8">
        <ContentLibraryClient
          exercises={exercises}
          courses={courses}
          students={students}
        />
      </main>
    </div>
  );
}
