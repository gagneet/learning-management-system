# AetherLearn Design System Quick Start

## Overview
This guide provides immediate next steps for implementing the AetherLearn design system with age-adaptive theming, accessibility features, and gamification.

## Immediate Actions (Week 1)

### 1. Update Tailwind Configuration

**File**: `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D7377',
          light: '#14919B',
          dark: '#085558',
        },
        accent: {
          warm: '#F59E0B',
          coral: '#EF6461',
        },
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        neutral: {
          dark: '#1E293B',
          medium: '#64748B',
          light: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Lexend', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Lexend', 'sans-serif'],
        heading: ['Lexend', 'sans-serif'],
        dyslexia: ['Atkinson Hyperlegible', 'Lexend', 'sans-serif'],
      },
      fontSize: {
        // Tier 1 (Ages 5-8)
        'tier1-body': ['20px', { lineHeight: '1.75' }],
        'tier1-heading': ['32px', { lineHeight: '1.3' }],
        // Tier 2 (Ages 9-13)
        'tier2-body': ['18px', { lineHeight: '1.6' }],
        'tier2-heading': ['28px', { lineHeight: '1.3' }],
        // Tier 3 (Ages 14+/Adult)
        'tier3-body': ['16px', { lineHeight: '1.5' }],
        'tier3-heading': ['24px', { lineHeight: '1.3' }],
      },
      spacing: {
        // Age-tier spacing
        'tier1': '48px', // Large touch targets
        'tier2': '40px', // Medium touch targets
        'tier3': '32px', // Standard touch targets
      },
      borderRadius: {
        'tier1': '16px', // Very rounded for young children
        'tier2': '12px', // Moderately rounded
        'tier3': '8px',  // Standard rounded
      },
    },
  },
  plugins: [],
};

export default config;
```

### 2. Load Fonts with next/font

**File**: `app/fonts.ts`

```typescript
import { Lexend, Inter } from 'next/font/google';
import localFont from 'next/font/local';

export const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Atkinson Hyperlegible for dyslexia mode
export const atkinson = localFont({
  src: [
    {
      path: '../public/fonts/Atkinson-Hyperlegible-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Atkinson-Hyperlegible-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-atkinson',
  display: 'swap',
});
```

**Update**: `app/layout.tsx`

```typescript
import { lexend, inter, atkinson } from './fonts';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${lexend.variable} ${inter.variable} ${atkinson.variable}`}
    >
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
```

### 3. Create Age-Tier System

**File**: `lib/design/age-tiers.ts`

```typescript
export type AgeTierId = 'tier1' | 'tier2' | 'tier3';

export interface AgeTier {
  id: AgeTierId;
  name: string;
  ageRange: string;
  navigationStyle: 'icon-only' | 'icon-text' | 'full-nav';
  textDensity: 'minimal' | 'moderate' | 'standard';
  visualStyle: 'playful' | 'structured' | 'professional';
  contentLayout: 'single' | 'sequential' | 'multi-panel';
  feedbackStyle: 'animated' | 'visual-audio' | 'subtle';
  interactionMode: 'simple' | 'guided' | 'advanced';
  fontSize: {
    body: string;
    heading: string;
  };
  spacing: string;
  borderRadius: string;
}

export const AGE_TIERS: Record<AgeTierId, AgeTier> = {
  tier1: {
    id: 'tier1',
    name: 'Young Learners',
    ageRange: '5-8 years',
    navigationStyle: 'icon-only',
    textDensity: 'minimal',
    visualStyle: 'playful',
    contentLayout: 'single',
    feedbackStyle: 'animated',
    interactionMode: 'simple',
    fontSize: {
      body: 'text-tier1-body',
      heading: 'text-tier1-heading',
    },
    spacing: 'p-tier1',
    borderRadius: 'rounded-tier1',
  },
  tier2: {
    id: 'tier2',
    name: 'Middle Years',
    ageRange: '9-13 years',
    navigationStyle: 'icon-text',
    textDensity: 'moderate',
    visualStyle: 'structured',
    contentLayout: 'sequential',
    feedbackStyle: 'visual-audio',
    interactionMode: 'guided',
    fontSize: {
      body: 'text-tier2-body',
      heading: 'text-tier2-heading',
    },
    spacing: 'p-tier2',
    borderRadius: 'rounded-tier2',
  },
  tier3: {
    id: 'tier3',
    name: 'Teens & Adults',
    ageRange: '14+ years',
    navigationStyle: 'full-nav',
    textDensity: 'standard',
    visualStyle: 'professional',
    contentLayout: 'multi-panel',
    feedbackStyle: 'subtle',
    interactionMode: 'advanced',
    fontSize: {
      body: 'text-tier3-body',
      heading: 'text-tier3-heading',
    },
    spacing: 'p-tier3',
    borderRadius: 'rounded-tier3',
  },
};

export function getAgeTierFromAge(age: number): AgeTierId {
  if (age >= 5 && age <= 8) return 'tier1';
  if (age >= 9 && age <= 13) return 'tier2';
  return 'tier3';
}

export function getAgeTierFromDateOfBirth(dob: Date): AgeTierId {
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return getAgeTierFromAge(age);
}
```

### 4. Create Theme Context

**File**: `contexts/ThemeContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AgeTierId, AGE_TIERS, AgeTier } from '@/lib/design/age-tiers';

interface ThemeContextType {
  ageTier: AgeTier;
  setAgeTier: (tier: AgeTierId) => void;
  accessibilityMode: AccessibilityMode;
  setAccessibilityMode: (mode: AccessibilityMode) => void;
}

export type AccessibilityMode = 'none' | 'dyslexia' | 'focus' | 'calm' | 'high-contrast';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children,
  initialTier = 'tier3',
}: { 
  children: ReactNode;
  initialTier?: AgeTierId;
}) {
  const [ageTier, setAgeTierState] = useState<AgeTier>(AGE_TIERS[initialTier]);
  const [accessibilityMode, setAccessibilityMode] = useState<AccessibilityMode>('none');

  const setAgeTier = (tier: AgeTierId) => {
    setAgeTierState(AGE_TIERS[tier]);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ageTier', tier);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ageTier') as AgeTierId | null;
      if (saved && AGE_TIERS[saved]) {
        setAgeTierState(AGE_TIERS[saved]);
      }

      const savedAccessibility = localStorage.getItem('accessibilityMode') as AccessibilityMode | null;
      if (savedAccessibility) {
        setAccessibilityMode(savedAccessibility);
      }
    }
  }, []);

  // Apply accessibility mode classes to body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('mode-dyslexia', 'mode-focus', 'mode-calm', 'mode-high-contrast');
      if (accessibilityMode !== 'none') {
        document.body.classList.add(`mode-${accessibilityMode}`);
      }
      localStorage.setItem('accessibilityMode', accessibilityMode);
    }
  }, [accessibilityMode]);

  return (
    <ThemeContext.Provider value={{ ageTier, setAgeTier, accessibilityMode, setAccessibilityMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### 5. Create Accessibility Styles

**File**: `app/accessibility.css`

```css
/* Dyslexia Mode */
body.mode-dyslexia {
  font-family: var(--font-atkinson), var(--font-lexend);
  letter-spacing: 0.12em;
  line-height: 1.75;
  background-color: #FDF6E3 !important;
}

body.mode-dyslexia * {
  text-align: left !important;
  hyphens: none;
}

/* Focus Mode (ADHD-friendly) */
body.mode-focus {
  /* Hide non-essential elements */
}

body.mode-focus .sidebar,
body.mode-focus .secondary-nav {
  display: none;
}

body.mode-focus .content {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem;
}

/* Calm Mode (Autism-friendly) */
body.mode-calm {
  filter: saturate(0.5); /* Muted colors */
}

body.mode-calm * {
  animation: none !important;
  transition: none !important;
}

body.mode-calm video,
body.mode-calm audio {
  autoplay: none;
}

/* High Contrast Mode */
body.mode-high-contrast {
  background: #000;
  color: #FFF;
  filter: contrast(1.5);
}

body.mode-high-contrast a {
  color: #0FF;
  font-weight: bold;
}

body.mode-high-contrast button {
  border: 3px solid #FFF;
}
```

**Import in**: `app/globals.css`

```css
@import './accessibility.css';
```

### 6. Update Database Schema for Age Tier

**File**: `prisma/schema.prisma`

Add to User model:

```prisma
model User {
  // ... existing fields ...
  
  // Age-tier and accessibility
  dateOfBirth   DateTime?
  ageTier       AgeTierId @default(TIER3)
  accessibilityMode AccessibilityMode @default(NONE)
}

enum AgeTierId {
  TIER1  // Ages 5-8
  TIER2  // Ages 9-13
  TIER3  // Ages 14+/Adult
}

enum AccessibilityMode {
  NONE
  DYSLEXIA
  FOCUS
  CALM
  HIGH_CONTRAST
}
```

Run: `npx prisma db:push`

### 7. Create Button Component with Tier Variants

**File**: `components/ui/Button.tsx`

```typescript
'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'auto' | 'small' | 'medium' | 'large';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'auto', className = '', children, ...props }, ref) => {
    const { ageTier } = useTheme();
    
    // Auto-size based on age tier
    const tierSize = size === 'auto' 
      ? ageTier.id === 'tier1' ? 'large'
        : ageTier.id === 'tier2' ? 'medium'
        : 'medium'
      : size;

    const baseClasses = `
      font-semibold transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-offset-2
      ${ageTier.borderRadius}
    `;

    const sizeClasses = {
      small: 'px-4 py-2 text-sm',
      medium: 'px-6 py-3 text-base',
      large: 'px-8 py-4 text-lg min-h-[48px]',
    };

    const variantClasses = {
      primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
      secondary: 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium focus:ring-neutral-medium',
      success: 'bg-success text-white hover:bg-green-700 focus:ring-success',
      warning: 'bg-warning text-white hover:bg-orange-600 focus:ring-warning',
      error: 'bg-error text-white hover:bg-red-700 focus:ring-error',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizeClasses[tierSize]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 8. Download Required Fonts

Download Atkinson Hyperlegible from: https://brailleinstitute.org/freefont

Place in: `public/fonts/`
- `Atkinson-Hyperlegible-Regular.woff2`
- `Atkinson-Hyperlegible-Bold.woff2`

---

## Testing the Design System

### 1. Create a Test Page

**File**: `app/design-test/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';

export default function DesignTestPage() {
  const { ageTier, setAgeTier, accessibilityMode, setAccessibilityMode } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={`${ageTier.fontSize.heading} font-bold mb-8`}>
        Design System Test
      </h1>

      {/* Age Tier Selector */}
      <section className="mb-12">
        <h2 className={`${ageTier.fontSize.body} font-semibold mb-4`}>
          Age Tier: {ageTier.name} ({ageTier.ageRange})
        </h2>
        <div className="flex gap-4">
          <Button onClick={() => setAgeTier('tier1')}>
            Tier 1 (5-8)
          </Button>
          <Button onClick={() => setAgeTier('tier2')}>
            Tier 2 (9-13)
          </Button>
          <Button onClick={() => setAgeTier('tier3')}>
            Tier 3 (14+)
          </Button>
        </div>
      </section>

      {/* Accessibility Mode Selector */}
      <section className="mb-12">
        <h2 className={`${ageTier.fontSize.body} font-semibold mb-4`}>
          Accessibility Mode: {accessibilityMode}
        </h2>
        <div className="flex gap-4 flex-wrap">
          <Button onClick={() => setAccessibilityMode('none')}>
            None
          </Button>
          <Button onClick={() => setAccessibilityMode('dyslexia')}>
            Dyslexia
          </Button>
          <Button onClick={() => setAccessibilityMode('focus')}>
            Focus
          </Button>
          <Button onClick={() => setAccessibilityMode('calm')}>
            Calm
          </Button>
          <Button onClick={() => setAccessibilityMode('high-contrast')}>
            High Contrast
          </Button>
        </div>
      </section>

      {/* Color Palette */}
      <section className="mb-12">
        <h2 className={`${ageTier.fontSize.body} font-semibold mb-4`}>
          Color Palette
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 bg-primary text-white rounded-lg">
            Primary
          </div>
          <div className="p-6 bg-primary-light text-white rounded-lg">
            Primary Light
          </div>
          <div className="p-6 bg-accent-warm text-white rounded-lg">
            Accent Warm
          </div>
          <div className="p-6 bg-accent-coral text-white rounded-lg">
            Accent Coral
          </div>
          <div className="p-6 bg-success text-white rounded-lg">
            Success
          </div>
          <div className="p-6 bg-warning text-white rounded-lg">
            Warning
          </div>
          <div className="p-6 bg-error text-white rounded-lg">
            Error
          </div>
          <div className="p-6 bg-neutral-light text-neutral-dark rounded-lg">
            Neutral
          </div>
        </div>
      </section>

      {/* Button Variants */}
      <section className="mb-12">
        <h2 className={`${ageTier.fontSize.body} font-semibold mb-4`}>
          Button Variants
        </h2>
        <div className="flex gap-4 flex-wrap">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="error">Error</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Typography Scale */}
      <section className="mb-12">
        <h2 className={`${ageTier.fontSize.body} font-semibold mb-4`}>
          Typography Scale
        </h2>
        <div className="space-y-4">
          <p className={ageTier.fontSize.heading}>
            Heading Text - {ageTier.fontSize.heading}
          </p>
          <p className={ageTier.fontSize.body}>
            Body Text - {ageTier.fontSize.body}
          </p>
        </div>
      </section>
    </div>
  );
}
```

### 2. Wrap App in ThemeProvider

**File**: `app/layout.tsx`

```typescript
import { ThemeProvider } from '@/contexts/ThemeContext';
import { lexend, inter, atkinson } from './fonts';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${lexend.variable} ${inter.variable} ${atkinson.variable}`}
    >
      <body className="font-sans">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 3. Test the System

1. Run `npm run dev`
2. Navigate to `/design-test`
3. Test age tier switching
4. Test accessibility modes
5. Verify color contrast
6. Test button interactions
7. Check responsive behavior

---

## Next Steps After Week 1

1. **Week 2**: Build gamification database models and XP system
2. **Week 3**: Implement badge system and achievements
3. **Week 4**: Create streak system with safety nets
4. **Week 5-6**: QR code generation and annotation workflow
5. **Week 7-8**: Enhanced dashboards for all roles
6. **Week 9-10**: Polish, testing, and documentation

---

## Common Issues & Solutions

### Issue: Fonts not loading
**Solution**: Ensure font files are in `public/fonts/` and paths in `fonts.ts` are correct

### Issue: Theme not persisting
**Solution**: Check localStorage permissions and verify ThemeContext is wrapped around app

### Issue: Accessibility mode not applying
**Solution**: Verify `accessibility.css` is imported in `globals.css`

### Issue: Colors not showing correctly
**Solution**: Run `npm run build` to regenerate Tailwind CSS with new config

---

## Resources

- **Design Document**: `docs/features-ux-design/ux_gamification_and_design_patterns_for_aetherlearn_lms.md`
- **Implementation Roadmap**: `docs/features-ux-design/implementation-roadmap.md`
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Next.js Font Optimization**: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Status**: Ready to implement
**Priority**: Start immediately
**Dependencies**: None (foundation work)
