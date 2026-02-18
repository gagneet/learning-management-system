"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";

type HelpRequest = {
  id: string;
  message: string | null;
  status: string;
  priority: string;
  responseText: string | null;
  createdAt: Date;
  session: { id: string; title: string } | null;
  exercise: { id: string; title: string } | null;
};

interface StudentHelpClientProps {
  studentId: string;
  helpRequests: HelpRequest[];
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ACKNOWLEDGED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export default function StudentHelpClient({ studentId, helpRequests }: StudentHelpClientProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState(helpRequests);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/v1/help-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), priority }),
      });

      if (res.ok) {
        const data = await res.json();
        setRequests([data.helpRequest, ...requests]);
        setMessage("");
        setPriority("MEDIUM");
        setSuccess("Your help request has been submitted. A tutor will respond shortly.");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to submit request. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openRequests = requests.filter((r) => r.status !== "RESOLVED");
  const resolvedRequests = requests.filter((r) => r.status === "RESOLVED");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {session?.user && (
        <Header
          user={{
            name: session.user.name ?? "Student",
            email: session.user.email ?? "",
            role: session.user.role ?? "STUDENT",
          }}
          title="Request Help"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard/student" },
            { label: "Request Help" },
          ]}
        />
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Request Help
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Need assistance? Submit a help request and your tutor will respond as soon as possible.
          </p>
        </div>

        {/* New Request Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            New Help Request
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe what you need help with
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="E.g. I&apos;m stuck on the quadratic equations exercise, specifically the step where..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low – When you get a chance</option>
                <option value="MEDIUM">Medium – I&apos;m working on it now</option>
                <option value="HIGH">High – Blocking my progress</option>
                <option value="URGENT">Urgent – In a session right now</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {submitting ? "Submitting..." : "Submit Help Request"}
            </button>
          </form>
        </div>

        {/* Open Requests */}
        {openRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Open Requests ({openRequests.length})
            </h2>
            <div className="space-y-4">
              {openRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-gray-900 dark:text-white flex-1">{req.message ?? ""}</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[req.priority] ?? ""}`}>
                        {req.priority}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[req.status] ?? ""}`}>
                        {req.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  {req.responseText && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Tutor Response:</p>
                      <p className="text-sm text-blue-900 dark:text-blue-200">{req.responseText}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(req.createdAt).toLocaleString()}
                    {req.session && ` · Session: ${req.session.title}`}
                    {req.exercise && ` · Exercise: ${req.exercise.title}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolved Requests */}
        {resolvedRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resolved ({resolvedRequests.length})
            </h2>
            <div className="space-y-3">
              {resolvedRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 opacity-75"
                >
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">{req.message ?? ""}</p>
                  {req.responseText && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Response: {req.responseText}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-4">🙋</div>
            <p className="text-lg font-medium mb-2">No help requests yet</p>
            <p className="text-sm">Use the form above to request assistance from your tutor.</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/student"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
