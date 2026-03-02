import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { Users, BookOpen, ChevronRight, GraduationCap } from "lucide-react";

export default async function ClassAssessmentIndexPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { user } = session;

  if (
    user.role !== "TEACHER" &&
    user.role !== "CENTER_ADMIN" &&
    user.role !== "CENTER_SUPERVISOR" &&
    user.role !== "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const centreId = user.role === "SUPER_ADMIN" ? undefined : user.centerId;

  const classes = await prisma.classCohort.findMany({
    where: {
      ...(centreId ? { centreId } : {}),
      status: "ACTIVE",
    },
    include: {
      teacher: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          members: {
            where: { status: "ACTIVE" },
          },
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  const SUBJECT_COLOURS: Record<string, string> = {
    ENGLISH:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    MATHEMATICS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    SCIENCE:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    STEM:        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    READING:     "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    WRITING:     "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Class Assessment Overview"
        breadcrumbs={[
          { label: "Supervisor Dashboard", href: "/dashboard/supervisor" },
          { label: "Class Assessment" },
        ]}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Class Assessment Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select a class to view student assessment levels side-by-side across all subjects.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {classes.length}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Classes</div>
            <div className="text-xs text-gray-400 mt-0.5">at this centre</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              {classes.reduce((sum, c) => sum + c._count.members, 0)}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Students</div>
            <div className="text-xs text-gray-400 mt-0.5">across all classes</div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {new Set(classes.map((c) => c.subject)).size}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Subjects Covered</div>
            <div className="text-xs text-gray-400 mt-0.5">across all active classes</div>
          </div>
        </div>

        {/* Classes grid */}
        {classes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
            <GraduationCap className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No active classes found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              There are no active class cohorts at this centre yet. Classes will appear here once they are created and set to active.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls) => {
              const subjectColour =
                SUBJECT_COLOURS[cls.subject?.toUpperCase() ?? ""] ??
                "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";

              return (
                <Link
                  key={cls.id}
                  href={`/dashboard/supervisor/class-assessment/${cls.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 overflow-hidden"
                >
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      {cls.subject ? (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${subjectColour}`}
                        >
                          {cls.subject.charAt(0) + cls.subject.slice(1).toLowerCase()}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          Multi-subject
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors mt-0.5" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cls.name}
                    </h3>
                    {cls.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {cls.description}
                      </p>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4 space-y-2.5">
                    {/* Student count */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        Active students
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {cls._count.members}
                        {cls.maxCapacity > 0 && (
                          <span className="text-gray-400 font-normal text-xs ml-1">
                            / {cls.maxCapacity}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Teacher */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Teacher</span>
                      <span className="font-medium text-gray-900 dark:text-white truncate max-w-[60%] text-right">
                        {cls.teacher.name ?? "Unassigned"}
                      </span>
                    </div>

                    {/* Grade range */}
                    {(cls.gradeMin !== null || cls.gradeMax !== null) && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Year range</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cls.gradeMin !== null && cls.gradeMax !== null
                            ? `Year ${cls.gradeMin} – ${cls.gradeMax}`
                            : cls.gradeMin !== null
                            ? `Year ${cls.gradeMin}+`
                            : `Up to Year ${cls.gradeMax}`}
                        </span>
                      </div>
                    )}

                    {/* Capacity bar */}
                    {cls.maxCapacity > 0 && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              cls._count.members / cls.maxCapacity >= 0.9
                                ? "bg-red-500"
                                : cls._count.members / cls.maxCapacity >= 0.7
                                ? "bg-yellow-500"
                                : "bg-emerald-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                (cls._count.members / cls.maxCapacity) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card footer CTA */}
                  <div className="px-5 pb-4">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                      View assessment grid
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
