import Image from "next/image";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Financial Tracking | AetherLearn",
  description: "Comprehensive billing, payments, and financial management for educational centres",
};

export default function FinancialTrackingPage() {
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
            <div className="text-7xl mb-6">💰</div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Financial Tracking
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Complete financial management from billing to profit analysis
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Why Financial Tracking Matters
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Running an educational centre involves complex financial operations: student fees, tutor payments, operational costs, refunds, and more. Our integrated financial tracking system manages all monetary transactions in one place, providing complete visibility and control.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              From automated invoicing to profit margin analysis, every financial aspect of your centre is tracked, categorized, and reported with precision. Make informed decisions with real-time financial data at your fingertips.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border-l-4 border-green-600">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
                💵 Student Fee Management
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Complete lifecycle of student payments:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• Automated invoice generation based on enrollment</li>
                <li>• Flexible fee structures (monthly, per-course, per-session)</li>
                <li>• Multiple payment methods tracking</li>
                <li>• Payment reminders and overdue notifications</li>
                <li>• Partial payment support</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border-l-4 border-blue-600">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3">
                👨‍🏫 Tutor Payment Tracking
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Transparent compensation management:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• Hourly rate, session-based, or salary models</li>
                <li>• Automatic calculation from session attendance</li>
                <li>• Payment schedule configuration (weekly, monthly)</li>
                <li>• Bonus and penalty tracking</li>
                <li>• Payment history and tax documentation</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border-l-4 border-purple-600">
              <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-3">
                🏢 Operational Costs
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Track all business expenses:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• Rent and utilities</li>
                <li>• Software subscriptions and licenses</li>
                <li>• Marketing and advertising expenses</li>
                <li>• Equipment and supplies</li>
                <li>• Categorized expense reports</li>
              </ul>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border-l-4 border-orange-600">
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300 mb-3">
                🔄 Refunds &amp; Adjustments
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Handle exceptions gracefully:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• Full or partial refund processing</li>
                <li>• Refund approval workflows (Finance Admin)</li>
                <li>• Reason tracking and documentation</li>
                <li>• Audit trail for all adjustments</li>
                <li>• Credit note generation</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-8 mb-8 border-2 border-green-400">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Financial Reports
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">📊 Revenue Reports</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total student fees collected, broken down by time period, course, or student. Track revenue trends and forecast future income.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2">💸 Expense Reports</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All operational costs and tutor payments categorized and totaled. Identify spending patterns and cost-saving opportunities.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">📈 Profit Analysis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Revenue minus expenses equals profit. See profit margins by time period, course, or centre. Make data-driven business decisions.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h4 className="font-bold text-orange-900 dark:text-orange-300 mb-2">📅 Cash Flow</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track money in and out by date. Predict cash needs, plan for large expenses, and ensure sufficient operating capital.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-4">Multi-Currency Support:</h2>
            <p className="text-lg mb-4">
              Operating internationally? We&apos;ve got you covered:
            </p>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <span className="mr-3 text-2xl">💱</span>
                <span>Support for 150+ currencies with automatic conversion rates</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">🌍</span>
                <span>Per-centre currency configuration (USD, EUR, GBP, INR, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">📊</span>
                <span>Consolidated reports convert all transactions to base currency</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">🔄</span>
                <span>Real-time or fixed exchange rates based on your preference</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Security &amp; Compliance
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-red-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">🔒 Audit Logging</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Every financial transaction is logged with user ID, timestamp, IP address, and action details. Complete audit trail for compliance and security investigations.
                </p>
              </div>
              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">✅ Approval Workflows</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Refunds and adjustments require Finance Admin approval. Prevents unauthorized changes and ensures proper oversight of financial operations.
                </p>
              </div>
              <div className="border-l-4 border-green-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">🏦 Payment Gateway Ready</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Integration-ready for Stripe, PayPal, Square, and other payment processors. PCI-compliant architecture keeps sensitive payment data secure.
                </p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">📑 Tax Documentation</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Generate tax-ready reports for income, expenses, and payments. Export to popular accounting software formats (QuickBooks, Xero, CSV).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Role-Based Financial Access
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">👑</span>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Super Admin &amp; Centre Admin</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Full access to all financial data, reports, and operations within their scope.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">💰</span>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Finance Admin</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Specialized financial permissions including approval authority for refunds and adjustments.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">👀</span>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Centre Supervisor</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Read-only access to financial reports and operational costs for oversight purposes.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">👨‍🏫</span>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Teachers</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">View their own payment history and rates. No access to student financial data.</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-2xl mr-3">👪</span>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Parents</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">View invoices and payment history for their children only. Make payments through parent portal.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Take Control of Your Finances
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
