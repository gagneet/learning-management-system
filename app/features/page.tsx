import Image from "next/image";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Features | Learning Management System",
  description: "Discover powerful features of our Learning Management System",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image
                src="/aetherlearn-header-logo.svg"
                alt="Aether Learn"
                width={180}
                height={40}
                className="h-10 w-auto"
                priority
              />
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Powerful Features
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 text-center">
            Everything you need to deliver exceptional learning experiences
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Course Management */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Course Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create and organize courses with modules, lessons, and rich content including
                videos, documents, SCORM packages, and quizzes.
              </p>
            </div>

            {/* Multi-Tenancy */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Multi-Tenancy
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Support multiple learning centers with complete data isolation and center-specific
                management.
              </p>
            </div>

            {/* Role-Based Access */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Role-Based Access Control
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                7-tier role system including Super Admin, Center Admin, Supervisors, Finance Admin,
                Teachers, Parents, and Students.
              </p>
            </div>

            {/* Live Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">📹</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Live Sessions
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Integrated support for Teams, Zoom, and other platforms with attendance tracking and
                recording management.
              </p>
            </div>

            {/* Gamification */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Gamification
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Engage students with XP points, levels, badges, achievements, and activity streaks
                to motivate learning.
              </p>
            </div>

            {/* Progress Tracking */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Progress Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor student progress with detailed analytics, lesson completion tracking, and
                academic profiling.
              </p>
            </div>

            {/* Financial Management */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Financial Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track student fees, payments, tutor compensation, and operational costs with
                comprehensive financial reports.
              </p>
            </div>

            {/* Academic Profiles */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Academic Profiles
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track chronological age, reading age, numeracy age, comprehension index, and writing
                proficiency.
              </p>
            </div>

            {/* Audit Logging */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Audit Logging
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Complete audit trail of all system actions for security, compliance, and
                accountability.
              </p>
            </div>

            {/* Parent Portal */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">👪</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Parent Portal
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Parents can monitor their children&apos;s progress, attendance, and academic performance
                in real-time.
              </p>
            </div>

            {/* Responsive Design */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Responsive Design
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access the platform from any device - desktop, tablet, or mobile - with a seamless
                experience.
              </p>
            </div>

            {/* Dark Mode */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-4xl mb-4">🌙</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Theme Customization
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose from Light, Gray, and Dark themes with user preferences saved to your
                account.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Join hundreds of educators using our platform to deliver exceptional learning
              experiences.
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
