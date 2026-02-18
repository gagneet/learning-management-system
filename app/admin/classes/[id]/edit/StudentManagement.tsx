"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface StudentManagementProps {
  classId: string;
  currentMembers: any[];
  allStudents: Student[];
}

export function StudentManagement({ classId, currentMembers, allStudents }: StudentManagementProps) {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const availableStudents = allStudents.filter(
    (s) => !currentMembers.some((m) => m.studentId === s.id)
  );

  const handleAddStudent = async () => {
    if (!selectedStudentId) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/academic/classes/${classId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });

      if (response.ok) {
        setSelectedStudentId("");
        router.refresh();
      }
    } catch (error) {
      console.error("Error adding student:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/academic/classes/${classId}/members?studentId=${studentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error removing student:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">Add student to class...</option>
          {availableStudents.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
          ))}
        </select>
        <button
          onClick={handleAddStudent}
          disabled={!selectedStudentId || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentMembers.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-300">
                  {member.student.name}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleRemoveStudent(member.studentId)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {currentMembers.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">No students enrolled</div>
        )}
      </div>
    </div>
  );
}
