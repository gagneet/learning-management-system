"use client";

import { useState } from "react";
import { StudentAssessmentClient } from "@/app/dashboard/tutor/students/[studentId]/assessment/StudentAssessmentClient";
import { ChevronDown, ChevronUp, User } from "lucide-react";

type Placement = any;

type ChildData = {
  id: string;
  name: string;
  chronoAge: number | null;
  placements: Placement[];
};

interface Props {
  childrenData: ChildData[];
}

function ChildSection({ child }: { child: ChildData }) {
  const [expanded, setExpanded] = useState(true);

  const subjectCount = child.placements.length;
  const readyCount = child.placements.filter((p: any) => p.readyForPromotion).length;
  const totalLessons = child.placements.reduce((acc: number, p: any) => acc + p.lessonsCompleted, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Child header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {child.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{child.name}</h2>
            <div className="flex items-center gap-4 mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {child.chronoAge !== null && <span>Age {child.chronoAge}</span>}
              <span>{subjectCount} subject{subjectCount !== 1 ? "s" : ""}</span>
              <span>{totalLessons} lessons completed</span>
              {readyCount > 0 && (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  ★ {readyCount} ready to promote
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-gray-400 shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-6">
          <StudentAssessmentClient
            student={{ id: child.id, name: child.name, chronoAge: child.chronoAge }}
            placements={child.placements}
            assessmentAges={[]}
            canEdit={false}
          />
        </div>
      )}
    </div>
  );
}

export function ParentAssessmentClient({ childrenData }: Props) {
  const children = childrenData;
  if (children.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No children found on your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {children.map((child) => (
        <ChildSection key={child.id} child={child} />
      ))}
    </div>
  );
}
