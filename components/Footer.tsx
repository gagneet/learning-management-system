import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & About Section */}
          <div>
            <div className="mb-4">
              <Image
                src="/aether-learn.png"
                alt="Aether Learn"
                width={150}
                height={50}
                className="h-12 w-auto mb-4"
              />
            </div>
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/features"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/docs"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  Help & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/gdpr"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  GDPR Compliance
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors text-gray-300"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="text-center text-gray-400">
            <p className="mb-2">
              &copy; {currentYear} Aether Learn. All rights reserved.
            </p>
            <p className="text-sm">
              🔒 All actions are logged for security and compliance.{" "}
              <Link href="/privacy" className="text-blue-400 hover:underline">
                Learn more about our audit trail and data protection
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
