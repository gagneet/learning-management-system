import Image from "next/image";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "GDPR Compliance | Learning Management System",
  description: "Information about GDPR compliance and data protection",
};

export default function GDPRPage() {
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
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            GDPR Compliance
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Our Commitment to GDPR
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We are committed to protecting your personal data and respecting your privacy rights
                in accordance with the General Data Protection Regulation (GDPR).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Your Rights Under GDPR
              </h2>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>
                  <strong>Right to Access:</strong> You have the right to request copies of your
                  personal data.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> You have the right to request that we
                  correct any information you believe is inaccurate.
                </li>
                <li>
                  <strong>Right to Erasure:</strong> You have the right to request that we erase
                  your personal data, under certain conditions.
                </li>
                <li>
                  <strong>Right to Restrict Processing:</strong> You have the right to request that
                  we restrict the processing of your personal data, under certain conditions.
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> You have the right to request that we
                  transfer the data that we have collected to another organization, or directly to
                  you.
                </li>
                <li>
                  <strong>Right to Object:</strong> You have the right to object to our processing
                  of your personal data, under certain conditions.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Protection Measures
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to ensure a level of
                security appropriate to the risk, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Encryption of personal data</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Audit logging of all data access and modifications</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Audit Trail and Compliance
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                All actions within our system are logged for security and compliance purposes. This
                audit trail includes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                <li>User authentication and access events</li>
                <li>Data modifications and deletions</li>
                <li>Administrative actions</li>
                <li>Financial transactions</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                These logs are securely stored and accessible only to authorized personnel for
                security monitoring and compliance verification.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Exercise Your Rights
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                To exercise any of your GDPR rights, please contact us:
              </p>
              <ul className="list-none text-gray-600 dark:text-gray-300 space-y-2">
                <li>Email: privacy@lms.gagneet.com</li>
                <li>Phone: +1 (555) 123-4567</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                We will respond to your request within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Processing Agreement
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                For educational institutions and organizations using our platform, we offer a Data
                Processing Agreement (DPA) that outlines our responsibilities as a data processor.
                Please contact us for more information.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                For more information about how we collect and use your data, please see our{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
