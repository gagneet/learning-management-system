"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Star,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Placement = {
  id: string;
  subject: string;
  readyForPromotion: boolean;
  lessonsCompleted: number;
  status: string;
  currentAge: {
    id: string;
    ageYear: number;
    ageMonth: number;
    displayLabel: string;
    australianYear: string | null;
  };
};

type Question = {
  id: string;
  text: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
  bloomsLevel?: string;
};

type PromotionTest = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  totalMarks: number;
  passingScore: number;
  excellenceScore: number;
  timeLimit: number;
  isAutoGraded: boolean;
  questions: Question[];
  assessmentAgeId: string;
  assessmentAge: {
    displayLabel: string;
    australianYear: string | null;
    ageYear: number;
    ageMonth: number;
  };
};

interface Props {
  student: { id: string; name: string; chronoAge: number | null };
  placements: Placement[];
  promotionTests: PromotionTest[];
  selectedPlacementId?: string;
  tutorId: string;
}

// ── Outcome colour helpers ───────────────────────────────────────────────────

const OUTCOME_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  PROMOTED:     { bg: "bg-green-50 dark:bg-green-900/20",  text: "text-green-700 dark:text-green-300",  label: "Promoted",      icon: <Trophy  className="w-5 h-5" /> },
  LEVEL_SKIPPED:{ bg: "bg-blue-50 dark:bg-blue-900/20",    text: "text-blue-700 dark:text-blue-300",    label: "Level Skipped", icon: <Star    className="w-5 h-5" /> },
  FAILED:       { bg: "bg-red-50 dark:bg-red-900/20",      text: "text-red-700 dark:text-red-300",      label: "Not Ready",     icon: <XCircle className="w-5 h-5" /> },
  BORDERLINE:   { bg: "bg-yellow-50 dark:bg-yellow-900/20",text: "text-yellow-700 dark:text-yellow-300",label: "Borderline",    icon: <AlertCircle className="w-5 h-5" /> },
};

// ── Main Component ────────────────────────────────────────────────────────────

export function PromoteStudentClient({
  student,
  placements,
  promotionTests,
  selectedPlacementId,
  tutorId,
}: Props) {
  const router = useRouter();

  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(
    () => placements.find((p) => p.id === selectedPlacementId) ?? placements[0] ?? null
  );
  const [selectedTest, setSelectedTest] = useState<PromotionTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [overrideScore, setOverrideScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    outcome: string;
    percentageScore: number;
    promotedToAge?: { displayLabel: string; australianYear?: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  // Tests available for the selected placement
  const availableTests = promotionTests.filter(
    (t) => selectedPlacement && t.assessmentAgeId === selectedPlacement.currentAge.id
  );

  function handlePlacementChange(p: Placement) {
    setSelectedPlacement(p);
    setSelectedTest(null);
    setAnswers({});
    setOverrideScore("");
    setResult(null);
    setError(null);
  }

  function handleTestSelect(t: PromotionTest) {
    setSelectedTest(t);
    setAnswers({});
    setOverrideScore("");
    setResult(null);
    setError(null);
  }

  function updateAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!selectedTest || !selectedPlacement) return;
    setSubmitting(true);
    setError(null);

    // Build answers array
    const answersArray = selectedTest.questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));

    const body: Record<string, unknown> = {
      studentId:   student.id,
      placementId: selectedPlacement.id,
      answers:     answersArray,
      feedback:    feedback || undefined,
    };

    // If manual score override provided, include it
    if (overrideScore !== "" && !selectedTest.isAutoGraded) {
      const pct = parseFloat(overrideScore);
      if (!isNaN(pct)) {
        body.score           = (pct / 100) * selectedTest.totalMarks;
        body.percentageScore = pct;
      }
    }

    try {
      const res = await fetch(`/api/v1/promotion-tests/${selectedTest.id}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Submission failed (${res.status})`);
        return;
      }

      const data = await res.json();
      setResult({
        outcome:        data.data?.outcome ?? "PENDING",
        percentageScore: data.data?.percentageScore ?? 0,
        promotedToAge:  data.data?.promotedToAge,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const SUBJECT_COLOURS: Record<string, string> = {
    ENGLISH:     "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    MATHEMATICS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    SCIENCE:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    STEM:        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    READING:     "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    WRITING:     "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  };

  return (
    <div className="space-y-6">
      {/* Step 1 — Select Placement */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">1</span>
          Select Subject Placement
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {placements.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePlacementChange(p)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                selectedPlacement?.id === p.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SUBJECT_COLOURS[p.subject] ?? ""}`}>
                  {p.subject}
                </span>
                {p.readyForPromotion && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                    Ready ✓
                  </span>
                )}
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {p.currentAge.australianYear ?? `Age ${p.currentAge.ageYear}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Level {p.currentAge.displayLabel} · {p.lessonsCompleted} lessons done
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2 — Select Test */}
      {selectedPlacement && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">2</span>
            Select Promotion Test
          </h2>
          {availableTests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No promotion tests available for{" "}
              <strong>{selectedPlacement.subject}</strong> at level{" "}
              <strong>{selectedPlacement.currentAge.displayLabel}</strong>.
            </p>
          ) : (
            <div className="space-y-3">
              {availableTests.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTestSelect(t)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTest?.id === t.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{t.title}</p>
                      {t.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.totalMarks} marks</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pass: {t.passingScore}%</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span><BookOpen className="inline w-3 h-3 mr-1" />{t.questions.length} questions</span>
                    <span>⏱ {t.timeLimit} min</span>
                    {t.isAutoGraded && <span className="text-green-600 dark:text-green-400">Auto-graded</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 3 — Enter Results */}
      {selectedTest && !result && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">3</span>
            Enter Test Results
          </h2>

          {/* Toggle questions */}
          <button
            onClick={() => setShowQuestions((s) => !s)}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            {showQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showQuestions ? "Hide" : "Show"} questions ({selectedTest.questions.length})
          </button>

          {showQuestions && (
            <div className="space-y-4 mb-6">
              {selectedTest.questions.map((q, idx) => (
                <div key={q.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Q{idx + 1}. {q.text}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-4 shrink-0">
                      {q.marks} marks
                    </span>
                  </div>

                  {q.type === "MULTIPLE_CHOICE" && q.options ? (
                    <div className="space-y-1 mt-2">
                      {q.options.map((opt) => (
                        <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => updateAnswer(q.id, opt)}
                            className="accent-blue-600"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={answers[q.id] ?? ""}
                      onChange={(e) => updateAnswer(q.id, e.target.value)}
                      placeholder="Enter student's answer…"
                      rows={2}
                      className="w-full mt-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Manual score override (for non-auto-graded tests) */}
          {!selectedTest.isAutoGraded && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Overall Score (%) <span className="text-gray-400 font-normal">— enter if marking paper-based</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={overrideScore}
                onChange={(e) => setOverrideScore(e.target.value)}
                placeholder="e.g. 85.5"
                className="w-40 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pass threshold: {selectedTest.passingScore}% · Excellence: {selectedTest.excellenceScore}%
              </p>
            </div>
          )}

          {/* Feedback */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tutor Feedback <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add feedback for student and parent…"
              rows={3}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {submitting ? "Submitting…" : "Record Result"}
            </button>
            <button
              onClick={() => {
                setSelectedTest(null);
                setAnswers({});
                setError(null);
              }}
              className="px-6 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* Result Card */}
      {result && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(() => {
            const style = OUTCOME_STYLES[result.outcome] ?? OUTCOME_STYLES.FAILED;
            return (
              <div className={`${style.bg} p-8 text-center`}>
                <div className={`flex items-center justify-center gap-3 mb-3 ${style.text}`}>
                  {style.icon}
                  <span className="text-2xl font-bold">{style.label}</span>
                </div>
                <p className={`text-4xl font-bold mb-2 ${style.text}`}>
                  {result.percentageScore.toFixed(1)}%
                </p>
                {result.promotedToAge && (
                  <p className={`text-lg font-medium mt-3 ${style.text}`}>
                    Moved to: {result.promotedToAge.australianYear ?? result.promotedToAge.displayLabel}
                  </p>
                )}
                <div className="flex gap-3 justify-center mt-6">
                  <button
                    onClick={() => router.push(`/dashboard/tutor/students/${student.id}/assessment`)}
                    className="px-5 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    View Assessment
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setSelectedTest(null);
                      setAnswers({});
                      setFeedback("");
                      setOverrideScore("");
                    }}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    Record Another
                  </button>
                </div>
              </div>
            );
          })()}
        </section>
      )}
    </div>
  );
}
