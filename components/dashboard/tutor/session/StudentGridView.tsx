"use client";

interface StudentStatus {
  id: string;
  name: string;
  gradeLevel: string;
  currentExercise?: string;
  status: "WORKING" | "WAITING_HELP" | "COMPLETED" | "IDLE" | "NOT_STARTED";
  progress: number; // 0-100
  avatar?: string;
}

interface StudentGridViewProps {
  students: StudentStatus[];
  onSelectStudent: (studentId: string) => void;
  selectedStudentId?: string | null;
}

export default function StudentGridView({
  students,
  onSelectStudent,
  selectedStudentId,
}: StudentGridViewProps) {
  const statusConfig = {
    WORKING: {
      color: "bg-green-500",
      label: "🟢 Working",
      textColor: "text-green-600 dark:text-green-400",
      borderColor: "border-green-500",
    },
    WAITING_HELP: {
      color: "bg-red-500",
      label: "🔴 Help!",
      textColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-500",
    },
    COMPLETED: {
      color: "bg-blue-500",
      label: "✅ Done",
      textColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500",
    },
    IDLE: {
      color: "bg-yellow-500",
      label: "⏸️ Idle",
      textColor: "text-yellow-600 dark:text-yellow-400",
      borderColor: "border-yellow-500",
    },
    NOT_STARTED: {
      color: "bg-gray-500",
      label: "⚪ Not Started",
      textColor: "text-gray-600 dark:text-gray-400",
      borderColor: "border-gray-500",
    },
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="px-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {students.map((student) => {
          const config = statusConfig[student.status];
          const isSelected = student.id === selectedStudentId;

          return (
            <button
              key={student.id}
              onClick={() => onSelectStudent(student.id)}
              className={`
                bg-white dark:bg-gray-800
                border-2 ${isSelected ? config.borderColor : "border-gray-200 dark:border-gray-700"}
                rounded-lg p-4 text-left
                hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600
                transition-all duration-200
                ${isSelected ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
              `}
            >
              {/* Avatar & Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {student.avatar ? (
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(student.name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white truncate">
                    {student.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {student.gradeLevel}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className={`text-sm font-semibold mb-2 ${config.textColor}`}>
                {config.label}
              </div>

              {/* Current Exercise */}
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 truncate">
                {student.currentExercise || "No exercise assigned"}
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{student.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.color} transition-all duration-300`}
                    style={{ width: `${student.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStudent(student.id);
                  }}
                  className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded transition-colors"
                >
                  Note
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle assign content
                  }}
                  className="flex-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium rounded transition-colors"
                >
                  ➕
                </button>
              </div>
            </button>
          );
        })}
      </div>

      {students.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No students enrolled in this session
          </p>
        </div>
      )}
    </div>
  );
}
