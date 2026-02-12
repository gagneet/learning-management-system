import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "7-Tier RBAC System | AetherLearn",
  description: "Comprehensive role-based access control with 7 distinct user roles for granular permissions management",
};

export default function RoleBasedAccessPage() {
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
            <div className="text-7xl mb-6">🔐</div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              7-Tier RBAC System
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Granular permissions management for every stakeholder in your organization
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              What is Role-Based Access Control?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Our comprehensive RBAC system provides seven distinct user roles, each with carefully crafted permissions tailored to their responsibilities. From system administrators to students, every user has exactly the access they need—nothing more, nothing less.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              This hierarchical permission structure ensures data security, operational efficiency, and compliance with educational governance standards while maintaining flexibility for your unique organizational needs.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border-l-4 border-red-600">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">👑</span>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-300">
                  Super Admin
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Full system access across all centres. Manages global settings, system configuration, and cross-centre analytics.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Perfect for: Platform owners, technical administrators
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border-l-4 border-blue-600">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">🎯</span>
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300">
                  Centre Admin
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Administrative control within their centre. Manages users, courses, finances, and centre-specific settings.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Perfect for: Centre heads, branch managers
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border-l-4 border-purple-600">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">👀</span>
                <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300">
                  Centre Supervisor
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Supervisory access within their centre. Monitors academic progress, reviews teacher performance, and oversees operations.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Perfect for: Academic coordinators, operations managers
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border-l-4 border-green-600">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">💰</span>
                <h3 className="text-xl font-bold text-green-900 dark:text-green-300">
                  Finance Admin
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Financial management and billing oversight. Handles invoicing, payments, refunds, and financial reporting within their centre.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Perfect for: Accountants, billing administrators
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border-l-4 border-yellow-600">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">👨‍🏫</span>
                <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-300">
                  Teacher
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Course creation and student management. Creates content, tracks progress, manages live sessions, and communicates with parents.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Perfect for: Tutors, instructors, educators
              </p>
            </div>

            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-6 border-l-4 border-pink-600">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">👪</span>
                <h3 className="text-xl font-bold text-pink-900 dark:text-pink-300">
                  Parent
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                View children's progress and academic information. Monitors performance, communicates with teachers, and tracks attendance.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Perfect for: Parents, guardians
              </p>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border-l-4 border-indigo-600">
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">🎓</span>
                <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300">
                  Student
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Course enrollment and learning activities. Accesses content, completes lessons, earns achievements, and joins live sessions.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                Perfect for: Learners of all ages
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-4">Security Features:</h2>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Audit logging for all privileged operations (CREATE, UPDATE, DELETE, APPROVE)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Multi-tenancy enforcement preventing cross-centre data access</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Centre ID validation on every request with injection prevention</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Permission-based API access control with resource-level checks</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Session-based authentication with NextAuth.js and secure password hashing</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Technical Implementation
            </h2>
            <ul className="space-y-4 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Granular permissions:</strong> 50+ distinct permissions across user management, courses, finance, and system settings</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>RBAC helpers:</strong> Centralized permission checking with <code>hasPermission()</code> and <code>requirePermission()</code> functions</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Session integration:</strong> User role and centreId stored in session for efficient access control</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>API protection:</strong> Every endpoint validates authentication, role permissions, and centre access</span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Experience Secure Access Control
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
