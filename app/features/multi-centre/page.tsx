import Image from "next/image";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Multi-Centre Support | AetherLearn",
  description: "Manage multiple learning centres with complete data isolation and independent management",
};

export default function MultiCentrePage() {
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
            <div className="text-7xl mb-6">🏢</div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Multi-Centre Support
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Scale your operations with true multi-tenancy architecture
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              What is Multi-Centre Support?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Our platform is built from the ground up to support multiple learning centres (tenants) within a single installation. Each centre operates independently with complete data isolation, custom branding, and autonomous management.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Whether you're running a franchise of learning centers, managing regional branches, or operating educational hubs across different locations, our multi-tenancy architecture ensures each centre maintains its identity while benefiting from centralized infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3">
                🔒 Complete Data Isolation
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Each centre's data is completely isolated. Users, courses, and financial records remain strictly separated with no cross-centre visibility except for super admins.
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-3">
                🎨 Custom Branding
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Each centre can have its own logo, color scheme, and branding settings to maintain unique identity and brand recognition.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
                ⚙️ Independent Configuration
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Configure centre-specific settings including regional preferences, operational hours, fee structures, and academic policies.
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300 mb-3">
                📊 Centralized Oversight
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Super admins can view cross-centre analytics, manage system-wide settings, and monitor performance across all locations.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-4">Perfect For:</h2>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Franchise operations with multiple locations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Regional education providers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Multi-campus institutions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Educational management organizations (EMOs)</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Technical Architecture
            </h2>
            <ul className="space-y-4 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Centre-scoped queries:</strong> All database queries automatically filter by centre ID to ensure data isolation</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Slug uniqueness:</strong> Resource identifiers (like course slugs) are unique per centre, not globally</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Role-based isolation:</strong> Only SUPER_ADMIN role can access data across centres</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Cascade protection:</strong> Deleting a centre safely removes all associated data with proper cascade rules</span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Get Started with Multi-Centre
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
