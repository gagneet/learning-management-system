import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the Learning Management System ("LMS", "Platform", "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and LMS. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. User Accounts and Roles</h2>
              <h3 className="text-xl font-semibold mb-3">Account Creation</h3>
              <p className="mb-4">To use our Service, you must create an account with accurate and complete information. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Maintaining the confidentiality of your login credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
                <li>Ensuring your contact information is current</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">User Roles</h3>
              <p className="mb-4">The Platform supports seven distinct user roles, each with specific permissions:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>SUPER_ADMIN:</strong> Full system access across all learning centres</li>
                <li><strong>CENTER_ADMIN:</strong> Administrative control within their learning centre</li>
                <li><strong>CENTER_SUPERVISOR:</strong> Supervisory access within their learning centre</li>
                <li><strong>FINANCE_ADMIN:</strong> Financial management and billing oversight</li>
                <li><strong>TEACHER:</strong> Course creation and student management</li>
                <li><strong>PARENT:</strong> View children's progress and academic information</li>
                <li><strong>STUDENT:</strong> Course enrollment and learning activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Audit Trail and Accountability</h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-4">
                <p className="font-semibold text-blue-900 mb-2">🔒 Important: All Actions Are Monitored</p>
                <p className="text-blue-800">
                  By using this Platform, you acknowledge and agree that all your actions are logged in our comprehensive audit trail system for security, compliance, and accountability purposes.
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3">What This Means for You</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Every action you perform (create, update, delete, view) is recorded with your user ID, timestamp, and IP address</li>
                <li>Changes to sensitive information (grades, financial records, user data) are tracked with before/after states</li>
                <li>Centre transfers for students and tutors are fully audited to prevent data loss or corruption</li>
                <li>Administrators can view audit logs for their centre to ensure compliance and investigate issues</li>
                <li>You can request your own audit history at any time</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Purpose of Audit Trail</h3>
              <p className="mb-4">The audit trail serves to:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Protect the integrity and security of user data</li>
                <li>Ensure accountability for all actions performed on the Platform</li>
                <li>Comply with educational regulations (FERPA, GDPR, etc.)</li>
                <li>Investigate and resolve disputes or issues</li>
                <li>Prevent unauthorized access and data breaches</li>
                <li>Maintain a complete history of data changes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Centre Transfers and Data Integrity</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-4">
                <p className="font-semibold text-yellow-900 mb-2">⚠️ Important Notice</p>
                <p className="text-yellow-800">
                  Tutors, students, and other users may change learning centres during their use of the Platform. All such transfers are fully audited and tracked.
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3">Data Protection During Transfers</h3>
              <p className="mb-4">When a user transfers between centres:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>All historical data is preserved and remains accessible</li>
                <li>A complete audit log records the transfer, including who authorized it and when</li>
                <li>Academic records, progress, and achievements are maintained</li>
                <li>Financial records and billing history are preserved</li>
                <li>Previous centre administrators lose access to the user's current data</li>
                <li>New centre administrators gain access according to role permissions</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Your Responsibilities</h3>
              <p className="mb-4">When transferring centres, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Notify your current centre in advance when possible</li>
                <li>Complete any outstanding obligations before transferring</li>
                <li>Update your profile information with the new centre</li>
                <li>Understand that access permissions may change based on the new centre's policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use Policy</h2>
              <p className="mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload viruses, malware, or malicious code</li>
                <li>Harvest or collect information about other users</li>
                <li>Share your account credentials with others</li>
                <li>Impersonate another person or entity</li>
                <li>Post inappropriate, offensive, or harmful content</li>
                <li>Attempt to circumvent security measures or audit logging</li>
                <li>Access data from another learning centre without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <h3 className="text-xl font-semibold mb-3">Our Content</h3>
              <p className="mb-4">
                The Platform, including its design, features, and functionality, is owned by LMS and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.
              </p>

              <h3 className="text-xl font-semibold mb-3">Your Content</h3>
              <p className="mb-4">
                You retain ownership of content you create or upload to the Platform (courses, assignments, posts, etc.). By uploading content, you grant us a license to use, store, and display that content as necessary to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Payment Terms</h2>
              <p className="mb-4">If you purchase services through the Platform:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>All fees are stated in USD unless otherwise specified</li>
                <li>Payment is due as specified in your fee plan or invoice</li>
                <li>Late payments may incur additional charges</li>
                <li>Refunds are handled according to our refund policy</li>
                <li>Refund requests require approval from authorized administrators</li>
                <li>All financial transactions are logged in the audit trail</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
              <p className="mb-4">
                Your privacy is important to us. Our{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                {" "}explains how we collect, use, and protect your personal information, including details about our comprehensive audit trail system.
              </p>
              <p>
                Key points:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All actions are logged for security and compliance</li>
                <li>Multi-tenant architecture ensures data isolation between centres</li>
                <li>Audit logs are retained for 7 years minimum</li>
                <li>You can request your audit history at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Service Availability</h2>
              <p className="mb-4">
                We strive to provide reliable service, but we do not guarantee uninterrupted access. The Service may be unavailable due to maintenance, updates, or circumstances beyond our control.
              </p>
              <p>
                We are not liable for any loss or damage resulting from Service downtime.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
              <h3 className="text-xl font-semibold mb-3">By You</h3>
              <p className="mb-4">
                You may terminate your account at any time by contacting us. Upon termination, your access to the Service will cease, but audit logs will be retained according to our retention policy.
              </p>

              <h3 className="text-xl font-semibold mb-3">By Us</h3>
              <p className="mb-4">
                We may suspend or terminate your account if you violate these Terms or engage in fraudulent activity. Termination will be logged in the audit trail.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Disclaimers and Limitations of Liability</h2>
              <div className="bg-gray-100 p-6 rounded-lg mb-4">
                <p className="font-semibold mb-2">DISCLAIMER</p>
                <p>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
                </p>
              </div>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless LMS, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of the jurisdiction in which LMS operates, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Material changes will be communicated through the Platform or via email. Your continued use of the Service after changes indicates acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
              <p className="mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="mb-2">
                  <strong>Email:</strong>{" "}
                  <a href="mailto:legal@lms.gagneet.com" className="text-blue-600 hover:underline">
                    legal@lms.gagneet.com
                  </a>
                </p>
                <p className="mb-2">
                  <strong>Support:</strong>{" "}
                  <a href="mailto:support@lms.gagneet.com" className="text-blue-600 hover:underline">
                    support@lms.gagneet.com
                  </a>
                </p>
                <p>
                  <strong>Website:</strong>{" "}
                  <a href="https://lms.gagneet.com" className="text-blue-600 hover:underline">
                    https://lms.gagneet.com
                  </a>
                </p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t">
              <p className="text-gray-600 text-center">
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  View our Privacy Policy
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
