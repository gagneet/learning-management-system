"use client";

import { ClickableCard } from "@/components/ClickableCard";
import { ReactNode } from "react";

export interface ActionCard {
  title: string;
  description: string;
  icon: ReactNode;
  href: string;
  badge?: string;
}

interface ActionCardsSectionProps {
  actions: ActionCard[];
  columns?: 2 | 3 | 4;
}

export function ActionCardsSection({
  actions,
  columns = 3,
}: ActionCardsSectionProps) {
  // Responsive grid classes based on column count
  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 mt-4`}>
      {actions.map((action, index) => (
        <ClickableCard
          key={index}
          title={action.title}
          description={action.description}
          icon={action.icon}
          href={action.href}
          badge={action.badge}
        />
      ))}
    </div>
  );
}
