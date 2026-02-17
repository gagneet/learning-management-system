"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface ClickableCardProps {
  href?: string;
  onClick?: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
  className?: string;
}

/**
 * Reusable clickable card component
 * Can be used as a link or with onClick handler
 * Enhanced with accessibility features and dark mode support
 */
export function ClickableCard({
  href,
  onClick,
  title,
  description,
  icon,
  badge,
  className = "",
}: ClickableCardProps) {
  const baseClasses = `
    border rounded-lg p-6 transition-all text-left w-full block
    bg-white dark:bg-gray-800
    border-gray-200 dark:border-gray-700
    hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 hover:-translate-y-1
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    group
    ${className}
  `;

  const innerContent = (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        {icon && (
          <div className="mb-3 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {badge && (
        <span className="ml-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full whitespace-nowrap">
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {innerContent}
    </button>
  );
}
