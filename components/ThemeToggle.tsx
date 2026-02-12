"use client";

/**
 * Theme Toggle Component
 * 
 * Provides a slider to switch between LIGHT, GRAY, and DARK themes
 */

import React from "react";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();

  const themes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "LIGHT", label: "Light", icon: "☀️" },
    { value: "GRAY", label: "Gray", icon: "🌥️" },
    { value: "DARK", label: "Dark", icon: "🌙" },
  ];

  const currentIndex = themes.findIndex((t) => t.value === themeMode);

  const handleThemeChange = async (newIndex: number) => {
    if (newIndex >= 0 && newIndex < themes.length) {
      await setThemeMode(themes[newIndex].value);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Slider Container */}
      <div className="relative bg-gray-200 dark:bg-gray-700 rounded-full p-1 flex items-center gap-1">
        {themes.map((theme, index) => (
          <button
            key={theme.value}
            onClick={() => handleThemeChange(index)}
            className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
              themeMode === theme.value
                ? "text-white"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
            aria-label={`Switch to ${theme.label} theme`}
            title={`${theme.label} Theme`}
          >
            <span className="text-lg">{theme.icon}</span>
            <span className="text-sm font-medium hidden sm:inline">{theme.label}</span>
          </button>
        ))}
        
        {/* Sliding Background */}
        <div
          className="absolute top-1 left-1 h-[calc(100%-8px)] rounded-full transition-all duration-300 ease-in-out bg-gradient-to-r shadow-lg"
          style={{
            width: `calc(33.333% - 4px)`,
            transform: `translateX(calc(${currentIndex * 100}% + ${currentIndex * 4}px))`,
            background:
              themeMode === "LIGHT"
                ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                : themeMode === "GRAY"
                ? "linear-gradient(135deg, #9ca3af, #6b7280)"
                : "linear-gradient(135deg, #4f46e5, #7c3aed)",
          }}
        />
      </div>
    </div>
  );
}
