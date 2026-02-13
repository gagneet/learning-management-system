import Image from "next/image";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Help & Support | Learning Management System",
  description: "Get help and find answers to common questions",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              LMS
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-blue-600 hover:text-blue-700"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Help & Support
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 text-center">
            Find answers to common questions and get the help you need
          </p>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link
              href="/docs"
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Documentation
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse our comprehensive guides and tutorials
              </p>
            </Link>

            <Link
              href="/contact"
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Contact Us
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get in touch with our support team
              </p>
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Video Tutorials
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Learn with step-by-step video guides
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  How do I create a new course?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Teachers can create courses from their dashboard. Navigate to the Courses section
                  and click "Create New Course". Fill in the course details, add modules and
                  lessons, and publish when ready.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  How do students enroll in courses?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Students can browse available courses from the Courses page. Click on a course to
                  view details and click "Enroll" to join. Some courses may require approval from
                  the teacher.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  What is the gamification system?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Students earn XP points by completing lessons, participating in sessions, and
                  achieving milestones. They can unlock badges, level up, and compete on
                  leaderboards. This motivates learning through friendly competition and rewards.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  How do I schedule a live session?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Teachers can schedule live sessions from the Sessions page. Choose the lesson,
                  select a date and time, add the meeting link (Teams, Zoom, etc.), and save.
                  Students will see upcoming sessions in their dashboard.
                </p>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  How can parents monitor their child's progress?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Parents have access to a dedicated dashboard showing their children's course
                  progress, attendance, grades, and achievements. They receive notifications about
                  important events and milestones.
                </p>
              </div>

              <div className="pb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  What roles are available in the system?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  The system supports 7 roles: Super Admin (full system access), Center Admin
                  (center management), Supervisor (oversight), Finance Admin (financial management),
                  Teacher (course creation), Parent (child monitoring), and Student (learning).
                </p>
              </div>
            </div>
          </div>

          {/* Support Contact */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Still Need Help?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/contact"
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/docs"
                className="inline-block px-8 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                View Docs
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
