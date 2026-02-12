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
    border rounded-lg p-6 transition-all cursor-pointer bg-white
    hover:shadow-lg hover:border-blue-500 hover:-translate-y-1
    ${className}
  `;

  const content = (
    <div className={baseClasses} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {icon && <div className="mb-3 text-blue-600">{icon}</div>}
          <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
          {description && (
            <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
          )}
        </div>
        {badge && (
          <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
