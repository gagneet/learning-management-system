'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AgeTierId = 'tier1' | 'tier2' | 'tier3';
export type AccessibilityMode = 'default' | 'dyslexia' | 'focus' | 'calm' | 'high-contrast';

interface ThemeContextValue {
  tier: AgeTierId;
  setTier: (tier: AgeTierId) => void;
  accessibilityMode: AccessibilityMode;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<AgeTierId>('tier3');
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>('default');
  const [fontSize, setFontSize] = useState(16);

  // Apply data attributes to document for CSS targeting
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-tier', tier);
      document.documentElement.setAttribute('data-mode', accessibilityMode);
    }
  }, [tier, accessibilityMode]);

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

  return (
    <ThemeContext.Provider value={{
      tier,
      setTier,
      accessibilityMode,
      setAccessibilityMode,
      fontSize,
      setFontSize,
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
    };
  }
  return context;
}
