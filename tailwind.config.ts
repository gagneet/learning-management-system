import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Keep existing
        background: "var(--background)",
        foreground: "var(--foreground)",

        // AetherLearn Design System
        primary: {
          DEFAULT: '#0D7377',
          light: '#14919B',
          dark: '#085558',
          50: '#f0f9fa',
          100: '#d9f1f3',
          200: '#b3e3e7',
          300: '#8cd5db',
          400: '#66c7cf',
          500: '#40b9c3',
          600: '#0D7377',
          700: '#0a5c5f',
          800: '#074547',
          900: '#042e2f',
        },
        accent: {
          warm: '#F59E0B',
          coral: '#EF6461',
        },
        success: {
          DEFAULT: '#059669',
          light: '#10b981',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#f59e0b',
          dark: '#b45309',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#ef4444',
          dark: '#b91c1c',
        },
        neutral: {
          dark: '#1E293B',
          medium: '#64748B',
          light: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['var(--font-lexend)', 'Arial', 'Helvetica', 'sans-serif'],
        lexend: ['var(--font-lexend)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        dyslexia: ['var(--font-atkinson)', 'sans-serif'],
      },
      fontSize: {
        // Tier 1 (Ages 5-8)
        'tier1-body': ['20px', { lineHeight: '1.75' }],
        'tier1-heading': ['32px', { lineHeight: '1.3' }],
        // Tier 2 (Ages 9-13)
        'tier2-body': ['18px', { lineHeight: '1.6' }],
        'tier2-heading': ['28px', { lineHeight: '1.3' }],
        // Tier 3 (Ages 14+)
        'tier3-body': ['16px', { lineHeight: '1.5' }],
        'tier3-heading': ['24px', { lineHeight: '1.3' }],
      },
      spacing: {
        'tier1': '48px',
        'tier2': '40px',
        'tier3': '32px',
      },
      borderRadius: {
        'tier1': '16px',
        'tier2': '12px',
        'tier3': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
