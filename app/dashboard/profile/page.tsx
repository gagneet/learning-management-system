import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user: sessionUser } = session;

  // Fetch full user details with relations
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: {
      center: { select: { name: true, slug: true } },
      academicProfile: true,
      gamificationProfile: true,
      parent: { select: { id: true, name: true, email: true } },
      children: { select: { id: true, name: true, email: true, role: true } },
      taughtCourses: { select: { id: true, title: true, status: true }, take: 10 },
      enrollments: {
        include: {
          course: { select: { id: true, title: true, slug: true } },
        },
        take: 5,
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate age
  const calculateAge = (dob: Date | null | undefined) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(user.dateOfBirth);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        }}
        breadcrumbs={[{ label: "My Profile" }]}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                )}
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">{user.email}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {user.role.replace(/_/g, " ")}
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium">
                  {user.center.name}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <Link
              href="/dashboard/settings"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Edit Profile
            </Link>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                About
              </h3>
              <p className="text-gray-900 dark:text-white">{user.bio}</p>
            </div>
          )}
        </div>

        {/* Information Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Personal Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Date of Birth
                </label>
                <p className="text-lg text-gray-900 dark:text-white mt-1">
                  {formatDate(user.dateOfBirth)}
                  {age && <span className="text-gray-500 dark:text-gray-400 ml-2">({age} years old)</span>}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Language
                </label>
                <p className="text-lg text-gray-900 dark:text-white mt-1">
                  {user.languagePreference.toUpperCase()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Theme
                </label>
                <p className="text-lg text-gray-900 dark:text-white mt-1">
                  {user.themePreference === "LIGHT" ? "☀️ Light" :
                   user.themePreference === "GRAY" ? "🌥️ Gray" : "🌙 Dark"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Member Since
                </label>
                <p className="text-lg text-gray-900 dark:text-white mt-1">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Role-specific Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {user.role === "STUDENT" ? "Academic Profile" : "Professional Information"}
            </h2>

            {/* For Students */}
            {user.role === "STUDENT" && user.academicProfile && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Reading Age
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white mt-1">
                    {user.academicProfile.readingAge ? `${user.academicProfile.readingAge} years` : "Not assessed"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Numeracy Age
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white mt-1">
                    {user.academicProfile.numeracyAge ? `${user.academicProfile.numeracyAge} years` : "Not assessed"}
                  </p>
                </div>
              </div>
            )}

            {/* For Teachers */}
            {user.role === "TEACHER" && (
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                  Courses ({user.taughtCourses.length})
                </label>
                {user.taughtCourses.length > 0 ? (
                  <div className="space-y-2">
                    {user.taughtCourses.map((course) => (
                      <div key={course.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-900 dark:text-white">{course.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No courses yet</p>
                )}
              </div>
            )}

            {/* For Parents */}
            {user.role === "PARENT" && (
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                  Children ({user.children.length})
                </label>
                {user.children.length > 0 ? (
                  <div className="space-y-2">
                    {user.children.map((child) => (
                      <div key={child.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-gray-900 dark:text-white font-medium">{child.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{child.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No children linked</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Gamification Stats (students only) */}
        {user.role === "STUDENT" && user.gamificationProfile && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-8 mb-8 text-white">
            <h2 className="text-2xl font-bold mb-6">🎮 Gamification Stats</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">{user.gamificationProfile.level}</div>
                <div className="text-sm opacity-90">Level</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">{user.gamificationProfile.xp}</div>
                <div className="text-sm opacity-90">XP Points</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">{user.gamificationProfile.streak}</div>
                <div className="text-sm opacity-90">Day Streak</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold mb-1">{user.gamificationProfile.nextLevelXP || 100}</div>
                <div className="text-sm opacity-90">Next Level XP</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
