"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Type definitions based on Prisma schema
type Student = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  dateOfBirth: Date | null;
  ageTier: string;
  createdAt: Date;
};

type AcademicProfile = {
  id: string;
  userId: string;
  chronologicalAge: number | null;
  readingAge: number | null;
  numeracyAge: number | null;
  comprehensionIndex: number | null;
  writingProficiency: number | null;
  subjectLevels: any;
  createdAt: Date;
  updatedAt: Date;
} | null;

type Badge = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  earnedAt: Date;
};

type Achievement = {
  id: string;
  category: string;
  title: string;
  value: number | null;
  description: string | null;
  earnedAt: Date;
};

type GamificationProfile = {
  id: string;
  userId: string;
  xp: number;
  level: number;
  streak: number;
  badges: Badge[];
  achievements: Achievement[];
} | null;

type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  enrolledAt: Date;
  course: {
    id: string;
    title: string;
    slug: string;
    teacher: {
      name: string;
    };
  };
};

type StudentAssessment = {
  id: string;
  studentId: string;
  courseId: string;
  assessedGradeLevel: number;
  readingAge: number | null;
  numeracyAge: number | null;
  comprehensionLevel: number | null;
  writingLevel: number | null;
  lastAssessedAt: Date;
  assessedById: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  course: {
    title: string;
  };
};

type StudentGoal = {
  id: string;
  studentId: string;
  goalText: string;
  category: string | null;
  targetDate: Date | null;
  isAchieved: boolean;
  achievedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AwardRedemption = {
  id: string;
  studentId: string;
  awardId: string;
  xpSpent: number;
  status: string;
  redeemedAt: Date;
  fulfilledAt: Date | null;
  notes: string | null;
  award: {
    id: string;
    name: string;
    description: string | null;
    awardType: string;
    xpCost: number;
    stockQuantity: number | null;
    imageUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    centreId: string;
  };
};

type TutorNote = {
  id: string;
  studentId: string;
  courseId: string | null;
  tutorId: string;
  enrollmentId: string | null;
  content: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  tutor: {
    name: string;
  };
};

type StudentSessionEnrollment = {
  id: string;
  studentId: string;
  sessionId: string;
  courseId: string | null;
  lessonId: string | null;
  exerciseContent: any;
  assessmentData: any;
  completed: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  session: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date | null;
    status: string;
    sessionMode: string;
    tutor: {
      name: string;
    };
  };
  course: {
    title: string;
  } | null;
};

type HomeworkAssignment = {
  id: string;
  centreId: string;
  studentId: string;
  courseId: string;
  exerciseId: string;
  assignedById: string;
  sessionEnrollmentId: string | null;
  dueDate: Date;
  status: string;
  totalMaxScore: number;
  totalScore: number | null;
  startedAt: Date | null;
  submittedAt: Date | null;
  gradedAt: Date | null;
  gradedById: string | null;
  feedback: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  course: {
    title: string;
  };
  exercise: {
    title: string;
  };
  assignedBy: {
    name: string;
  };
};

type AttendanceRecord = {
  id: string;
  studentId: string;
  sessionId: string;
  status: string;
  markedAt: Date | null;
  markedById: string | null;
  notes: string | null;
  centreId: string;
  createdAt: Date;
  updatedAt: Date;
  session: {
    id: string;
    title: string;
    startTime: Date;
  };
  markedBy: {
    name: string;
  } | null;
};

type Stats = {
  totalSessions: number;
  attendanceRate: number;
  avgProgress: number;
  pendingHomework: number;
  completedHomework: number;
};

interface StudentProfileClientProps {
  student: Student;
  academicProfile: AcademicProfile;
  gamificationProfile: GamificationProfile;
  enrollments: Enrollment[];
  assessments: StudentAssessment[];
  goals: StudentGoal[];
  awards: AwardRedemption[];
  notes: TutorNote[];
  sessions: StudentSessionEnrollment[];
  homeworkAssignments: HomeworkAssignment[];
  attendance: AttendanceRecord[];
  stats: Stats;
}

type TabType = "overview" | "assessments" | "goals" | "strengths" | "awards" | "notes" | "activity";

export function StudentProfileClient({
  student,
  academicProfile,
  gamificationProfile,
  enrollments,
  assessments,
  goals,
  awards,
  notes,
  sessions,
  homeworkAssignments,
  attendance,
  stats,
}: StudentProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [noteContent, setNoteContent] = useState("");
  const [isVisibleToParent, setIsVisibleToParent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterParentVisible, setFilterParentVisible] = useState<boolean | null>(null);
  const [assessmentSubjectFilter, setAssessmentSubjectFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<"all" | "sessions" | "homework" | "attendance">("all");

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "📊" },
    { id: "assessments" as TabType, label: "Assessments", icon: "📝" },
    { id: "goals" as TabType, label: "Goals", icon: "🎯" },
    { id: "strengths" as TabType, label: "Strengths & Weaknesses", icon: "💪" },
    { id: "awards" as TabType, label: "Awards & XP", icon: "🏆" },
    { id: "notes" as TabType, label: "Notes", icon: "📋" },
    { id: "activity" as TabType, label: "Activity", icon: "📈" },
  ];

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/tutor-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          content: noteContent,
          isVisibleToParent,
        }),
      });

      if (response.ok) {
        setNoteContent("");
        setIsVisibleToParent(false);
        router.refresh();
      } else {
        alert("Failed to add note");
      }
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Error adding note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (dateOfBirth: Date | null): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date): string => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      ACHIEVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      ABANDONED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      NOT_STARTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      SUBMITTED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      GRADED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      FULFILLED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      PRESENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      ABSENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      LATE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      EXCUSED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      LIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  const filteredNotes = notes.filter((note) => {
    if (filterParentVisible === null) return true;
    const isExternal = note.visibility === "EXTERNAL";
    return isExternal === filterParentVisible;
  });

  const filteredAssessments = assessments;
  const uniqueSubjects: string[] = [];

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {student.avatar ? (
                <img src={student.avatar} alt={student.name} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                student.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{student.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{student.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Age: {calculateAge(student.dateOfBirth)} years
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Age Tier: {student.ageTier}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Joined: {formatDate(student.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            {gamificationProfile && (
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  Level {gamificationProfile.level}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {gamificationProfile.xp.toLocaleString()} XP
                </div>
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  🔥 {gamificationProfile.streak} day streak
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1 px-4" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-4 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-4">
                  <div className="text-sm text-blue-600 dark:text-blue-300 font-medium">Total Sessions</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.totalSessions}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-4">
                  <div className="text-sm text-green-600 dark:text-green-300 font-medium">Attendance Rate</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {stats.attendanceRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-4">
                  <div className="text-sm text-purple-600 dark:text-purple-300 font-medium">Avg Progress</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {stats.avgProgress.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg p-4">
                  <div className="text-sm text-orange-600 dark:text-orange-300 font-medium">Pending Homework</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                    {stats.pendingHomework}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800 rounded-lg p-4">
                  <div className="text-sm text-teal-600 dark:text-teal-300 font-medium">Completed Homework</div>
                  <div className="text-2xl font-bold text-teal-900 dark:text-teal-100 mt-1">
                    {stats.completedHomework}
                  </div>
                </div>
              </div>

              {/* Academic Profile */}
              {academicProfile && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Academic Profile</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Reading Age</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {academicProfile.readingAge || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Numeracy Age</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {academicProfile.numeracyAge || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Comprehension</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {academicProfile.comprehensionIndex || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Writing</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {academicProfile.writingProficiency || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Last Updated</div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {new Date(academicProfile.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Courses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Courses</h3>
                <div className="space-y-3">
                  {enrollments.slice(0, 5).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{enrollment.course.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Teacher: {enrollment.course.teacher.name}
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {enrollment.progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${enrollment.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Badges */}
              {gamificationProfile && gamificationProfile.badges.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Badges</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gamificationProfile.badges.slice(0, 8).map((badge) => (
                      <div
                        key={badge.id}
                        className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 rounded-lg p-4 text-center"
                      >
                        <div className="text-3xl mb-2">🏅</div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{badge.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{badge.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assessments Tab */}
          {activeTab === "assessments" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assessment History</h3>
                <select
                  value={assessmentSubjectFilter}
                  onChange={(e) => setAssessmentSubjectFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Subjects</option>
                  {uniqueSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Grade Level
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Reading Age
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Numeracy Age
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAssessments.map((assessment) => (
                      <tr key={assessment.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(assessment.lastAssessedAt)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {assessment.course.title}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          Grade {assessment.assessedGradeLevel}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {assessment.readingAge || "N/A"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {assessment.numeracyAge || "N/A"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {assessment.notes ? assessment.notes.substring(0, 50) + (assessment.notes.length > 50 ? "..." : "") : "No notes"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAssessments.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">No assessments found</div>
              )}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === "goals" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Student Goals</h3>

              {/* Active Goals */}
              <div>
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Active Goals</h4>
                <div className="space-y-3">
                  {goals
                    .filter((goal) => !goal.isAchieved)
                    .map((goal) => (
                      <div key={goal.id} className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{goal.goalText}</div>
                            {goal.category && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Category: {goal.category}</div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor("ACTIVE")}`}>
                            Active
                          </span>
                        </div>
                        {goal.targetDate && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Target: {formatDate(goal.targetDate)}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Achieved Goals */}
              <div>
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Achieved Goals</h4>
                <div className="space-y-3">
                  {goals
                    .filter((goal) => goal.isAchieved)
                    .map((goal) => (
                      <div key={goal.id} className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{goal.goalText}</div>
                            {goal.category && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Category: {goal.category}</div>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor("ACHIEVED")}`}>
                            Achieved
                          </span>
                        </div>
                        {goal.achievedAt && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Achieved: {formatDate(goal.achievedAt)}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {goals.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">No goals set</div>
              )}
            </div>
          )}

          {/* Strengths & Weaknesses Tab */}
          {activeTab === "strengths" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strengths & Weaknesses Analysis</h3>
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Assessment analysis will be updated in the next version
              </div>
            </div>
          )}

          {/* Awards & XP Tab */}
          {activeTab === "awards" && (
            <div className="space-y-6">
              {/* XP and Level */}
              {gamificationProfile && (
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-6 text-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm opacity-90">Level</div>
                      <div className="text-3xl font-bold">{gamificationProfile.level}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-90">Total XP</div>
                      <div className="text-3xl font-bold">{gamificationProfile.xp.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm opacity-90">Current Streak</div>
                      <div className="text-3xl font-bold">🔥 {gamificationProfile.streak} days</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Badges */}
              {gamificationProfile && gamificationProfile.badges.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Badges</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {gamificationProfile.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 rounded-lg p-4 text-center"
                      >
                        <div className="text-4xl mb-2">🏅</div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{badge.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{badge.type}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(badge.earnedAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {gamificationProfile && gamificationProfile.achievements.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Achievements</h4>
                  <div className="space-y-3">
                    {gamificationProfile.achievements.map((achievement) => (
                      <div key={achievement.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center">
                        <div className="text-3xl mr-4">🏆</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{achievement.title}</div>
                          {achievement.description && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {achievement.category} • {formatDate(achievement.earnedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Award Redemptions */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Award Redemptions</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Award
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          XP Cost
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fulfilled
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {awards.map((award) => (
                        <tr key={award.id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(award.redeemedAt)}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {award.award.name}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {award.award.awardType}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {award.xpSpent} XP
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(award.status)}`}>
                              {award.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(award.fulfilledAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {awards.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">No award redemptions yet</div>
                )}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "notes" && (
            <div className="space-y-6">
              {/* Add Note Form */}
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Note</h4>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter note content..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isVisibleToParent}
                      onChange={(e) => setIsVisibleToParent(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Visible to parent</span>
                  </label>
                  <button
                    onClick={handleAddNote}
                    disabled={isSubmitting || !noteContent.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Adding..." : "Add Note"}
                  </button>
                </div>
              </div>

              {/* Filter Notes */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterParentVisible(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterParentVisible === null
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  All Notes
                </button>
                <button
                  onClick={() => setFilterParentVisible(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterParentVisible === true
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Parent Visible
                </button>
                <button
                  onClick={() => setFilterParentVisible(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterParentVisible === false
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Private
                </button>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`rounded-lg p-4 ${
                      note.visibility === "EXTERNAL"
                        ? "bg-green-50 dark:bg-green-900 border-l-4 border-green-500"
                        : "bg-gray-50 dark:bg-gray-900 border-l-4 border-gray-500"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {note.tutor.name}
                        {note.visibility === "EXTERNAL" && (
                          <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                            Visible to Parent
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(note.createdAt)}</div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>

              {filteredNotes.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">No notes found</div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-6">
              {/* Activity Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActivityFilter("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activityFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  All Activity
                </button>
                <button
                  onClick={() => setActivityFilter("sessions")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activityFilter === "sessions"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setActivityFilter("homework")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activityFilter === "homework"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Homework
                </button>
                <button
                  onClick={() => setActivityFilter("attendance")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activityFilter === "attendance"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  Attendance
                </button>
              </div>

              {/* Sessions */}
              {(activityFilter === "all" || activityFilter === "sessions") && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Session History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Session
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Tutor
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Mode
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sessions.slice(0, 15).map((enrollment) => (
                          <tr key={enrollment.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatDateTime(enrollment.session.startTime)}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              {enrollment.session.title}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                              {enrollment.course?.title || "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {enrollment.session.tutor.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {enrollment.session.sessionMode}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                                  enrollment.session.status
                                )}`}
                              >
                                {enrollment.session.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Homework */}
              {(activityFilter === "all" || activityFilter === "homework") && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Homework History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Course
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Graded By
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {homeworkAssignments.slice(0, 20).map((homework) => (
                          <tr key={homework.id}>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              {homework.exercise.title}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                              {homework.course.title}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatDate(homework.dueDate)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(homework.status)}`}
                              >
                                {homework.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {homework.totalScore !== null && homework.totalMaxScore
                                ? `${homework.totalScore}/${homework.totalMaxScore}`
                                : "N/A"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {homework.assignedBy.name}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Attendance */}
              {(activityFilter === "all" || activityFilter === "attendance") && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Attendance Records</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Session
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Marked By
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {attendance.slice(0, 20).map((record) => (
                          <tr key={record.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {formatDate(record.session.startTime)}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                              {record.session.title}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(record.status)}`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {record.markedBy?.name || "N/A"}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{record.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {sessions.length === 0 && homeworkAssignments.length === 0 && attendance.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">No activity records found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
