import { Footer } from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "Live Sessions | AetherLearn",
  description: "Multi-student sessions where one tutor teaches different courses at different levels simultaneously",
};

export default function LiveSessionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              AetherLearn
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
            <div className="text-7xl mb-6">🎥</div>
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Live Sessions
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Revolutionary multi-student model: One tutor, multiple courses, different levels, same time slot
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border-4 border-red-500 rounded-2xl shadow-2xl p-8 mb-8">
            <div className="flex items-center mb-4">
              <span className="text-5xl mr-4">🚀</span>
              <h2 className="text-3xl font-bold text-red-900 dark:text-red-300">
                The Game-Changing Pivot
              </h2>
            </div>
            <p className="text-lg text-gray-800 dark:text-gray-200 mb-4 font-semibold">
              Traditional LMS: One class, one course, one level. Everyone learns the same thing at the same pace.
            </p>
            <p className="text-lg text-gray-800 dark:text-gray-200 mb-4 font-semibold">
              AetherLearn: One tutor can teach 5 students in the same time slot, each working on completely different courses at completely different levels.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Real-World Example:</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Tuesday 3:00 PM session with Teacher Sarah:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• <strong>Student A (Class 3):</strong> Working on English Reading at Class 1 level</li>
                <li>• <strong>Student B (Class 5):</strong> Doing Mathematics at Class 7 level</li>
                <li>• <strong>Student C (Class 7):</strong> Learning Python Programming (advanced)</li>
                <li>• <strong>Student D (Class 4):</strong> Studying Science at Class 4 level</li>
                <li>• <strong>Student E (Class 6):</strong> Working on English Writing at Class 3 level</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4 italic">
                Each student has personalized content aligned with their academic profile, not their age or grade!
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Why This Changes Everything
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">⚡ Maximize Teacher Efficiency</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  One teacher can simultaneously support students across multiple subjects and levels, dramatically improving scheduling flexibility and resource utilization. No more empty time slots or underutilized teachers.
                </p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">🎯 True Personalization</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Students aren't constrained by their classmates' abilities. Advanced students get challenging content, struggling students get appropriate support—all in the same session without anyone feeling singled out.
                </p>
              </div>
              <div className="border-l-4 border-green-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">📅 Scheduling Freedom</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Parents can book students into available time slots regardless of what course they're taking. No more "Math class is full" or "This time only has English." Every slot can accommodate any subject.
                </p>
              </div>
              <div className="border-l-4 border-orange-600 pl-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">💰 Revenue Optimization</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Fill every available time slot with students learning different things. Increase student capacity without hiring more teachers. Convert empty slots into billable hours.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3">
                💻 Video Sessions
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Virtual classroom with screen sharing, breakout rooms, and recording:
              </p>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• Microsoft Teams integration</li>
                <li>• Zoom support</li>
                <li>• Amazon Chime</li>
                <li>• Custom video platforms</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
                🏫 Physical Sessions
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                In-person tutoring at your centre with digital tracking:
              </p>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>• Physical classroom allocation</li>
                <li>• Attendance check-in/out</li>
                <li>• Session notes and feedback</li>
                <li>• Resource management</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-3">
                📊 Attendance Tracking
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Precise tracking of when each student joins and leaves sessions. Automatic attendance reports for parents, teachers, and administrators. Late arrivals and early departures logged automatically.
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300 mb-3">
                🎬 Recording &amp; Transcripts
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Session recordings available for review, with optional AI-generated transcripts. Students can revisit explanations, and parents can see what was covered in each session.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-4">Session Management Features:</h2>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <span className="mr-3 text-2xl">📅</span>
                <span>Schedule sessions with automatic conflict detection and availability checks</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">👥</span>
                <span>Group management: Define max students per session and balance workload</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">🔔</span>
                <span>Automatic reminders sent to students and teachers before sessions start</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">📝</span>
                <span>Post-session notes: Teachers document what each student worked on</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-2xl">🔄</span>
                <span>Recurring sessions: Set up weekly schedules and manage long-term commitments</span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Teacher Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Teachers see exactly what each student is working on before and during sessions:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">📋 Session Prep View</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  See upcoming students, their current courses, lessons in progress, and recent performance. Prepare materials for each student ahead of time.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                <h4 className="font-bold text-purple-900 dark:text-purple-300 mb-2">⏱️ Live Session View</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  During sessions, see which students are active, what lesson they're on, and flag students who need immediate help. Quick access to all student materials.
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                <h4 className="font-bold text-green-900 dark:text-green-300 mb-2">📈 Progress Updates</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mark lessons complete, add notes about student performance, and flag concepts that need review. Updates sync immediately to student and parent views.
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
                <h4 className="font-bold text-orange-900 dark:text-orange-300 mb-2">💬 Communication</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Send messages to parents about session outcomes, recommend additional practice, or schedule follow-up sessions—all within the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Technical Architecture
            </h2>
            <ul className="space-y-4 text-gray-600 dark:text-gray-300">
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Session model:</strong> Links tutor, time slot, and multiple student-course pairs in a single session record</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Attendance tracking:</strong> Individual join/leave timestamps for each student in multi-student sessions</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Integration ready:</strong> OAuth flows for Teams, Zoom, Chime with webhook support for real-time updates</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-3">•</span>
                <span><strong>Flexible status:</strong> SCHEDULED → LIVE → COMPLETED/CANCELLED with automatic state management</span>
              </li>
            </ul>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Experience Multi-Student Sessions
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
