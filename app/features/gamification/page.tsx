import Image from "next/image";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Gamification System | AetherLearn",
  description: "Motivate learning with XP points, badges, achievements, and activity streaks",
};

export default function GamificationPage() {
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
            <div className="text-7xl mb-6">🎮</div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Gamification System
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Transform learning into an engaging, rewarding adventure
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Why Gamification?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Learning is more effective when students are motivated and engaged. Our comprehensive gamification system turns educational progress into a game-like experience with clear goals, immediate rewards, and visible achievements.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              By incorporating game mechanics like experience points, badges, and achievement systems, we tap into intrinsic motivation, making students excited to learn, compete with themselves, and celebrate their progress.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-yellow-400">
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300 mb-3">
                ⭐ Experience Points (XP)
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Earn XP for every learning action:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• Complete lessons: <span className="font-bold">50 XP</span></li>
                <li>• Finish modules: <span className="font-bold">100 XP</span></li>
                <li>• Complete courses: <span className="font-bold">500 XP</span></li>
                <li>• Excel in quizzes: <span className="font-bold">20-100 XP</span></li>
                <li>• Maintain streaks: <span className="font-bold">10 XP/day</span></li>
              </ul>
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Level Up!</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">XP translates to levels using a progressive formula. Each level requires more XP than the last, providing endless growth opportunities.</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border-2 border-blue-400">
              <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-3">
                🏆 Badge System
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Collect badges across 5 categories:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• <span className="font-bold text-blue-600">Completion:</span> Course/lesson milestones</li>
                <li>• <span className="font-bold text-green-600">Streak:</span> Consecutive learning days</li>
                <li>• <span className="font-bold text-purple-600">Mastery:</span> Subject expertise</li>
                <li>• <span className="font-bold text-orange-600">Participation:</span> Active engagement</li>
                <li>• <span className="font-bold text-pink-600">Special:</span> Unique accomplishments</li>
              </ul>
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Show Off!</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Badges appear on student profiles and leaderboards, providing public recognition for achievements.</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-6 border-2 border-green-400">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
                🎯 Achievement System
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Unlock achievements by reaching milestones:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• <strong>First Steps:</strong> Complete first lesson</li>
                <li>• <strong>Rising Star:</strong> Reach level 5</li>
                <li>• <strong>Dedicated Learner:</strong> 7-day streak</li>
                <li>• <strong>Subject Master:</strong> Complete course category</li>
                <li>• <strong>Quiz Champion:</strong> Score 100% on 10 quizzes</li>
              </ul>
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Progress Tracking</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">See how close you are to unlocking each achievement with progress bars and notifications.</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-red-400">
              <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-3">
                🔥 Activity Streaks
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Build consistency with daily learning streaks:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>• Current streak: How many consecutive days</li>
                <li>• Best streak: Personal record</li>
                <li>• Streak rewards: Bonus XP and badges</li>
                <li>• Streak recovery: One grace day per week</li>
              </ul>
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Daily Motivation</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Streaks encourage regular study habits, which research shows improves retention and understanding.</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-4">Leaderboards &amp; Competition:</h2>
            <p className="text-lg mb-4">
              Healthy competition drives engagement. Our leaderboard system creates motivation without excessive pressure:
            </p>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <span className="mr-3 text-2xl">🏅</span>
                <span>Centre-wide leaderboards showing top learners by XP and level</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">📊</span>
                <span>Course-specific rankings to see who&apos;s excelling in each subject</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">👥</span>
                <span>Friend challenges to compete with classmates privately</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">🎖️</span>
                <span>Monthly champions recognized with special badges</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Psychological Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-blue-600 mb-2">Intrinsic Motivation</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  XP and badges provide immediate feedback, triggering dopamine release and reinforcing learning behaviors.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-purple-600 mb-2">Clear Goals</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Visible progress bars and level indicators show students exactly what to work toward next.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-green-600 mb-2">Mastery Feeling</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Collecting badges and achievements creates a sense of mastery and competence in subjects.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-orange-600 mb-2">Social Recognition</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Leaderboards and public achievements satisfy the human need for recognition and status.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Customization Options
            </h2>
            <ul className="space-y-4 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>XP multipliers:</strong> Teachers can award bonus XP for exceptional work</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Custom badges:</strong> Create centre-specific badges for local competitions or events</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Achievement editor:</strong> Define custom milestones relevant to your curriculum</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Leaderboard privacy:</strong> Control whether students see full rankings or just their position</span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Start Your Learning Adventure
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
