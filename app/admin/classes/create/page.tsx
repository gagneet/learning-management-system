import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreateClassForm } from "./CreateClassForm";

export default async function CreateClassPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (!["SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  // Fetch teachers for the center
  const teachers = await prisma.user.findMany({
    where: {
      centerId: user.centerId,
      role: "TEACHER",
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

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
              Create New Class
            </h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <CreateClassForm teachers={teachers} />
        </div>
      </main>
    </div>
  );
}
