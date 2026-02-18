import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default async function CourseCreatePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Only teachers and admins can create courses
  if (user.role !== "TEACHER" && user.role !== "CENTER_ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                LMS
              </Link>
              <span className="text-gray-400">›</span>
              <span className="text-gray-600 dark:text-gray-300">Create Course</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/dashboard/tutor/courses"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600"
              >
                ← Back to Courses
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Course
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Fill in the details below to create a new course
          </p>

          {/* Course Creation Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <form className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Course Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Introduction to Programming"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="slug"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Course Slug *
                    </label>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., introduction-to-programming"
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      URL-friendly identifier for the course
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Describe what students will learn in this course..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="thumbnail"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Thumbnail URL
                    </label>
                    <input
                      type="url"
                      id="thumbnail"
                      name="thumbnail"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* Course Settings */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Course Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Draft courses are only visible to you
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="level"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Level
                    </label>
                    <select
                      id="level"
                      name="level"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/dashboard/tutor/courses"
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Course
                </button>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                📝 Next Steps
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                After creating your course, you&apos;ll be able to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-1">
                <li>Add modules to organize your course content</li>
                <li>Create lessons with videos, documents, and quizzes</li>
                <li>Schedule live sessions for your students</li>
                <li>Manage student enrollments and track progress</li>
              </ul>
            </div>
          </div>

          {/* Note about API */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: This is a UI demonstration page. To fully implement course creation,
              <br />
              you&apos;ll need to connect this form to the existing API endpoint at{" "}
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                POST /api/courses
              </code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
