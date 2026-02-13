The remaining work is largely execution: finish Phase 1 APIs/UIs, extend the schema (ageTier, notifications), implement the detailed UX/gamification elements, and build robust tests. Throughout, we must never lose sight of the core principles in the PRD (e.g. scoping by centreId and strict RBAC). By doing so, we will fully realise the vision of an age-adaptive, accessible, and engaging LMS.


╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 AetherLearn UX/Design System - Phase 1 Foundation Implementation Plan 

 Context

 The user has created comprehensive UX/design documentation for an age-adaptive, accessibility-first LMS with enhanced gamification. The roadmap estimates 16-20 weeks
 for full implementation across 7 phases. However, no implementation has been done yet - the current system has:

 - ❌ No age-tier or accessibility fields in the database
 - ❌ No enhanced gamification models (XPTransaction, BadgeDefinition, Streak)
 - ❌ Minimal Tailwind config (no custom colors/fonts)
 - ❌ No theme provider or design token system
 - ❌ No web fonts loaded (using Arial/Helvetica)
 - ✅ Basic gamification exists (GamificationProfile with xp, level, streak, Badge, Achievement)
 - ✅ Strong multi-tenancy, RBAC, and audit logging infrastructure
 - ✅ Full dashboards for all roles (except parent portal)

 The Challenge: Implement the design foundation WITHOUT breaking existing functionality. All current dashboards, APIs, and workflows must continue working unchanged.

 The Solution: A strictly additive, backwards-compatible Phase 1 that establishes the design system foundation while making adoption optional. Existing pages will work
  without modification while new features can opt-in to the enhanced system.

 ---
 Implementation Strategy

 Core Principles

 1. Additive-Only Database Changes - All new fields are nullable or have defaults
 2. Parallel Design Systems - New design tokens coexist with existing inline styles
 3. Opt-In Theme Context - Works with or without provider wrapping
 4. Gradual Adoption - Existing components continue working, new components use enhanced system
 5. Safe Rollback - Every change can be reverted without data loss

 Phase 1 Scope (Week 1-2)

 Database Extensions:
 - Add age-tier fields to User model (nullable)
 - Create enhanced gamification models (XPTransaction, BadgeDefinition, BadgeAward, Streak, LeaderboardOptIn)
 - Extend GamificationProfile with additional tracking fields
 - Seed badge definitions

 Design System Foundation:
 - Extend Tailwind config with AetherLearn color palette
 - Add CSS custom properties for design tokens
 - Load web fonts (Lexend, Inter, Atkinson Hyperlegible)
 - Create opt-in ThemeContext with safe fallbacks
 - Add accessibility mode CSS

 What This Enables:
 - Future pages can use age-tier theming
 - Enhanced gamification APIs can track XP transactions
 - Badge system ready for awarding
 - Streak tracking infrastructure ready
 - Design tokens available for gradual component migration

 What Stays Unchanged:
 - All existing dashboards continue working
 - All existing APIs remain functional
 - No immediate adoption required
 - Existing inline Tailwind classes still work

 ---
 Phase 1 Implementation Details

 1. Database Schema Extensions

 File: prisma/schema.prisma

 Add to User model (lines 51-113):
 model User {
   // ... existing fields ...

   // NEW: Age-tier system (nullable with defaults)
   dateOfBirth       DateTime?
   ageTier           AgeTier   @default(TIER3)

   // NEW: Gamification relationships
   xpTransactions    XPTransaction[]
   badgeAwards       BadgeAward[]
   streaks           Streak[]
   leaderboardOptIn  LeaderboardOptIn?

   // ... existing relationships ...
 }

 enum AgeTier {
   TIER1  // Ages 5-8 (playful, large touch targets)
   TIER2  // Ages 9-13 (structured, medium density)
   TIER3  // Ages 14+/Adult (professional, standard)
 }

 Create new models after Achievement model (after line 428):
 // XP Transaction Log
 model XPTransaction {
   id          String   @id @default(cuid())
   userId      String
   user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
   amount      Int      // XP earned
   source      XPSource
   sourceId    String?  // ID of the activity
   description String?
   createdAt   DateTime @default(now())

   @@index([userId])
   @@index([createdAt])
   @@index([source])
 }

 enum XPSource {
   LESSON_COMPLETION
   HOMEWORK_SUBMISSION
   HOMEWORK_ONTIME
   SESSION_ATTENDANCE
   QUIZ_COMPLETION
   QUIZ_PERFECT
   READING_ACTIVITY
   HELPING_PEER
   STREAK_MILESTONE
 }

 // Badge Definitions (reusable templates)
 model BadgeDefinition {
   id          String     @id @default(cuid())
   name        String     @unique
   description String
   category    BadgeCategory
   tier        BadgeTier
   iconUrl     String?
   xpValue     Int        @default(0)
   criteria    Json       // Unlock conditions
   isActive    Boolean    @default(true)

   awards      BadgeAward[]

   createdAt   DateTime   @default(now())
   updatedAt   DateTime   @updatedAt

   @@index([category])
   @@index([tier])
 }

 enum BadgeCategory {
   COMPLETION
   STREAK
   MASTERY
   SOCIAL
   SPECIAL
 }

 enum BadgeTier {
   BRONZE
   SILVER
   GOLD
   PLATINUM
 }

 // Badge Awards (to users)
 model BadgeAward {
   id              String           @id @default(cuid())
   userId          String
   user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
   badgeId         String
   badge           BadgeDefinition  @relation(fields: [badgeId], references: [id])
   awardedAt       DateTime         @default(now())

   @@unique([userId, badgeId])
   @@index([userId])
   @@index([awardedAt])
 }

 // Streak Tracking
 model Streak {
   id              String     @id @default(cuid())
   userId          String     @unique
   user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
   type            StreakType
   currentStreak   Int        @default(0)
   longestStreak   Int        @default(0)
   lastActivityAt  DateTime   @default(now())
   freezesAvailable Int       @default(1)

   createdAt       DateTime   @default(now())
   updatedAt       DateTime   @updatedAt

   @@index([userId])
   @@index([type])
 }

 enum StreakType {
   ATTENDANCE
   HOMEWORK
   READING
   LOGIN
 }

 // Leaderboard Opt-In
 model LeaderboardOptIn {
   id        String   @id @default(cuid())
   userId    String   @unique
   user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
   enabled   Boolean  @default(false)
   scope     String   @default("class") // "class", "centre", "global"

   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
 }

 Update GamificationProfile (lines 370-388) - ADD fields only:
 model GamificationProfile {
   // ... existing fields unchanged ...

   // NEW: Additional tracking (nullable - won't break existing)
   totalXP         Int?     @default(0)  // Lifetime XP
   nextLevelXP     Int?     @default(100)

   // ... existing relationships unchanged ...
 }

 Migration Commands:
 # 1. Backup database first
 pg_dump $DATABASE_URL > backup_pre_phase1_$(date +%Y%m%d_%H%M%S).sql

 # 2. Generate Prisma client
 npm run db:generate

 # 3. Push schema changes (uses db push, not migrations per CLAUDE.md)
 npm run db:push

 # 4. Verify changes
 npx prisma studio  # Check User model has new fields, new tables exist

 ---
 2. Design Token System

 File: tailwind.config.ts

 Replace entire file with:
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

 ---
 3. CSS Custom Properties & Accessibility

 File: app/globals.css

 Add after existing styles (keep all existing CSS):
 /* Existing styles remain unchanged */
 @tailwind base;
 @tailwind components;
 @tailwind utilities;

 :root {
   --background: #ffffff;
   --foreground: #171717;
 }

 @media (prefers-color-scheme: dark) {
   :root {
     --background: #0a0a0a;
     --foreground: #ededed;
   }
 }

 body {
   color: var(--foreground);
   background: var(--background);
   font-family: Arial, Helvetica, sans-serif;
 }

 @layer utilities {
   .text-balance {
     text-wrap: balance;
   }
 }

 /* NEW: AetherLearn Design Tokens */
 :root {
   /* Font families (CSS variables for next/font) */
   --font-lexend: 'Lexend', sans-serif;
   --font-inter: 'Inter', sans-serif;
   --font-atkinson: 'Atkinson Hyperlegible', sans-serif;
 }

 /* NEW: Age Tier Adaptations (opt-in via data attribute) */
 [data-tier="tier1"] {
   font-size: 20px;
   line-height: 1.75;
 }

 [data-tier="tier1"] h1,
 [data-tier="tier1"] h2 {
   font-size: 32px;
 }

 [data-tier="tier2"] {
   font-size: 18px;
   line-height: 1.6;
 }

 [data-tier="tier2"] h1,
 [data-tier="tier2"] h2 {
   font-size: 28px;
 }

 /* NEW: Accessibility Modes (opt-in) */
 [data-mode="dyslexia"] {
   font-family: var(--font-atkinson, var(--font-lexend));
   letter-spacing: 0.12em;
   line-height: 1.75;
   background-color: #FDF6E3 !important; /* Cream background */
 }

 [data-mode="dyslexia"] * {
   text-align: left !important;
   hyphens: none;
 }

 [data-mode="focus"] .sidebar,
 [data-mode="focus"] .secondary-nav {
   display: none;
 }

 [data-mode="focus"] .content {
   max-width: 800px;
   margin: 0 auto;
   padding: 3rem;
 }

 [data-mode="calm"] {
   filter: saturate(0.5);
 }

 [data-mode="calm"] * {
   animation: none !important;
   transition: none !important;
 }

 [data-mode="high-contrast"] {
   background: #000 !important;
   color: #FFF !important;
   filter: contrast(1.5);
 }

 [data-mode="high-contrast"] a {
   color: #0FF;
   font-weight: bold;
 }

 [data-mode="high-contrast"] button {
   border: 3px solid #FFF;
 }

 ---
 4. Font Loading with Next.js

 File: app/fonts.ts (NEW)

 import { Lexend, Inter, Atkinson_Hyperlegible } from 'next/font/google';

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

 export const atkinson = Atkinson_Hyperlegible({
   weight: ['400', '700'],
   subsets: ['latin'],
   variable: '--font-atkinson',
   display: 'swap',
 });

 ---
 5. Update Root Layout

 File: app/layout.tsx

 import type { Metadata } from "next";
 import "./globals.css";
 import { lexend, inter, atkinson } from "./fonts";

 export const metadata: Metadata = {
   title: "Learning Management System",
   description: "A comprehensive LMS for managing courses, users, and learning content",
 };

 export default function RootLayout({
   children,
 }: Readonly<{
   children: React.ReactNode;
 }>) {
   return (
     <html
       lang="en"
       className={`${lexend.variable} ${inter.variable} ${atkinson.variable}`}
     >
       <body>
         {children}
       </body>
     </html>
   );
 }

 ---
 6. Theme Context Provider

 File: contexts/ThemeContext.tsx (NEW)

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

 ---
 7. Age-Tier Utility Library

 File: lib/design/age-tiers.ts (NEW)

 import type { AgeTierId } from '@/contexts/ThemeContext';

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

 export function calculateAge(dob: Date): number {
   return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
 }

 ---
 8. Badge Seeding Script

 File: prisma/seeds/badges.ts (NEW)

 import { PrismaClient, BadgeCategory, BadgeTier } from '@prisma/client';

 const prisma = new PrismaClient();

 const BADGE_DEFINITIONS = [
   // Completion badges
   {
     name: 'First Steps',
     description: 'Complete your first lesson',
     category: BadgeCategory.COMPLETION,
     tier: BadgeTier.BRONZE,
     xpValue: 10,
     criteria: { type: 'lesson_count', count: 1 },
   },
   {
     name: 'Course Conqueror',
     description: 'Complete your first course',
     category: BadgeCategory.COMPLETION,
     tier: BadgeTier.SILVER,
     xpValue: 100,
     criteria: { type: 'course_completion', count: 1 },
   },
   {
     name: 'Learning Legend',
     description: 'Complete 5 courses',
     category: BadgeCategory.COMPLETION,
     tier: BadgeTier.GOLD,
     xpValue: 500,
     criteria: { type: 'course_completion', count: 5 },
   },

   // Streak badges
   {
     name: 'Week Warrior',
     description: '7-day attendance streak',
     category: BadgeCategory.STREAK,
     tier: BadgeTier.BRONZE,
     xpValue: 50,
     criteria: { type: 'attendance_streak', days: 7 },
   },
   {
     name: 'Month Master',
     description: '30-day attendance streak',
     category: BadgeCategory.STREAK,
     tier: BadgeTier.SILVER,
     xpValue: 200,
     criteria: { type: 'attendance_streak', days: 30 },
   },
   {
     name: 'Dedication Champion',
     description: '100-day attendance streak',
     category: BadgeCategory.STREAK,
     tier: BadgeTier.PLATINUM,
     xpValue: 1000,
     criteria: { type: 'attendance_streak', days: 100 },
   },

   // Mastery badges
   {
     name: 'Perfect Score',
     description: 'Get 100% on a quiz',
     category: BadgeCategory.MASTERY,
     tier: BadgeTier.GOLD,
     xpValue: 50,
     criteria: { type: 'quiz_perfect', count: 1 },
   },
   {
     name: 'Quiz Master',
     description: 'Get 100% on 10 quizzes',
     category: BadgeCategory.MASTERY,
     tier: BadgeTier.PLATINUM,
     xpValue: 500,
     criteria: { type: 'quiz_perfect', count: 10 },
   },

   // Social badges
   {
     name: 'Helpful Friend',
     description: 'Help 5 classmates',
     category: BadgeCategory.SOCIAL,
     tier: BadgeTier.SILVER,
     xpValue: 25,
     criteria: { type: 'peer_help', count: 5 },
   },
   {
     name: 'Team Player',
     description: 'Participate in 10 group activities',
     category: BadgeCategory.SOCIAL,
     tier: BadgeTier.GOLD,
     xpValue: 100,
     criteria: { type: 'group_activity', count: 10 },
   },

   // Special badges
   {
     name: 'Early Adopter',
     description: 'One of the first 100 users',
     category: BadgeCategory.SPECIAL,
     tier: BadgeTier.PLATINUM,
     xpValue: 100,
     criteria: { type: 'user_id_range', max: 100 },
   },
 ];

 export async function seedBadges() {
   console.log('🎖️   Seeding badge definitions...')

   for (const badge of BADGE_DEFINITIONS) {
     await prisma.badgeDefinition.upsert({
       where: { name: badge.name },
       update: badge,
       create: badge,
     });
   }

   console.log(`✅ Seeded ${BADGE_DEFINITIONS.length} badge definitions`);
 }

 // Run if called directly
 if (require.main === module) {
   seedBadges()
     .catch((e) => {
       console.error(e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
 }

 Update prisma/seed.ts to include badge seeding:
 // Add import at top
 import { seedBadges } from './seeds/badges';

 // Add to main() function
 await seedBadges();

 ---
 9. Design System Test Page

 File: app/design-test/page.tsx (NEW)

 'use client';

 import { useTheme } from '@/contexts/ThemeContext';

 export default function DesignTestPage() {
   const { tier, setTier, accessibilityMode, setAccessibilityMode } = useTheme();

   return (
     <div className="container mx-auto px-4 py-8">
       <h1 className="text-4xl font-bold mb-8 text-primary">
         AetherLearn Design System Test
       </h1>

       {/* Age Tier Selector */}
       <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
         <h2 className="text-2xl font-semibold mb-4">Age Tier: {tier}</h2>
         <div className="flex gap-4">
           <button
             onClick={() => setTier('tier1')}
             className={`px-6 py-3 rounded-lg font-semibold transition ${
               tier === 'tier1'
                 ? 'bg-primary text-white'
                 : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium'
             }`}
           >
             Tier 1 (5-8)
           </button>
           <button
             onClick={() => setTier('tier2')}
             className={`px-6 py-3 rounded-lg font-semibold transition ${
               tier === 'tier2'
                 ? 'bg-primary text-white'
                 : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium'
             }`}
           >
             Tier 2 (9-13)
           </button>
           <button
             onClick={() => setTier('tier3')}
             className={`px-6 py-3 rounded-lg font-semibold transition ${
               tier === 'tier3'
                 ? 'bg-primary text-white'
                 : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium'
             }`}
           >
             Tier 3 (14+)
           </button>
         </div>
       </section>

       {/* Accessibility Mode Selector */}
       <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
         <h2 className="text-2xl font-semibold mb-4">
           Accessibility Mode: {accessibilityMode}
         </h2>
         <div className="flex gap-4 flex-wrap">
           {(['default', 'dyslexia', 'focus', 'calm', 'high-contrast'] as const).map((mode) => (
             <button
               key={mode}
               onClick={() => setAccessibilityMode(mode)}
               className={`px-6 py-3 rounded-lg font-semibold transition ${
                 accessibilityMode === mode
                   ? 'bg-primary text-white'
                   : 'bg-neutral-light text-neutral-dark hover:bg-neutral-medium'
               }`}
             >
               {mode.charAt(0).toUpperCase() + mode.slice(1)}
             </button>
           ))}
         </div>
       </section>

       {/* Color Palette */}
       <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
         <h2 className="text-2xl font-semibold mb-4">Color Palette</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="p-6 bg-primary text-white rounded-lg shadow">Primary</div>
           <div className="p-6 bg-primary-light text-white rounded-lg shadow">Primary Light</div>
           <div className="p-6 bg-accent-warm text-white rounded-lg shadow">Accent Warm</div>
           <div className="p-6 bg-accent-coral text-white rounded-lg shadow">Accent Coral</div>
           <div className="p-6 bg-success text-white rounded-lg shadow">Success</div>
           <div className="p-6 bg-warning text-white rounded-lg shadow">Warning</div>
           <div className="p-6 bg-error text-white rounded-lg shadow">Error</div>
           <div className="p-6 bg-neutral-light text-neutral-dark rounded-lg shadow border">Neutral</div>
         </div>
       </section>

       {/* Typography Scale */}
       <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
         <h2 className="text-2xl font-semibold mb-4">Typography Scale</h2>
         <div className="space-y-4">
           <p className="text-tier1-heading font-bold">Tier 1 Heading (32px)</p>
           <p className="text-tier1-body">Tier 1 Body (20px, line-height 1.75)</p>
           <p className="text-tier2-heading font-bold">Tier 2 Heading (28px)</p>
           <p className="text-tier2-body">Tier 2 Body (18px, line-height 1.6)</p>
           <p className="text-tier3-heading font-bold">Tier 3 Heading (24px)</p>
           <p className="text-tier3-body">Tier 3 Body (16px, line-height 1.5)</p>
         </div>
       </section>

       {/* Button Variants */}
       <section className="mb-12 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
         <h2 className="text-2xl font-semibold mb-4">Button Variants</h2>
         <div className="flex gap-4 flex-wrap">
           <button className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition">
             Primary
           </button>
           <button className="px-6 py-3 bg-success hover:bg-success-dark text-white rounded-lg transition">
             Success
           </button>
           <button className="px-6 py-3 bg-warning hover:bg-warning-dark text-white rounded-lg transition">
             Warning
           </button>
           <button className="px-6 py-3 bg-error hover:bg-error-dark text-white rounded-lg transition">
             Error
           </button>
           <button className="px-6 py-3 bg-neutral-light hover:bg-neutral-medium text-neutral-dark rounded-lg transition">
             Neutral
           </button>
         </div>
       </section>
     </div>
   );
 }

 ---
 Deployment Procedure

 Step 1: Database Backup

 # Create timestamped backup
 pg_dump $DATABASE_URL > backups/backup_pre_phase1_$(date +%Y%m%d_%H%M%S).sql

 # Verify backup file exists and has content
 ls -lh backups/backup_pre_phase1_*.sql

 Step 2: Schema Updates

 # Generate Prisma client with new models
 npm run db:generate

 # Push schema changes to database (additive only)
 npm run db:push

 # Verify new tables and fields exist
 npx prisma studio
 # Check: User has dateOfBirth, ageTier fields
 # Check: New tables exist (XPTransaction, BadgeDefinition, etc.)

 Step 3: Seed Badge Definitions

 # Run badge seeding
 npm run db:seed

 # Or seed badges only
 npx tsx prisma/seeds/badges.ts

 Step 4: Build & Deploy

 # Build Next.js application
 npm run build

 # Deploy using automated script
 ./scripts/build-and-deploy.sh

 # Or manual PM2 restart
 pm2 restart lms-nextjs

 Step 5: Verify Deployment

 # Run health check
 ./scripts/health-check.sh

 # Check logs for errors
 pm2 logs lms-nextjs --lines 100

 # Test critical pages
 # - Login: https://lms.gagneet.com/login
 # - Student dashboard: https://lms.gagneet.com/dashboard/student
 # - Design test: https://lms.gagneet.com/design-test

 ---
 Testing Checklist

 Pre-Deployment Tests (Local)

 - npm run build succeeds without errors
 - Database schema push completes without errors
 - Prisma Studio shows new fields/tables
 - Badge definitions seeded successfully (11 badges)
 - Existing pages render without errors
 - Design test page (/design-test) renders and functions
 - Theme switching works (data attributes update)
 - Accessibility modes apply CSS correctly

 Post-Deployment Tests (Production)

 - Health check passes (./scripts/health-check.sh)
 - Login works with existing credentials
 - Student dashboard loads correctly
 - Tutor dashboard loads correctly
 - Supervisor dashboard loads correctly
 - Admin pages load correctly
 - No console errors on any dashboard
 - Database queries don't error on null new fields
 - PM2 shows no crashes or restarts

 Verification Queries

 -- Verify User model extended
 SELECT id, email, ageTier, dateOfBirth FROM "User" LIMIT 5;

 -- Verify new tables exist
 SELECT COUNT(*) FROM "XPTransaction";
 SELECT COUNT(*) FROM "BadgeDefinition";
 SELECT COUNT(*) FROM "BadgeAward";
 SELECT COUNT(*) FROM "Streak";
 SELECT COUNT(*) FROM "LeaderboardOptIn";

 -- Verify badge definitions seeded
 SELECT id, name, category, tier FROM "BadgeDefinition";

 ---
 Rollback Strategy

 If Issues Occur

 Database Rollback:
 # Restore from backup
 psql $DATABASE_URL < backups/backup_pre_phase1_YYYYMMDD_HHMMSS.sql

 Code Rollback:
 # Use automated rollback script
 ./scripts/rollback.sh latest

 # Or manual git revert
 git log --oneline -5  # Find commit hash
 git revert <commit-hash>
 npm run build
 pm2 restart lms-nextjs

 Partial Rollback (keep database, revert code only):
 git checkout HEAD~1 -- tailwind.config.ts app/layout.tsx app/globals.css
 rm -rf app/fonts.ts contexts/ThemeContext.tsx lib/design/
 npm run build
 pm2 restart lms-nextjs

 ---
 What This Enables (Without Breaking Anything)

 After Phase 1 deployment:

 ✅ Database Ready
 - Age-tier classification infrastructure
 - Enhanced gamification tracking (XP transactions, badge awards, streaks)
 - 11 pre-defined badges ready to award
 - All existing data untouched

 ✅ Design System Foundation
 - AetherLearn color palette available (primary teal, accent warm/coral, status colors)
 - Web fonts loaded (Lexend, Inter, Atkinson Hyperlegible)
 - CSS custom properties for age-tier adaptation
 - Accessibility mode CSS ready

 ✅ Theme Context Available
 - Opt-in theme provider with safe fallbacks
 - Age-tier switching system
 - Accessibility mode toggling
 - LocalStorage persistence

 ✅ Testing Infrastructure
 - Design system test page at /design-test
 - Visual verification of all color/typography/tier variants

 ✅ Backwards Compatibility
 - All existing dashboards work unchanged
 - All existing APIs function normally
 - No adoption required until ready
 - Zero breaking changes

 ---
 Next Steps (Phase 2 - Week 3-4)

 After Phase 1 is stable:

 1. Enhanced Gamification APIs
   - POST /api/gamification/xp/award - Award XP with transaction logging
   - POST /api/gamification/badges/award - Award badges from definitions
   - GET /api/gamification/streaks/[userId] - Fetch streak data
   - POST /api/gamification/streaks/update - Update streak on activity
 2. Badge Awarding Logic
   - Auto-award "First Steps" on first lesson completion
   - Auto-award streak badges at milestones
   - Manual badge awarding by teachers
 3. Component Library
   - Create age-tier aware Button component
   - Create Card component with tier variants
   - Create Badge display component
   - Create XP/Level display component
 4. Dashboard Enhancements
   - Add XP/level display to student dashboard
   - Add badge showcase section
   - Add streak flame visualization
   - Add theme/accessibility selector UI

 ---
 Critical Files Modified

 1. prisma/schema.prisma - User model extended, 5 new models added
 2. tailwind.config.ts - Extended with AetherLearn design tokens
 3. app/globals.css - Added CSS custom properties and accessibility modes
 4. app/fonts.ts - NEW: Font loading via next/font
 5. app/layout.tsx - Font variables added to html element
 6. contexts/ThemeContext.tsx - NEW: Theme provider with safe fallbacks
 7. lib/design/age-tiers.ts - NEW: Age-tier utility functions
 8. prisma/seeds/badges.ts - NEW: Badge seeding script
 9. app/design-test/page.tsx - NEW: Design system test page

 ---
 Success Criteria

 Phase 1 is successful when:

 - All database changes deployed without errors
 - All existing dashboards continue functioning
 - Design test page renders correctly
 - Badge definitions seeded (11 total)
 - No production errors in PM2 logs
 - Health check passes
 - Theme switching works on test page
 - Existing user logins work unchanged
 - Ready for Phase 2 gamification APIs