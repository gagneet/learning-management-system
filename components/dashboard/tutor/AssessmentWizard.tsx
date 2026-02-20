"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, BookOpen, CheckCircle, ChevronRight, AlertCircle } from "lucide-react";

interface AssessmentWizardProps {
  students: any[];
  courses: any[];
}

export default function AssessmentWizard({ students, courses }: AssessmentWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    studentId: "",
    courseId: "",
    assessedGradeLevel: 1,
    readingAge: "",
    numeracyAge: "",
    comprehensionLevel: "",
    writingLevel: "",
    notes: ""
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStep(4); // Success step
      } else {
        alert("Failed to save assessment");
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-12 flex justify-between relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 -z-10"></div>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              step >= s ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-200 dark:border-gray-700"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {step === 1 && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <User className="text-blue-600 h-6 w-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select Student & Subject</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student</label>
                <select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select a student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject Course</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Select a course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                disabled={!formData.studentId || !formData.courseId}
                onClick={() => setStep(2)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
              >
                Next Step <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="text-blue-600 h-6 w-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assessment Metrics</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assessed Grade Level</label>
                <input
                  type="number"
                  value={formData.assessedGradeLevel}
                  onChange={(e) => setFormData({ ...formData, assessedGradeLevel: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reading Age (years)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.readingAge}
                  onChange={(e) => setFormData({ ...formData, readingAge: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Numeracy Age (years)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.numeracyAge}
                  onChange={(e) => setFormData({ ...formData, numeracyAge: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="text-gray-500 font-bold hover:underline">Back</button>
              <button
                onClick={() => setStep(3)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Final Review <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Review & Save</h2>

            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Student:</span>
                <span className="font-bold">{students.find(s => s.id === formData.studentId)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Course:</span>
                <span className="font-bold">{courses.find(c => c.id === formData.courseId)?.title}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                <span className="text-gray-500">Assessed Level:</span>
                <span className="font-bold text-blue-600">Grade {formData.assessedGradeLevel}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes & Observations</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                placeholder="Enter detailed assessment notes..."
              />
            </div>

            <div className="pt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="text-gray-500 font-bold hover:underline">Back</button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-10 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-100 dark:shadow-none"
              >
                {isSubmitting ? "Saving..." : "Submit Assessment"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Assessment Recorded!</h2>
            <p className="text-gray-500">The student&apos;s academic profile has been updated and a log entry has been created.</p>
            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => { setFormData({ ...formData, notes: "", readingAge: "", numeracyAge: "" }); setStep(1); }}
                className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-bold hover:bg-blue-50"
              >
                New Assessment
              </button>
              <button
                onClick={() => router.push("/dashboard/tutor/students")}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                Return to Students
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
