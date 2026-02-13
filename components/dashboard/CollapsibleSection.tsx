"use client";

import { useState, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  badge?: string | number;
  defaultExpanded?: boolean;
  persistKey?: string;
  children: ReactNode;
  variant?: "default" | "compact";
}

export function CollapsibleSection({
  title,
  icon,
  badge,
  defaultExpanded = true,
  persistKey,
  children,
  variant = "default",
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMounted, setIsMounted] = useState(false);

  // Load persisted state from localStorage
  useEffect(() => {
    setIsMounted(true);
    if (persistKey && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`dashboard-section-${persistKey}`);
        if (stored !== null) {
          setIsExpanded(stored === "true");
        }
      } catch (error) {
        console.warn("Failed to load collapsed state from localStorage:", error);
      }
    }
  }, [persistKey]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isMounted && persistKey && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `dashboard-section-${persistKey}`,
          String(isExpanded)
        );
      } catch (error) {
        console.warn("Failed to save collapsed state to localStorage:", error);
      }
    }
  }, [isExpanded, persistKey, isMounted]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const sectionId = `collapsible-section-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${
        variant === "compact" ? "mb-3" : "mb-6"
      }`}
      aria-labelledby={`${sectionId}-title`}
    >
      {/* Header */}
      <button
        onClick={toggleExpanded}
        className={`w-full flex items-center justify-between text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
          variant === "compact" ? "px-4 py-3" : "px-6 py-4"
        }`}
        aria-expanded={isExpanded}
        aria-controls={sectionId}
        type="button"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl" aria-hidden="true">{icon}</span>}
          <h2
            id={`${sectionId}-title`}
            className={`font-semibold text-gray-900 dark:text-white ${
              variant === "compact" ? "text-base" : "text-lg"
            }`}
          >
            {title}
          </h2>
          {badge !== undefined && badge !== "" && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Content */}
      <div
        id={sectionId}
        role="region"
        aria-labelledby={`${sectionId}-title`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={variant === "compact" ? "px-4 pb-3" : "px-6 pb-6"}>
          {children}
        </div>
      </div>
    </section>
  );
}
