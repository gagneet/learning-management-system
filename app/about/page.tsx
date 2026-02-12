import { Footer } from "@/components/Footer";
import { ClickableCard } from "@/components/ClickableCard";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">About Our Learning Management System</h1>
              <p className="text-xl opacity-90">
                Empowering educators and learners with a comprehensive, secure, and intuitive platform for modern education.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                We believe that quality education should be accessible, engaging, and effective for everyone. Our Learning Management System is designed to bridge the gap between traditional and modern learning, providing educators with powerful tools and students with engaging experiences.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Built on principles of security, accountability, and user-centric design, our platform serves multiple learning centres with complete data isolation and comprehensive audit trails to ensure compliance and trust.
              </p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">What Makes Us Different</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <ClickableCard
                title="🔒 Security First"
                description="Every action is logged in our comprehensive audit trail. Multi-tenant architecture ensures complete data isolation between learning centres."
                href="/privacy"
              />
              <ClickableCard
                title="👥 Role-Based Access"
                description="7 distinct user roles with granular permissions ensure the right people have the right access at the right time."
                href="/features"
              />
              <ClickableCard
                title="📊 Complete Transparency"
                description="Full audit history available to administrators and users. Track all changes, transfers, and actions for compliance and peace of mind."
                href="/features"
              />
              <ClickableCard
                title="🎓 Academic Excellence"
                description="Track student progress, attendance, and academic profiles. Automated catch-up packages for absent students ensure no one falls behind."
                href="/features"
              />
              <ClickableCard
                title="💰 Financial Management"
                description="Comprehensive invoicing, payment tracking, and refund approval workflows with full audit trails for financial accountability."
                href="/features"
              />
              <ClickableCard
                title="🎮 Gamification"
                description="XP points, badges, achievements, and streaks keep students engaged and motivated throughout their learning journey."
                href="/features"
              />
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Built on Modern Technology</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Frontend</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ Next.js 16 (App Router)</li>
                    <li>✓ React 19</li>
                    <li>✓ TypeScript</li>
                    <li>✓ Tailwind CSS</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Backend</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ Next.js API Routes</li>
                    <li>✓ Prisma ORM</li>
                    <li>✓ PostgreSQL Database</li>
                    <li>✓ NextAuth v5</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Security</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ Role-Based Access Control (RBAC)</li>
                    <li>✓ Multi-Tenancy Isolation</li>
                    <li>✓ Comprehensive Audit Logging</li>
                    <li>✓ bcrypt Password Hashing</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Deployment</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ PM2 Process Management</li>
                    <li>✓ Nginx Reverse Proxy</li>
                    <li>✓ CloudFlare CDN & SSL</li>
                    <li>✓ Automated Backups</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Roles */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Designed for Everyone</h2>
              <p className="text-center text-gray-600 mb-12">
                Our platform supports seven distinct user roles, each tailored to specific needs
              </p>
              <div className="space-y-4">
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">👑</div>
                    <div>
                      <h3 className="font-semibold text-lg">Super Admin</h3>
                      <p className="text-gray-600 text-sm">Full system access across all learning centres</p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">🏢</div>
                    <div>
                      <h3 className="font-semibold text-lg">Centre Admin</h3>
                      <p className="text-gray-600 text-sm">Administrative control within their learning centre</p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">👔</div>
                    <div>
                      <h3 className="font-semibold text-lg">Centre Supervisor</h3>
                      <p className="text-gray-600 text-sm">Supervisory access and reporting capabilities</p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">💰</div>
                    <div>
                      <h3 className="font-semibold text-lg">Finance Admin</h3>
                      <p className="text-gray-600 text-sm">Financial management, invoicing, and payment oversight</p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">👨‍🏫</div>
                    <div>
                      <h3 className="font-semibold text-lg">Teacher</h3>
                      <p className="text-gray-600 text-sm">Create courses, manage classes, track student progress</p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">👪</div>
                    <div>
                      <h3 className="font-semibold text-lg">Parent</h3>
                      <p className="text-gray-600 text-sm">Monitor children's progress and academic information</p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">🎓</div>
                    <div>
                      <h3 className="font-semibold text-lg">Student</h3>
                      <p className="text-gray-600 text-sm">Enroll in courses, complete lessons, earn achievements</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Compliance & Security</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                We take data protection seriously. Our platform is designed to comply with major educational and data privacy regulations:
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">GDPR</h3>
                  <p className="text-sm text-gray-600">European data protection and privacy regulation compliance</p>
                </div>
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">FERPA</h3>
                  <p className="text-sm text-gray-600">Student educational records privacy protection</p>
                </div>
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-2">COPPA</h3>
                  <p className="text-sm text-gray-600">Children's online privacy protection</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of educators and learners already using our platform
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
