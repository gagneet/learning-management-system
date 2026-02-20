import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

export default async function LessonTemplatesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER" && user.role !== "CENTER_ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const templates = await prisma.sessionTemplate.findMany({
    where: { tutorId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Lesson Templates" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lesson Templates</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your recurring session structures and templates</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Create Template
          </button>
        </div>

        {templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <FileText className="text-blue-500 h-8 w-8 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{template.title || 'Untitled Template'}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{template.description || 'No description provided.'}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-400 uppercase">{template.dayOfWeek}</span>
                  <Link href={`/dashboard/tutor/planner?templateId=${template.id}`} className="text-blue-600 text-sm font-bold hover:underline">
                    Use Template
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
             <div className="text-5xl mb-4">📝</div>
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">No templates found</h2>
             <p className="text-gray-500 mt-2">Create your first template to speed up session planning.</p>
          </div>
        )}
      </main>
    </div>
  );
}
