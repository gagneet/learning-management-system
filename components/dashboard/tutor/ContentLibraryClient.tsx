"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, BookOpen, ChevronRight, Star } from "lucide-react";

interface ContentLibraryClientProps {
  initialCourses: any[];
  gradeLevels: any[];
  allExercises: any[];
}

export default function ContentLibraryClient({
  initialCourses,
  gradeLevels,
  allExercises,
}: ContentLibraryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"courses" | "exercises">("courses");

  const filteredExercises = allExercises.filter((exercise) => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === "all" || exercise.lesson.module.course.id === selectedSubject;
    // Assuming level is tied to units or modules, for now just filtering by course/subject is more accurate
    return matchesSearch && matchesSubject;
  });

  const filteredCourses = initialCourses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Library</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Browse and assign teaching materials</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("courses")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === "courses"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setViewMode("exercises")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === "exercises"
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
            }`}
          >
            All Exercises
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 h-5 w-5" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subjects</option>
            {initialCourses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            {gradeLevels.map((l) => (
              <option key={l.id} value={l.level}>Class {l.level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {viewMode === "courses" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex flex-col justify-end">
                <h3 className="text-xl font-bold text-white leading-tight">{course.title}</h3>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Content Units</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{course.courseUnits?.length || 0}</span>
                  </div>
                  <div className="space-y-2">
                    {course.courseUnits?.slice(0, 3).map((unit: any) => (
                      <div key={unit.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="truncate">{unit.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-xs font-medium px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                    {course.status}
                  </span>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all"
                  >
                    View Details <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Exercise</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course / Unit</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredExercises.map((exercise) => (
                <tr key={exercise.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{exercise.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{exercise.lesson.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">{exercise.lesson.module.course.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Level {exercise.lesson.module.order}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded uppercase font-medium">
                      {exercise.exerciseType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-0.5 text-yellow-500">
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < (exercise.difficulty || 2) ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
                      Preview
                    </button>
                    <span className="mx-2 text-gray-300">|</span>
                    <button className="text-green-600 dark:text-green-400 font-semibold text-sm hover:underline">
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExercises.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No exercises found matching your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
