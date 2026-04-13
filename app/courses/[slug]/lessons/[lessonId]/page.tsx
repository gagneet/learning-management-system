import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import LessonPlanPreview from "@/components/lesson-plans/LessonPlanPreview";
import { lessonPlanFromSource } from "@/lib/lesson-plans";

const INTERNAL_PLAN_ROLES = ["TEACHER", "CENTER_ADMIN", "CENTER_SUPERVISOR", "SUPER_ADMIN"];

interface LessonDetailPageProps {
  params: Promise<{
    slug: string;
    lessonId: string;
  }>;
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  const { slug, lessonId } = await params;

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      module: {
        course: {
          slug,
          ...(user.role === "SUPER_ADMIN" ? {} : { centerId: user.centerId }),
        },
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      contents: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      module: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              teacher: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      plan: true,
    },
  });

  if (!lesson) {
    notFound();
  }

  const plan = lessonPlanFromSource(lesson.plan);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{lesson.module.course.title}</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/courses/${lesson.module.course.slug}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Back to course
            </Link>
            {INTERNAL_PLAN_ROLES.includes(user.role) ? (
              <Link
                href="/dashboard/tutor/lessons"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Open lesson builder
              </Link>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Module
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{lesson.module.title}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Instructor
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
              {lesson.module.course.teacher.name}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Content items
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{lesson.contents.length}</p>
          </div>
        </div>

        <LessonPlanPreview
          lessonTitle={lesson.title}
          lessonDescription={lesson.description}
          moduleTitle={lesson.module.title}
          plan={plan}
          showTeacherNotes={INTERNAL_PLAN_ROLES.includes(user.role)}
        />

        {lesson.contents.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Attached content</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {lesson.contents.map((content) => (
                <div
                  key={content.id}
                  className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{content.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {content.type}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
