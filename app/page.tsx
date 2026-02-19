import Link from "next/link";
import Image from "next/image";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Navigation */}
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
            <div className="flex items-center gap-6">
              <Link href="/features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
                Features
              </Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
                Contact
              </Link>
              <Link
                href="/login"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Intelligent Multi-Centre Learning Platform
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Empower personalized learning with adaptive content, multi-level tutoring, and comprehensive academic tracking. One platform for students, parents, tutors, and administrators.
          </p>

          {/* Hero CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 mb-16 text-white max-w-4xl mx-auto shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">Transform Your Learning Center Today</h3>
            <p className="text-xl mb-8 text-blue-50">
              Join centers worldwide using our platform to deliver personalized, adaptive learning experiences
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                prefetch={false}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started Free
              </Link>
              <Link
                href="/features"
                prefetch={false}
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
              >
                Explore Features
              </Link>
            </div>
          </div>

          {/* Core Features Showcase */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Core Platform Capabilities
            </h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Link
                href="/features/multi-centre"
                prefetch={false}
                className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 cursor-pointer"
              >
                <div className="text-5xl mb-4">🏢</div>
                <h3 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                  Multi-Centre Support
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Support multiple learning centres with complete data isolation, custom branding, and independent management
                </p>
                <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:underline">
                  Learn more →
                </span>
              </Link>

              <Link
                href="/features/role-based-access"
                prefetch={false}
                className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 cursor-pointer"
              >
                <div className="text-5xl mb-4">🔐</div>
                <h3 className="text-2xl font-semibold mb-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                  Role-Based Access
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  7-tier permission system with Super Admin, Center Admin, Supervisor, Finance Admin, Teacher, Parent, and Student roles
                </p>
                <span className="text-purple-600 dark:text-purple-400 font-semibold group-hover:underline">
                  Learn more →
                </span>
              </Link>

              <Link
                href="/features/academic-intelligence"
                prefetch={false}
                className="group bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500 cursor-pointer"
              >
                <div className="text-5xl mb-4">🧠</div>
                <h3 className="text-2xl font-semibold mb-4 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300">
                  Academic Intelligence
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Track reading age, numeracy age, comprehension index, and create personalized learning paths based on assessment
                </p>
                <span className="text-green-600 dark:text-green-400 font-semibold group-hover:underline">
                  Learn more →
                </span>
              </Link>
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="mt-16">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Comprehensive Feature Set
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto text-left">
              <Link
                href="/features/course-management"
                prefetch={false}
                className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-400 cursor-pointer"
              >
                <div className="text-4xl mb-3">📚</div>
                <h4 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400 group-hover:text-blue-700">
                  Course Management
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Multi-level adaptive content delivery with personalized learning paths
                </p>
                <span className="text-sm text-blue-600 dark:text-blue-400 group-hover:underline">
                  Explore →
                </span>
              </Link>

              <Link
                href="/features/gamification"
                prefetch={false}
                className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-400 cursor-pointer"
              >
                <div className="text-4xl mb-3">🎮</div>
                <h4 className="font-semibold text-lg mb-2 text-purple-600 dark:text-purple-400 group-hover:text-purple-700">
                  Gamification
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  XP points, levels, badges, achievements, and streaks to motivate learners
                </p>
                <span className="text-sm text-purple-600 dark:text-purple-400 group-hover:underline">
                  Explore →
                </span>
              </Link>

              <Link
                href="/features/live-sessions"
                prefetch={false}
                className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-xl transition-all border-2 border-transparent hover:border-green-400 cursor-pointer"
              >
                <div className="text-4xl mb-3">📹</div>
                <h4 className="font-semibold text-lg mb-2 text-green-600 dark:text-green-400 group-hover:text-green-700">
                  Live Sessions
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Multi-student sessions with individual content and video/physical options
                </p>
                <span className="text-sm text-green-600 dark:text-green-400 group-hover:underline">
                  Explore →
                </span>
              </Link>

              <Link
                href="/features/financial-tracking"
                prefetch={false}
                className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-xl transition-all border-2 border-transparent hover:border-orange-400 cursor-pointer"
              >
                <div className="text-4xl mb-3">💰</div>
                <h4 className="font-semibold text-lg mb-2 text-orange-600 dark:text-orange-400 group-hover:text-orange-700">
                  Financial Tracking
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  Complete billing, payments, and financial reporting with profit analysis
                </p>
                <span className="text-sm text-orange-600 dark:text-orange-400 group-hover:underline">
                  Explore →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
