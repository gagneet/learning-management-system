"use client";

interface ProgressBarProps {
  progress: number;
  max?: number;
  className?: string;
  color?: string;
  height?: string;
  showLabel?: boolean;
  labelClassName?: string;
}

/**
 * A reusable, accessible progress bar component.
 * Implements WAI-ARIA progressbar role and properties.
 */
export function ProgressBar({
  progress,
  max = 100,
  className = "",
  color = "bg-blue-600",
  height = "h-2",
  showLabel = false,
  labelClassName = "text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[40px]",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((progress / max) * 100, 0), 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${height}`}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${Math.round(percentage)}% complete`}
      >
        <div
          className={`${color} ${height} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className={labelClassName}>
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
