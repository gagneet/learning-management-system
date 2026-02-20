import { Footer } from "@/components/Footer";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata = {
  title: "Documentation | Learning Management System",
  description: "Complete documentation and API reference",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 text-center">
            Documentation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 text-center">
            Everything you need to know about using the Learning Management System
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Getting Started */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                🚀 Getting Started
              </h2>
              <ul className="space-y-3">
                <li>
                  <a href="#introduction" className="text-blue-600 hover:underline">
                    Introduction
                  </a>
                </li>
                <li>
                  <a href="#quick-start" className="text-blue-600 hover:underline">
                    Quick Start Guide
                  </a>
                </li>
                <li>
                  <a href="#user-roles" className="text-blue-600 hover:underline">
                    Understanding User Roles
                  </a>
                </li>
                <li>
                  <a href="#navigation" className="text-blue-600 hover:underline">
                    Navigating the Platform
                  </a>
                </li>
              </ul>
            </div>

            {/* For Teachers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                👨‍🏫 For Teachers
              </h2>
              <ul className="space-y-3">
                <li>
                  <a href="#create-course" className="text-blue-600 hover:underline">
                    Creating a Course
                  </a>
                </li>
                <li>
                  <a href="#manage-modules" className="text-blue-600 hover:underline">
                    Managing Modules & Lessons
                  </a>
                </li>
                <li>
                  <a href="#live-sessions" className="text-blue-600 hover:underline">
                    Scheduling Live Sessions
                  </a>
                </li>
                <li>
                  <a href="#grade-students" className="text-blue-600 hover:underline">
                    Tracking Student Progress
                  </a>
                </li>
              </ul>
            </div>

            {/* For Students */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                👨‍🎓 For Students
              </h2>
              <ul className="space-y-3">
                <li>
                  <a href="#enroll-course" className="text-blue-600 hover:underline">
                    Enrolling in Courses
                  </a>
                </li>
                <li>
                  <a href="#complete-lessons" className="text-blue-600 hover:underline">
                    Completing Lessons
                  </a>
                </li>
                <li>
                  <a href="#join-sessions" className="text-blue-600 hover:underline">
                    Joining Live Sessions
                  </a>
                </li>
                <li>
                  <a href="#gamification" className="text-blue-600 hover:underline">
                    Earning XP & Badges
                  </a>
                </li>
              </ul>
            </div>

            {/* For Administrators */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                🔧 For Administrators
              </h2>
              <ul className="space-y-3">
                <li>
                  <a href="#manage-users" className="text-blue-600 hover:underline">
                    Managing Users
                  </a>
                </li>
                <li>
                  <a href="#center-management" className="text-blue-600 hover:underline">
                    Center Management
                  </a>
                </li>
                <li>
                  <a href="#analytics" className="text-blue-600 hover:underline">
                    Analytics & Reports
                  </a>
                </li>
                <li>
                  <a href="#financial" className="text-blue-600 hover:underline">
                    Financial Management
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* API Reference */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              📡 API Reference
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Our API provides programmatic access to the Learning Management System. All API
              endpoints require authentication and follow REST principles.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Authentication
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 font-mono text-sm">
                  <p className="text-gray-800 dark:text-gray-200">
                    POST /api/auth/signin
                    <br />
                    Content-Type: application/json
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Core Endpoints
                </h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <p>
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      GET /api/courses
                    </code>{" "}
                    - List all courses
                  </p>
                  <p>
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      POST /api/courses
                    </code>{" "}
                    - Create a new course
                  </p>
                  <p>
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      GET /api/users
                    </code>{" "}
                    - List all users
                  </p>
                  <p>
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      GET /api/sessions
                    </code>{" "}
                    - List all sessions
                  </p>
                  <p>
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      GET /api/gamification/:userId
                    </code>{" "}
                    - Get user gamification data
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Rate Limits
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  API requests are rate-limited to 100 requests per minute per user. Authentication
                  endpoints are limited to 20 requests per minute.
                </p>
              </div>
            </div>
          </div>

          {/* Video Tutorials */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              🎥 Video Tutorials
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 mb-4 flex items-center justify-center">
                  <span className="text-4xl">▶️</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Getting Started with LMS
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Learn the basics of navigating the platform
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-48 mb-4 flex items-center justify-center">
                  <span className="text-4xl">▶️</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Creating Your First Course
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Step-by-step guide for teachers
                </p>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Need More Help?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Can&apos;t find what you&apos;re looking for? Visit our support center or contact us directly.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/support"
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Visit Support
              </Link>
              <Link
                href="/contact"
                className="inline-block px-8 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
