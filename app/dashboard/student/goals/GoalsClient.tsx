"use client";

import { useState } from "react";
import Link from "next/link";
import type { StudentGoal } from "@prisma/client";

interface GoalsClientProps {
  goals: StudentGoal[];
  studentId: string;
}

export function GoalsClient({ goals, studentId }: GoalsClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    goalText: "",
    category: "ACADEMIC",
    targetDate: "",
  });

  const activeGoals = goals.filter((g) => !g.isAchieved);
  const achievedGoals = goals.filter((g) => g.isAchieved);

  // Calculate progress for goals with target dates
  const getGoalProgress = (goal: StudentGoal) => {
    if (!goal.targetDate) return null;

    const now = new Date().getTime();
    const created = new Date(goal.createdAt).getTime();
    const target = new Date(goal.targetDate).getTime();

    if (target <= created) return 100;

    const elapsed = now - created;
    const total = target - created;
    const progress = Math.min(Math.round((elapsed / total) * 100), 100);

    return progress;
  };

  // Get motivational message based on progress
  const getMotivationalMessage = () => {
    const totalGoals = goals.length;
    const achievedCount = achievedGoals.length;

    if (totalGoals === 0) {
      return "Set your first goal to start your journey!";
    }

    const achievementRate = (achievedCount / totalGoals) * 100;

    if (achievementRate >= 80) {
      return "Amazing work! You're crushing your goals! 🌟";
    } else if (achievementRate >= 50) {
      return "Keep going! You're making great progress! 💪";
    } else if (achievementRate >= 25) {
      return "You're on the right track! Stay focused! 🎯";
    } else {
      return "Every step forward counts! Keep pushing! 🚀";
    }
  };

  // Get days until target
  const getDaysUntilTarget = (targetDate: Date) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", color: "text-red-600 dark:text-red-400" };
    if (diffDays === 0) return { text: "Due today", color: "text-orange-600 dark:text-orange-400" };
    if (diffDays <= 7) return { text: `${diffDays} days left`, color: "text-yellow-600 dark:text-yellow-400" };
    return { text: `${diffDays} days left`, color: "text-gray-600 dark:text-gray-400" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implement API call to create goal
    console.log("Creating goal:", formData);

    // Reset form
    setFormData({ goalText: "", category: "ACADEMIC", targetDate: "" });
    setShowForm(false);
  };

  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/student"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          My Goals
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Set goals, track progress, and achieve your dreams
        </p>
      </div>

      {/* Motivational Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{getMotivationalMessage()}</h3>
            <p className="text-purple-100">
              {achievedGoals.length} of {goals.length} goals achieved
            </p>
          </div>
          <div className="text-6xl">🎯</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📋</div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Goals</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">⏳</div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Goals</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{activeGoals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">✅</div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Achieved</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{achievedGoals.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Set New Goal Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Set New Goal
        </button>
      </div>

      {/* New Goal Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Goal</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal Description
              </label>
              <textarea
                value={formData.goalText}
                onChange={(e) => setFormData({ ...formData, goalText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe your goal..."
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="SKILL">Skill</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Create Goal
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Active Goals</h2>
          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const progress = getGoalProgress(goal);
              const dueInfo = goal.targetDate ? getDaysUntilTarget(goal.targetDate) : null;

              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {goal.category && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                            {goal.category}
                          </span>
                        )}
                        {dueInfo && (
                          <span className={`font-medium text-sm ${dueInfo.color}`}>
                            {dueInfo.text}
                          </span>
                        )}
                      </div>
                      <p className="text-lg text-gray-900 dark:text-white">{goal.goalText}</p>
                      {goal.targetDate && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-4xl">🎯</div>
                  </div>

                  {progress !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Time Progress
                        </span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achieved Goals */}
      {achievedGoals.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Achieved Goals</h2>
          <div className="space-y-4">
            {achievedGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                        {goal.category || "Goal"}
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Achieved {goal.achievedAt ? new Date(goal.achievedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-lg text-gray-900 dark:text-white">{goal.goalText}</p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No goals set yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Set your first goal to start tracking your progress!
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Set Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}
