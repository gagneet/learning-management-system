import Image from "next/image";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Academic Intelligence | AetherLearn",
  description: "Adaptive learning powered by academic profiling and intelligent content delivery",
};

export default function AcademicIntelligencePage() {
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
            <div className="text-7xl mb-6">🧠</div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Academic Intelligence
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Personalized learning paths powered by comprehensive academic profiling
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              What is Academic Intelligence?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Our Academic Intelligence system goes beyond simple progress tracking. It creates detailed academic profiles for each student, measuring not just what they've completed, but how they learn, where they excel, and where they need support.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              By tracking multiple dimensions of academic performance—reading age, numeracy age, comprehension, and writing proficiency—we enable truly personalized learning experiences that adapt to each student's unique needs and pace.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3">
                📊 Academic Profiling
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Track comprehensive metrics for each student:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• <strong>Chronological Age:</strong> Actual age for context</li>
                <li>• <strong>Reading Age:</strong> Reading comprehension level</li>
                <li>• <strong>Numeracy Age:</strong> Mathematical ability level</li>
                <li>• <strong>Comprehension Index:</strong> Understanding depth (0-100)</li>
                <li>• <strong>Writing Proficiency:</strong> Written expression skill (0-100)</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-3">
                🎯 Adaptive Content Delivery
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                The system automatically adjusts content difficulty and pacing based on academic profiles. Students receive materials that challenge them appropriately without overwhelming or boring them.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
                📈 Progress Intelligence
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Real-time tracking of lesson completion, assessment scores, and engagement metrics. Identify learning patterns, strengths, and areas needing intervention before students fall behind.
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300 mb-3">
                🔍 Intervention Alerts
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Automatic alerts when students struggle with specific concepts, miss milestones, or show declining engagement. Teachers can intervene early with targeted support.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-4">Personalized Learning Paths:</h2>
            <p className="text-lg mb-4">
              Imagine a Class 3 student who reads at Class 5 level but struggles with Class 2 math. Traditional systems force them into one grade level. AetherLearn doesn't.
            </p>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Students learn at their actual ability level in each subject</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Advanced students aren't held back by their age group</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Struggling students get appropriate support without stigma</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">✓</span>
                <span>Learning paths evolve as students grow and improve</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Real-World Impact
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">For Teachers:</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  See exactly where each student stands across all competencies. Spend less time on assessment, more time on teaching. Receive actionable insights for intervention.
                </p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">For Parents:</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Understand your child's true academic position beyond report cards. See growth over time with clear metrics. Know when your child needs extra support.
                </p>
              </div>
              <div className="border-l-4 border-green-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">For Students:</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Learn at your own pace without pressure or boredom. Build confidence with appropriately challenging content. Experience measurable progress that motivates continued effort.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Technical Foundation
            </h2>
            <ul className="space-y-4 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Academic Profile API:</strong> RESTful endpoints for creating, updating, and querying student profiles</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Progress tracking:</strong> Per-lesson completion status with timestamps and performance metrics</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Historical data:</strong> Complete learning history for trend analysis and growth tracking</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Analytics dashboard:</strong> Visual representation of academic profiles with actionable insights</span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Unlock Personalized Learning
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
