import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              AetherLearn
            </h1>
            <Link
              href="/login"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Learning Management System
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            A comprehensive platform for managing courses, academic profiles, and learning content across multiple centres
          </p>

          {/* Login Portals */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <Link
              href="/login"
              className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-blue-500"
            >
              <div className="text-5xl mb-4" aria-hidden="true">🎓</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Students
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Access your courses, track your progress, earn XP and badges, and view your academic profile.
              </p>
              <span className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg font-semibold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                Student Login
              </span>
            </Link>

            <Link
              href="/login"
              className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-green-500"
            >
              <div className="text-5xl mb-4" aria-hidden="true">👨‍👩‍👧‍👦</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Parents
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Monitor your child&apos;s academic growth, view progress reports, attendance, and billing information.
              </p>
              <span className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg font-semibold group-hover:bg-green-600 group-hover:text-white transition-colors">
                Parent Login
              </span>
            </Link>

            <Link
              href="/login"
              className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-transparent hover:border-purple-500"
            >
              <div className="text-5xl mb-4" aria-hidden="true">👨‍🏫</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Tutors
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage your lessons, track student performance, schedule live sessions, and create course content.
              </p>
              <span className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg font-semibold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                Tutor Login
              </span>
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Multi-Centre Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Support for multiple centres or tenants under one instance with isolated data and management
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Role-Based Access
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Comprehensive RBAC with Admin, Centre Admin, Supervisor, Teacher/Tutor, and Student roles
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Academic Intelligence
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track reading age, numeracy age, comprehension index, and personalised learning paths
              </p>
            </div>
          </div>

          <div className="mt-16">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Key Features
            </h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h4 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">
                  Course Management
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Create and manage course hierarchies with modules, lessons, and rich content
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h4 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">
                  Gamification
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  XP points, levels, badges, achievements, and activity streaks to drive engagement
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h4 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">
                  Live Sessions
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Integrated Teams and Zoom sessions with attendance tracking
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h4 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">
                  Financial Tracking
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Student billing, tutor payments, operational costs, and profit margin reporting
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>AetherLearn - Intelligent Multi-Centre LMS Platform</p>
        </div>
      </footer>
    </div>
  );
}
