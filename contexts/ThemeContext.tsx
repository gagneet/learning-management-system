'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export type AgeTierId = 'tier1' | 'tier2' | 'tier3';
export type AccessibilityMode = 'default' | 'dyslexia' | 'focus' | 'calm' | 'high-contrast';
export type ThemeMode = 'LIGHT' | 'GRAY' | 'DARK';

interface ThemeContextValue {
  tier: AgeTierId;
  setTier: (tier: AgeTierId) => void;
  accessibilityMode: AccessibilityMode;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [tier, setTier] = useState<AgeTierId>('tier3');
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>('default');
  const [fontSize, setFontSize] = useState(16);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('LIGHT');

  // Apply data attributes to document for CSS targeting
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-tier', tier);
      document.documentElement.setAttribute('data-mode', accessibilityMode);
      document.documentElement.setAttribute('data-theme', themeMode.toLowerCase());
      
      // Apply theme classes
      document.documentElement.classList.remove('theme-light', 'theme-gray', 'theme-dark');
      document.documentElement.classList.add(`theme-${themeMode.toLowerCase()}`);
    }
  }, [tier, accessibilityMode, themeMode]);

  // Load theme from user preferences or localStorage
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (session?.user) {
      // Use theme from session if available
      const userTheme = (session.user as any).themePreference as ThemeMode;
      if (userTheme && ["LIGHT", "GRAY", "DARK"].includes(userTheme)) {
        setThemeModeState(userTheme);
      }
    } else {
      // Load from localStorage for non-authenticated users
      const savedTheme = localStorage.getItem("themeMode") as ThemeMode;
      if (savedTheme && ["LIGHT", "GRAY", "DARK"].includes(savedTheme)) {
        setThemeModeState(savedTheme);
      }
    }
  }, [session, status]);

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTier = localStorage.getItem('ageTier') as AgeTierId | null;
      const savedMode = localStorage.getItem('accessibilityMode') as AccessibilityMode | null;

      if (savedTier) setTier(savedTier);
      if (savedMode) setAccessibilityMode(savedMode);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ageTier', tier);
      localStorage.setItem('accessibilityMode', accessibilityMode);
    }
  }, [tier, accessibilityMode]);

  const setThemeMode = async (newTheme: ThemeMode) => {
    if (!["LIGHT", "GRAY", "DARK"].includes(newTheme)) {
      console.error("Invalid theme:", newTheme);
      return;
    }

    setThemeModeState(newTheme);

    if (session?.user) {
      // Persist to database
      try {
        const response = await fetch("/api/users/theme", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ themePreference: newTheme }),
        });

        if (response.ok) {
          // Update session with new theme preference
          await update({
            ...session,
            user: {
              ...session.user,
              themePreference: newTheme,
            },
          });
        } else {
          console.error("Failed to save theme preference");
        }
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    } else {
      // Save to localStorage for non-authenticated users
      localStorage.setItem("themeMode", newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{
      tier,
      setTier,
      accessibilityMode,
      setAccessibilityMode,
      fontSize,
      setFontSize,
      themeMode,
      setThemeMode,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // SAFE FALLBACK: Returns defaults if not wrapped in provider
    console.warn('useTheme called outside ThemeProvider, using defaults');
    return {
      tier: 'tier3' as AgeTierId,
      setTier: () => {},
      accessibilityMode: 'default' as AccessibilityMode,
      setAccessibilityMode: () => {},
      fontSize: 16,
      setFontSize: () => {},
      themeMode: 'LIGHT' as ThemeMode,
      setThemeMode: async () => {},
    };
  }
  return context;
}
