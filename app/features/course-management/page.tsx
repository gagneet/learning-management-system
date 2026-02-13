import Image from "next/image";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Course Management | AetherLearn",
  description: "Hierarchical course structure with modules, lessons, and diverse content types",
};

export default function CourseManagementPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              AetherLearn
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Features
              </Link>
              <Link href="/login" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-7xl mb-6">📚</div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Course Management
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Multi-level course structure with flexible content delivery
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              What is Multi-Level Course Delivery?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Our course management system uses a powerful three-tier hierarchy: Courses contain Modules, Modules contain Lessons, and Lessons contain diverse Content types. This structure provides maximum flexibility while maintaining organization and progress tracking.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Whether you're teaching programming, mathematics, languages, or any other subject, our system adapts to your content needs with support for documents, videos, interactive quizzes, SCORM packages, xAPI activities, and embedded content.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Course Hierarchy
            </h2>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <div className="flex items-center mb-3">
                  <span className="text-4xl mr-4">📘</span>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-600">Course</h3>
                    <p className="text-gray-600 dark:text-gray-300">Top-level learning program (e.g., "Python Programming for Beginners")</p>
                  </div>
                </div>
                <div className="ml-12 mt-4 space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-3xl mr-3">📑</span>
                      <div>
                        <h4 className="text-xl font-bold text-purple-600">Module</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Thematic section (e.g., "Variables and Data Types")</p>
                      </div>
                    </div>
                    <div className="ml-10 mt-3 space-y-2">
                      <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">📄</span>
                          <div>
                            <h5 className="text-lg font-bold text-green-600">Lesson</h5>
                            <p className="text-gray-600 dark:text-gray-300 text-xs">Individual learning unit (e.g., "Introduction to Strings")</p>
                          </div>
                        </div>
                        <div className="ml-8 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <p>Contains: 📹 Videos, 📝 Documents, ❓ Quizzes, 🎮 Interactive Content</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3">
                📹 Video Content
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Embed videos from any source with playback tracking. Support for YouTube, Vimeo, or self-hosted content. Automatically track watch time and completion.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-3">
                📝 Document Library
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Rich text documents, PDFs, slideshows, and more. Full-text search, version control, and download tracking built-in.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
                ❓ Interactive Quizzes
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Create assessments with multiple choice, true/false, short answer, and more. Automatic grading, instant feedback, and detailed analytics.
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300 mb-3">
                🎮 SCORM &amp; xAPI
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Full support for SCORM 1.2, 2004, and xAPI (Tin Can) packages. Import existing e-learning content or create new interactive experiences.
              </p>
            </div>

            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-pink-900 dark:text-pink-300 mb-3">
                🔗 Embedded Content
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Embed external tools, simulations, or interactive applications directly into lessons. Support for iframes and custom embeds.
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-3">
                📊 Progress Tracking
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Automatic progress tracking at lesson, module, and course levels. Visual progress indicators and completion certificates.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-4">Course Lifecycle Management:</h2>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <span className="mr-3 text-2xl">📝</span>
                <span><strong>Draft Mode:</strong> Create and refine courses privately before publishing</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✅</span>
                <span><strong>Published:</strong> Live courses available for enrollment and learning</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">📦</span>
                <span><strong>Archived:</strong> Completed or retired courses remain accessible for records</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">🔄</span>
                <span><strong>Versioning:</strong> Update content while preserving student progress</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Teacher-Friendly Features
            </h2>
            <ul className="space-y-4 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Drag-and-drop ordering:</strong> Easily reorder modules and lessons within courses</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Bulk operations:</strong> Upload multiple files, create lessons in batches, or duplicate existing content</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Content library:</strong> Reuse content across multiple courses and centres</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Analytics dashboard:</strong> See what content engages students and where they struggle</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Prerequisite chains:</strong> Define learning sequences and unlock content progressively</span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Creating Courses
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
