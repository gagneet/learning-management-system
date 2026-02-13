import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";

export default async function TutorResourcesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Teaching Resources" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Teaching Resources</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Access teaching materials, templates, and helpful resources
          </p>
        </div>

        {/* Resource Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Lesson Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Lesson Templates</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Pre-built lesson structures and activity templates to speed up course creation
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/tutor/resources/templates"
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
              >
                Browse Templates
              </Link>
            </div>
          </div>

          {/* Assessment Tools */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Assessment Tools</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Quiz builders, rubrics, and grading templates for evaluating student performance
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/tutor/resources/assessments"
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
              >
                View Tools
              </Link>
            </div>
          </div>

          {/* Media Library */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Media Library</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Videos, images, and interactive content to enhance your lessons
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/tutor/resources/media"
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
              >
                Browse Media
              </Link>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">💡</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Best Practices</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Teaching guides, tips, and strategies for effective online instruction
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/tutor/resources/guides"
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
              >
                Read Guides
              </Link>
            </div>
          </div>

          {/* Course Materials */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Course Materials</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Textbooks, workbooks, and supplementary materials for different subjects
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/tutor/resources/materials"
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
              >
                View Materials
              </Link>
            </div>
          </div>

          {/* Tech Support */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🛠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Tech Support</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Platform guides, troubleshooting tips, and technical documentation
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/tutor/resources/support"
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
              >
                Get Help
              </Link>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">ℹ️</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Resource Library Coming Soon
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                We're building a comprehensive resource library to support your teaching. Check back soon for
                ready-to-use templates, assessments, and teaching materials. In the meantime, you can create
                custom content through the{" "}
                <Link href="/admin/courses" className="underline font-semibold">
                  course management
                </Link>{" "}
                interface.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
