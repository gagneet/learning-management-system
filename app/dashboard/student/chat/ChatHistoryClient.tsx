"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { TutorNote, User, Course, ChatMessage } from "@prisma/client";

type TutorNoteWithRelations = TutorNote & {
  tutor: Pick<User, "name" | "email">;
  course: Pick<Course, "title"> | null;
};

type ChatMessageWithRelations = ChatMessage & {
  sender: Pick<User, "name" | "role">;
  recipient: Pick<User, "name" | "role"> | null;
};

interface ChatHistoryClientProps {
  tutorNotes: TutorNoteWithRelations[];
  chatMessages: ChatMessageWithRelations[];
  studentId: string;
}

type MessageSource = "TUTOR_NOTES" | "CHAT";

export function ChatHistoryClient({
  tutorNotes,
  chatMessages,
  studentId,
}: ChatHistoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [tutorFilter, setTutorFilter] = useState<string>("ALL");
  const [courseFilter, setCourseFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<MessageSource | "ALL">("ALL");

  // Get unique tutors and courses for filters
  const tutors = useMemo(() => {
    const tutorSet = new Set<string>();
    tutorNotes.forEach((note) => tutorSet.add(note.tutor.name));
    return Array.from(tutorSet);
  }, [tutorNotes]);

  const courses = useMemo(() => {
    const courseSet = new Set<string>();
    tutorNotes.forEach((note) => {
      if (note.course) courseSet.add(note.course.title);
    });
    return Array.from(courseSet);
  }, [tutorNotes]);

  // Combine and transform messages
  const allMessages = useMemo(() => {
    const messages: Array<{
      id: string;
      type: "TUTOR_NOTE" | "CHAT";
      senderName: string;
      content: string;
      createdAt: Date;
      course?: string;
      isRead: boolean;
    }> = [];

    // Add tutor notes
    tutorNotes.forEach((note) => {
      messages.push({
        id: note.id,
        type: "TUTOR_NOTE",
        senderName: note.tutor.name,
        content: note.content,
        createdAt: note.createdAt,
        course: note.course?.title,
        isRead: true, // Tutor notes are always considered read
      });
    });

    // Add chat messages
    chatMessages.forEach((msg) => {
      messages.push({
        id: msg.id,
        type: "CHAT",
        senderName: msg.sender.name,
        content: msg.content,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
      });
    });

    return messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [tutorNotes, chatMessages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    return allMessages.filter((msg) => {
      // Search filter
      if (searchQuery && !msg.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Tutor filter
      if (tutorFilter !== "ALL" && msg.senderName !== tutorFilter) {
        return false;
      }

      // Course filter
      if (courseFilter !== "ALL" && msg.course !== courseFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== "ALL") {
        if (sourceFilter === "TUTOR_NOTES" && msg.type !== "TUTOR_NOTE") return false;
        if (sourceFilter === "CHAT" && msg.type !== "CHAT") return false;
      }

      return true;
    });
  }, [allMessages, searchQuery, tutorFilter, courseFilter, sourceFilter]);

  // Group messages by date
  const messagesByDate = useMemo(() => {
    const groups: Record<string, typeof filteredMessages> = {};

    filteredMessages.forEach((msg) => {
      const dateKey = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return groups;
  }, [filteredMessages]);

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
          Chat History
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View messages from your tutors and chat history
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-4xl">💬</div>
            <div>
              <h3 className="text-sm font-medium opacity-90">Total Messages</h3>
              <p className="text-3xl font-bold">{allMessages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-4xl">📝</div>
            <div>
              <h3 className="text-sm font-medium opacity-90">Tutor Notes</h3>
              <p className="text-3xl font-bold">{tutorNotes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-4xl">✉️</div>
            <div>
              <h3 className="text-sm font-medium opacity-90">Chat Messages</h3>
              <p className="text-3xl font-bold">{chatMessages.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Messages
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message Type
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as MessageSource | "ALL")}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Messages</option>
              <option value="TUTOR_NOTES">Tutor Notes</option>
              <option value="CHAT">Chat Messages</option>
            </select>
          </div>

          {/* Tutor Filter */}
          {tutors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Tutor
              </label>
              <select
                value={tutorFilter}
                onChange={(e) => setTutorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Tutors</option>
                {tutors.map((tutor) => (
                  <option key={tutor} value={tutor}>
                    {tutor}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Course Filter */}
          {courses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Course
              </label>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Courses</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Messages List */}
      {Object.keys(messagesByDate).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(messagesByDate).map(([date, messages]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {date}
                </span>
                <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">
                        {msg.type === "TUTOR_NOTE" ? "📝" : "💬"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {msg.senderName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                {msg.type === "TUTOR_NOTE" ? "Tutor Note" : "Chat"}
                              </span>
                              {msg.course && (
                                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                                  {msg.course}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No messages yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || tutorFilter !== "ALL" || courseFilter !== "ALL"
              ? "No messages match your filters. Try adjusting your search."
              : "Your tutors will send you messages and notes here."}
          </p>
        </div>
      )}
    </div>
  );
}
