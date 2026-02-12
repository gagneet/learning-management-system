"use client";

/**
 * Theme Toggle Component
 * 
 * Provides a dropdown to switch between LIGHT, GRAY, and DARK themes
 */

import React, { useState } from "react";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "LIGHT", label: "Light", icon: "☀️" },
    { value: "GRAY", label: "Gray", icon: "🌥️" },
    { value: "DARK", label: "Dark", icon: "🌙" },
  ];

  const currentTheme = themes.find((t) => t.value === themeMode) || themes[0];

  const handleThemeChange = async (newTheme: ThemeMode) => {
    await setThemeMode(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        <span className="text-lg">{currentTheme.icon}</span>
        <span className="text-sm font-medium">{currentTheme.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    themeMode === theme.value
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="text-lg">{theme.icon}</span>
                  <span className="font-medium">{theme.label}</span>
                  {themeMode === theme.value && (
                    <svg
                      className="ml-auto w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
