import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EditClassForm } from "./EditClassForm";
import { StudentManagement } from "./StudentManagement";

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (!["SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  const [classData, teachers, students] = await Promise.all([
    prisma.classCohort.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        centerId: user.centerId,
        role: "TEACHER",
      },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: {
        centerId: user.centerId,
        role: "STUDENT",
      },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!classData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/classes"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600"
            >
              ← Back to Classes
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Class: {classData.name}
            </h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 dark:text-white">Class Details</h2>
            <EditClassForm classData={classData} teachers={teachers} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 dark:text-white">Student Management</h2>
            <StudentManagement classId={id} currentMembers={classData.members} allStudents={students} />
          </div>
        </div>
      </main>
    </div>
  );
}
