'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickFill = (role: 'admin' | 'teacher' | 'student' | 'parent' | 'supervisor') => {
    const credentials: Record<string, {email: string, password: string}> = {
      admin: { email: 'admin@lms.com', password: 'admin123' },
      teacher: { email: 'teacher@lms.com', password: 'teacher123' },
      student: { email: 'student@lms.com', password: 'student123' },
      parent: { email: 'parent1@lms.com', password: 'admin123' },
      supervisor: { email: 'supervisor@lms.com', password: 'admin123' },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-purple-900 dark:to-gray-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        {/* Back to Home Link */}
        <Link href="/" className="flex items-center justify-center text-white hover:text-yellow-300 mb-6 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Fun Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-bounce">🚀</div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome Back!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ready to embark on your learning adventure?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                ✉️ Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                🔒 Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-purple-300 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "🎓 Sign In & Start Learning"
              )}
            </button>
          </form>

          {/* Quick Access Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              🎮 Try Demo Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickFill('student')}
                className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs font-medium"
              >
                🎓 Student
              </button>
              <button
                onClick={() => quickFill('teacher')}
                className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-xs font-medium"
              >
                👨‍🏫 Teacher
              </button>
              <button
                onClick={() => quickFill('parent')}
                className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-xs font-medium"
              >
                👪 Parent
              </button>
              <button
                onClick={() => quickFill('supervisor')}
                className="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-xs font-medium"
              >
                👔 Supervisor
              </button>
              <button
                onClick={() => quickFill('admin')}
                className="col-span-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-medium"
              >
                🔑 Admin
              </button>
            </div>
          </div>
        </div>

        {/* Fun Footer Message */}
        <p className="text-center text-white mt-6 text-sm drop-shadow-lg">
          ✨ Every great learning journey begins with a single login ✨
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
