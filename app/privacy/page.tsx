import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                Welcome to the Learning Management System ("LMS", "we", "us", or "our"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our learning management platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
              <p className="mb-4">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Name and contact information (email address, phone number)</li>
                <li>User credentials (username, password)</li>
                <li>Profile information (photo, bio, language preferences)</li>
                <li>Academic information (courses, progress, grades)</li>
                <li>Financial information (for payment processing)</li>
                <li>Special needs or accessibility requirements</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Usage Information</h3>
              <p className="mb-4">We automatically collect certain information when you use our platform:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Log data (IP address, browser type, pages visited)</li>
                <li>Device information (operating system, device identifiers)</li>
                <li>Learning activity (courses viewed, lessons completed, time spent)</li>
                <li>Session recordings (for live classes)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Comprehensive Audit Trail System</h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-4">
                <p className="font-semibold text-blue-900 mb-2">🔒 Important: All Actions Are Logged</p>
                <p className="text-blue-800">
                  Our platform maintains a comprehensive audit trail of all actions performed within the system. This is a critical security and compliance feature that ensures accountability and enables us to protect your data.
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3">What is Logged</h3>
              <p className="mb-4">Our audit system records the following information for every action:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>User Actions:</strong> All create, update, delete, approve, and reject operations</li>
                <li><strong>User Identity:</strong> Who performed the action (user ID, name, role)</li>
                <li><strong>Timestamp:</strong> When the action occurred</li>
                <li><strong>Resource Details:</strong> What was changed (before and after states)</li>
                <li><strong>IP Address:</strong> Where the action originated from</li>
                <li><strong>Centre Changes:</strong> When users, students, or tutors change learning centres</li>
                <li><strong>Data Integrity:</strong> Ensures no data is lost or corrupted during centre transfers</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Why We Log Actions</h3>
              <p className="mb-4">The audit trail serves several important purposes:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Security:</strong> Detect and investigate unauthorized access or suspicious activity</li>
                <li><strong>Compliance:</strong> Meet regulatory requirements (GDPR, FERPA, etc.)</li>
                <li><strong>Accountability:</strong> Track who made changes to sensitive information</li>
                <li><strong>Data Protection:</strong> Prevent data loss during centre transfers</li>
                <li><strong>Dispute Resolution:</strong> Provide evidence for resolving conflicts</li>
                <li><strong>System Integrity:</strong> Monitor system health and detect errors</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Who Can Access Audit Logs</h3>
              <p className="mb-4">Audit logs are restricted to authorized personnel only:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>System Administrators (SUPER_ADMIN)</li>
                <li>Centre Administrators (CENTER_ADMIN) - for their centre only</li>
                <li>Centre Supervisors (CENTER_SUPERVISOR) - for their centre only</li>
                <li>You can request your own audit history at any time</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Audit Log Retention</h3>
              <p className="mb-4">
                Audit logs are retained for a minimum of 7 years to comply with legal and regulatory requirements. After this period, logs may be archived or deleted in accordance with our data retention policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your enrollments and track your progress</li>
                <li>Communicate with you about courses, updates, and support</li>
                <li>Personalize your learning experience</li>
                <li>Process payments and manage billing</li>
                <li>Comply with legal obligations</li>
                <li>Detect and prevent fraud or security issues</li>
                <li>Generate anonymized analytics and reports</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Information Sharing and Disclosure</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Teachers and Instructors:</strong> To facilitate your learning experience</li>
                <li><strong>Your Learning Centre:</strong> Administrators can view student data within their centre</li>
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate the platform</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</li>
                <li><strong>Parents/Guardians:</strong> For students under 18, we share progress information</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-4">
                <p className="font-semibold text-yellow-900 mb-2">Multi-Tenancy Isolation</p>
                <p className="text-yellow-800">
                  Our platform uses a multi-tenant architecture where each learning centre's data is completely isolated. Centre A cannot access Centre B's data, ensuring privacy and security.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
              <p className="mb-4">We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption in transit (HTTPS/TLS)</li>
                <li>Encryption at rest for sensitive data</li>
                <li>Regular security audits and penetration testing</li>
                <li>Role-based access control (RBAC)</li>
                <li>Comprehensive audit logging of all actions</li>
                <li>Secure authentication with bcrypt password hashing</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
              <p className="mb-4">You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Audit History:</strong> Request your complete audit log history</li>
              </ul>

              <p className="mb-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:privacy@lms.gagneet.com" className="text-blue-600 hover:underline">
                  privacy@lms.gagneet.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p>
                We comply with COPPA and similar laws. For students under 13, we require parental consent before collecting personal information. Parents can review, modify, or delete their child's information at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international transfers in compliance with GDPR and other applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the platform after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p className="mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="mb-2">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@lms.gagneet.com" className="text-blue-600 hover:underline">
                    privacy@lms.gagneet.com
                  </a>
                </p>
                <p className="mb-2">
                  <strong>Website:</strong>{" "}
                  <a href="https://lms.gagneet.com" className="text-blue-600 hover:underline">
                    https://lms.gagneet.com
                  </a>
                </p>
                <p>
                  <strong>Data Protection Officer:</strong> Available upon request
                </p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t">
              <p className="text-gray-600 text-center">
                <Link href="/terms" className="text-blue-600 hover:underline">
                  View our Terms of Service
                </Link>
                {" | "}
                <Link href="/" className="text-blue-600 hover:underline">
                  Back to Home
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
