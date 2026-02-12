# AetherLearn UX/Design Implementation Roadmap

## Executive Summary

This document outlines the implementation strategy for AetherLearn's age-adaptive, accessibility-first design system based on the comprehensive UX research document. The approach builds on the existing Phase 1 foundation while introducing industry-leading patterns that no competitor has successfully unified in a single platform.

## Core Design Principles

1. **Age Adaptation Through Theming** - Not separate apps
2. **Layered, Research-Backed Gamification** - XP, badges, streaks with safety nets
3. **Paper-to-Digital Bridge** - QR codes + annotation workflow
4. **Accessibility as First-Class Features** - 4 toggleable modes
5. **Purpose-Built Role Dashboards** - Show only what matters per role

---

## Phase 1: Design System Foundation (2-3 weeks)

### 1.1 Color System Implementation

**Files to Create:**
- `lib/design/colors.ts` - Color palette with WCAG compliance
- `app/globals.css` - CSS custom properties for theming
- `tailwind.config.ts` - Extended color palette

**Core Palette (WCAG AA Compliant):**
```typescript
export const colors = {
  primary: {
    DEFAULT: '#0D7377', // Deep Teal
    light: '#14919B',   // Soft Teal
    dark: '#085558',    // Darker Teal
  },
  accent: {
    warm: '#F59E0B',    // Amber
    coral: '#EF6461',   // Warm Coral
  },
  success: '#059669',   // Forest Green
  warning: '#D97706',   // Golden
  error: '#DC2626',     // Deep Red
  neutral: {
    dark: '#1E293B',    // Charcoal (body text)
    medium: '#64748B',  // Slate (secondary text)
    light: '#F1F5F9',   // Cloud (backgrounds)
  },
  surface: '#FFFFFF',
};
```

**Implementation Steps:**
1. Update Tailwind config with new palette
2. Create CSS variables for runtime theme switching
3. Add dark mode variants (for future)
4. Document color usage guidelines
5. Create color accessibility checker utility

**Priority**: HIGH - Foundation for all visual work
**Estimated Time**: 3-4 days

### 1.2 Typography System

**Files to Create:**
- `app/fonts.ts` - Font loading with next/font
- `lib/design/typography.ts` - Type scale definitions
- `components/Typography.tsx` - Semantic text components

**Font Stack:**
- **Primary**: Lexend (Variable font from Google Fonts)
- **Alternative**: Inter (UI-optimized)
- **Accessibility**: Atkinson Hyperlegible (toggle option)

**Age-Tier Font Sizing:**
```typescript
export const typographyTiers = {
  tier1: { // Ages 5-8
    body: '20px',
    heading: '32px',
    lineHeight: 1.75,
  },
  tier2: { // Ages 9-13
    body: '18px',
    heading: '28px',
    lineHeight: 1.6,
  },
  tier3: { // Ages 14+ / Adult
    body: '16px',
    heading: '24px',
    lineHeight: 1.5,
  },
};
```

**Implementation Steps:**
1. Load Lexend and Inter via next/font
2. Create Typography component with tier variants
3. Add font-switching for accessibility modes
4. Update all existing text to use Typography component
5. Document typography usage patterns

**Priority**: HIGH - Foundation for all text
**Estimated Time**: 2-3 days

### 1.3 Age-Tier Theme System

**Files to Create:**
- `lib/design/age-tiers.ts` - Tier definitions and logic
- `contexts/ThemeContext.tsx` - Theme provider
- `components/ThemeSelector.tsx` - Admin override UI
- `hooks/useAgeTier.ts` - Hook for accessing current tier

**Theme Tier Structure:**
```typescript
export interface AgeTier {
  id: 'tier1' | 'tier2' | 'tier3';
  ageRange: string;
  navigationStyle: 'icon-only' | 'icon-text' | 'full-nav';
  textDensity: 'minimal' | 'moderate' | 'standard';
  visualStyle: 'playful' | 'structured' | 'professional';
  contentLayout: 'single' | 'sequential' | 'multi-panel';
  feedbackStyle: 'animated' | 'visual-audio' | 'subtle';
  interactionMode: 'simple' | 'guided' | 'advanced';
}
```

**Implementation Steps:**
1. Create tier definitions in database (User.ageTier field)
2. Build ThemeContext for runtime tier switching
3. Create tier-aware component variants
4. Add supervisor override interface
5. Update user profile to set/edit tier

**Priority**: HIGH - Core differentiation feature
**Estimated Time**: 5-7 days

---

## Phase 2: Accessibility Modes (2 weeks)

### 2.1 Dyslexia Mode

**Features:**
- Font switch to Lexend (or Atkinson Hyperlegible)
- Increased letter spacing (0.12× font size)
- Line height 1.75×
- Cream/off-white backgrounds (#FDF6E3)
- Left-aligned text only
- Syllable breaking (optional)
- Text-to-speech integration

**Files to Create:**
- `components/accessibility/DyslexiaMode.tsx`
- `lib/accessibility/text-to-speech.ts`
- `styles/dyslexia.css` - Mode-specific overrides

**Implementation:**
```typescript
export const dyslexiaSettings = {
  fontFamily: 'Lexend, Atkinson Hyperlegible',
  letterSpacing: '0.12em',
  lineHeight: '1.75',
  backgroundColor: '#FDF6E3',
  textAlign: 'left',
  hyphenation: 'none',
};
```

**Priority**: HIGH - Critical accessibility feature
**Estimated Time**: 4-5 days

### 2.2 Focus Mode (ADHD-Friendly)

**Features:**
- Hide non-essential UI elements
- Increased whitespace
- Single task at a time (chunked content)
- Pomodoro timer with gamified breaks
- Immediate micro-interaction feedback
- Confetti/sound effects on completion

**Files to Create:**
- `components/accessibility/FocusMode.tsx`
- `components/PomodoroTimer.tsx`
- `lib/animations/micro-interactions.ts`

**Implementation:**
```typescript
export const focusModeSettings = {
  hideSecondaryNav: true,
  hideSidebar: true,
  chunkSize: 'single', // One task at a time
  whitespaceFactor: 1.5,
  showTimer: true,
  timerDuration: 25, // minutes
  breakDuration: 5,
  feedbackType: 'immediate',
};
```

**Priority**: MEDIUM - Important for ADHD learners
**Estimated Time**: 3-4 days

### 2.3 Calm Mode (Autism-Friendly)

**Features:**
- Simple, consistent layouts
- Muted color palettes
- No auto-playing media
- No unpredictable transitions
- Text labels on all icons
- Visual schedules (first-then boards)
- Save-and-return everywhere

**Files to Create:**
- `components/accessibility/CalmMode.tsx`
- `components/VisualSchedule.tsx`
- `styles/calm.css`

**Implementation:**
```typescript
export const calmModeSettings = {
  colorSaturation: 0.5, // Muted colors
  animations: 'none',
  autoplay: false,
  transitionSpeed: 'slow',
  iconLabels: 'always',
  predictability: 'high',
  saveStateFrequency: 'aggressive', // Every action
};
```

**Priority**: MEDIUM - Important for autism spectrum
**Estimated Time**: 3-4 days

### 2.4 High Contrast Mode

**Features:**
- WCAG AAA contrast ratios (7:1)
- User-selectable schemes (dark/light)
- Minimum 4.5:1 for normal text
- Bold text weights
- Thick borders
- Screen reader optimization

**Files to Create:**
- `components/accessibility/HighContrastMode.tsx`
- `styles/high-contrast.css`

**Priority**: MEDIUM - Required for visual impairments
**Estimated Time**: 2-3 days

---

## Phase 3: Gamification System (3 weeks)

### 3.1 XP System

**Database Schema Updates:**
```prisma
model XPTransaction {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  amount      Int      // XP earned
  source      XPSource // LESSON, HOMEWORK, QUIZ, ATTENDANCE, READING
  sourceId    String   // ID of the activity
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
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

// Update existing GamificationProfile
model GamificationProfile {
  // ... existing fields ...
  
  totalXP     Int      @default(0)
  level       Int      @default(1)
  nextLevelXP Int      @default(100)
}
```

**Files to Create:**
- `app/api/gamification/xp/route.ts` - Award XP API
- `lib/gamification/xp-calculator.ts` - XP calculation logic
- `lib/gamification/level-progression.ts` - Level up logic
- `components/gamification/XPDisplay.tsx` - XP UI component
- `components/gamification/LevelUpAnimation.tsx` - Celebration

**XP Award Schedule:**
```typescript
export const XP_AWARDS = {
  LESSON_COMPLETION: 10,
  HOMEWORK_SUBMISSION: 15,
  HOMEWORK_ONTIME_BONUS: 5,
  SESSION_ATTENDANCE: 20,
  QUIZ_COMPLETION: 10,
  QUIZ_PERFECT_BONUS: 10,
  READING_10MIN: 5,
  HELPING_PEER: 10,
  STREAK_WEEKLY: 50,
  STREAK_MONTHLY: 200,
};

export const LEVEL_PROGRESSION = {
  1: 100,    // Level 1 → 2
  2: 250,    // Level 2 → 3
  3: 500,    // Level 3 → 4
  // ... exponential growth
};
```

**Priority**: HIGH - Core engagement mechanic
**Estimated Time**: 5-6 days

### 3.2 Badge System

**Database Schema:**
```prisma
model BadgeDefinition {
  id          String     @id @default(cuid())
  name        String
  description String
  category    BadgeCategory
  tier        BadgeTier
  iconUrl     String
  xpValue     Int
  criteria    Json       // Conditions to earn
  
  awards      BadgeAward[]
  
  @@index([category])
}

enum BadgeCategory {
  COMPLETION  // Finishing units
  STREAK      // Consecutive activities
  MASTERY     // Demonstrating proficiency
  SOCIAL      // Helping peers, group work
}

enum BadgeTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

model BadgeAward {
  id              String           @id @default(cuid())
  userId          String
  user            User             @relation(fields: [userId], references: [id])
  badgeId         String
  badge           BadgeDefinition  @relation(fields: [badgeId], references: [id])
  awardedAt       DateTime         @default(now())
  
  @@unique([userId, badgeId])
  @@index([userId])
  @@index([awardedAt])
}
```

**Files to Create:**
- `app/api/gamification/badges/route.ts` - Badge management
- `lib/gamification/badge-criteria.ts` - Badge unlock logic
- `components/gamification/BadgeDisplay.tsx` - Badge UI
- `components/gamification/BadgeUnlockAnimation.tsx` - Celebration

**Badge Examples:**
- **First Steps** (Bronze) - Complete first lesson
- **Week Warrior** (Silver) - Attend 5 consecutive sessions
- **Perfect Score** (Gold) - Get 100% on quiz
- **Master Mathematician** (Platinum) - Complete all math units with 90%+
- **Helpful Friend** (Social) - Help 5 classmates

**Priority**: HIGH - Core gamification feature
**Estimated Time**: 4-5 days

### 3.3 Streak System

**Database Schema:**
```prisma
model Streak {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  type            StreakType
  currentStreak   Int      @default(0)
  longestStreak   Int      @default(0)
  lastActivityAt  DateTime @default(now())
  freezesAvailable Int     @default(1)
  
  @@index([userId])
  @@index([type])
}

enum StreakType {
  ATTENDANCE    // Weekly attendance
  HOMEWORK      // On-time homework
  READING       // Daily reading
  LOGIN         // Daily login
}
```

**Streak Safety Nets:**
- **Streak Freeze**: Pre-equipped insurance (1 free, more purchasable with XP)
- **Weekend Passes**: Saturday/Sunday don't count
- **Streak Repair**: Restore within 24 hours (costs XP)

**Files to Create:**
- `app/api/gamification/streaks/route.ts` - Streak management
- `lib/gamification/streak-calculator.ts` - Streak logic
- `components/gamification/StreakDisplay.tsx` - Flame icon + counter
- `components/gamification/StreakAnimation.tsx` - Milestone celebrations

**Priority**: HIGH - Most powerful engagement mechanic
**Estimated Time**: 4-5 days

### 3.4 Leaderboards (Opt-In)

**Database Schema:**
```prisma
model LeaderboardEntry {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  scope     String   // "class-123", "centre-456", "global"
  metric    String   // "xp", "badges", "streaks"
  value     Int
  rank      Int
  period    String   // "weekly", "monthly", "all-time"
  updatedAt DateTime @updatedAt
  
  @@unique([userId, scope, metric, period])
  @@index([scope, metric, period, rank])
}

model LeaderboardOptIn {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  enabled   Boolean  @default(false)
  scope     String   @default("class") // "class", "centre", "global"
}
```

**Features:**
- Strictly opt-in
- Class-based (not global by default)
- Show only ±3 positions around user
- Team leaderboards available
- Personal best tracking as default

**Files to Create:**
- `app/api/gamification/leaderboards/route.ts`
- `components/gamification/Leaderboard.tsx`
- `components/gamification/PersonalBest.tsx`

**Priority**: MEDIUM - Optional engagement feature
**Estimated Time**: 3-4 days

---

## Phase 4: Paper-to-Digital Workflow (2-3 weeks)

### 4.1 QR Code Generation & Scanning

**Database Schema:**
```prisma
model WorksheetQR {
  id          String   @id @default(cuid())
  code        String   @unique // Short ID: "TC:S0234:A0042"
  studentId   String
  student     User     @relation(fields: [studentId], references: [id])
  assignmentId String
  assignment  Assignment @relation(fields: [assignmentId], references: [id])
  sessionId   String?
  session     Session? @relation(fields: [sessionId], references: [id])
  createdAt   DateTime @default(now())
  scannedAt   DateTime?
  scannedById String?
  scannedBy   User?    @relation(fields: [scannedById], references: [id])
  
  @@index([code])
  @@index([studentId])
}
```

**Files to Create:**
- `lib/qr/generator.ts` - QR generation (server-side with qrcode)
- `app/api/qr/generate/route.ts` - Batch QR generation API
- `components/qr/Scanner.tsx` - Camera scanner (html5-qrcode)
- `components/qr/BatchScanner.tsx` - Multi-worksheet scanning
- `app/worksheets/print/[id]/page.tsx` - Printable worksheet with QR

**QR Encoding Format:**
```typescript
// Compact format: TC:StudentID:AssignmentID
// Example: TC:S0234:A0042
export function encodeWorksheetQR(
  studentId: string,
  assignmentId: string
): string {
  return `TC:${studentId}:${assignmentId}`;
}
```

**Scanning UX:**
1. Camera opens with targeting frame overlay
2. Successful scan: haptic vibration + green flash
3. Display: Student name + Assignment for verification
4. "Capture Photo" button
5. Photo uploads and auto-links to profile

**Priority**: HIGH - Key differentiator
**Estimated Time**: 6-8 days

### 4.2 Annotation System

**Database Schema:**
```prisma
model ScannedWork {
  id            String   @id @default(cuid())
  studentId     String
  student       User     @relation(fields: [studentId], references: [id])
  assignmentId  String
  assignment    Assignment @relation(fields: [assignmentId], references: [id])
  worksheetQRId String?
  worksheetQR   WorksheetQR? @relation(fields: [worksheetQRId], references: [id])
  originalUrl   String   // Original photo
  annotatedUrl  String?  // Annotated version
  annotations   Json     // Fabric.js JSON
  tutorId       String
  tutor         User     @relation(fields: [tutorId], references: [id])
  status        WorkStatus @default(PENDING_REVIEW)
  scannedAt     DateTime @default(now())
  reviewedAt    DateTime?
  releasedAt    DateTime?
  
  @@index([studentId])
  @@index([tutorId])
  @@index([status])
}

enum WorkStatus {
  PENDING_REVIEW
  IN_REVIEW
  REVIEWED
  RELEASED
}
```

**Files to Create:**
- `lib/annotation/fabric-setup.ts` - Fabric.js initialization
- `components/annotation/AnnotationCanvas.tsx` - Main canvas
- `components/annotation/AnnotationToolbar.tsx` - Tools UI
- `components/annotation/StampLibrary.tsx` - Reusable stamps
- `app/api/annotations/[id]/route.ts` - Save/load annotations

**Annotation Tools:**
```typescript
export const ANNOTATION_TOOLS = {
  PEN: { color: '#DC2626', width: 2 },
  HIGHLIGHTER: { opacity: 0.3, width: 20 },
  TEXT: { fontSize: 16, fontFamily: 'Lexend' },
  STAMP: { library: ['checkmark', 'cross', 'star', 'well-done'] },
  COMMENT: { type: 'bubble', maxLength: 500 },
  VOICE: { maxDuration: 180 }, // 3 minutes
  ERASER: { mode: 'annotation-only' },
};
```

**Fabric.js Integration:**
```typescript
import { fabric } from 'fabric';

export function initAnnotationCanvas(
  canvasElement: HTMLCanvasElement,
  imageUrl: string
) {
  const canvas = new fabric.Canvas(canvasElement);
  
  // Load base image
  fabric.Image.fromURL(imageUrl, (img) => {
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
  });
  
  // Enable drawing mode
  canvas.isDrawingMode = true;
  canvas.freeDrawingBrush.color = '#DC2626';
  canvas.freeDrawingBrush.width = 2;
  
  return canvas;
}

export function saveAnnotations(canvas: fabric.Canvas) {
  return JSON.stringify(canvas.toJSON());
}

export function loadAnnotations(canvas: fabric.Canvas, json: string) {
  canvas.loadFromJSON(json, canvas.renderAll.bind(canvas));
}
```

**Priority**: HIGH - Key differentiator
**Estimated Time**: 8-10 days

---

## Phase 5: Enhanced Dashboards (3-4 weeks)

### 5.1 Student "My Day" Dashboard

**Components:**
```
StudentDashboard
├── MyDayPanel (today's sessions, pending homework, next action CTA)
├── ProgressVisualization (path for Tier 1, mastery bars for Tier 3)
├── AchievementShelf (3-5 recent badges, XP display, level)
├── HomeworkTracker (color-coded status, streak counter)
├── CatchUpQueue (overdue catch-ups prominently displayed)
└── StreakDisplay (flame icon with counter)
```

**Files to Create:**
- `app/dashboard/student/page.tsx` - Main dashboard (enhanced)
- `components/dashboard/MyDayPanel.tsx`
- `components/dashboard/ProgressPath.tsx` - For Tier 1 (visual journey)
- `components/dashboard/MasteryDashboard.tsx` - For Tier 3 (skill bars)
- `components/dashboard/AchievementShelf.tsx`
- `components/dashboard/HomeworkTracker.tsx`
- `components/dashboard/StreakFlame.tsx`

**My Day Panel Logic:**
```typescript
export async function getMyDayData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [sessions, homework, catchups] = await Promise.all([
    // Today's sessions
    prisma.session.findMany({
      where: {
        startDate: { gte: today, lt: tomorrow },
        classCohort: {
          members: {
            some: { studentId: userId, status: 'ACTIVE' },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    }),
    
    // Pending homework
    prisma.homework.findMany({
      where: {
        studentId: userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { gte: today },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
    
    // Overdue catch-ups
    prisma.catchUpPackage.findMany({
      where: {
        studentId: userId,
        status: 'OVERDUE',
      },
      orderBy: { dueDate: 'asc' },
    }),
  ]);
  
  // Determine next action
  const nextAction = sessions[0]
    ? { type: 'SESSION', data: sessions[0] }
    : homework[0]
    ? { type: 'HOMEWORK', data: homework[0] }
    : catchups[0]
    ? { type: 'CATCHUP', data: catchups[0] }
    : null;
  
  return { sessions, homework, catchups, nextAction };
}
```

**Priority**: HIGH - Most important user-facing page
**Estimated Time**: 6-8 days

### 5.2 Tutor "Mission Control" Dashboard

**Components:**
```
TutorDashboard
├── MyDayPanel (today's sessions, marking queue, at-risk alerts)
├── SessionSchedule (calendar view with student names)
├── MarkingQueue (ungraded work count, quick access)
├── AtRiskStudents (traffic-light coded: red/amber/green)
├── QuickActions (start session, upload content, message parent)
└── StudentAnalytics (progress charts, attendance patterns)
```

**Features:**
- Split-pane grading interface (Canvas SpeedGrader pattern)
- Real-time marking with annotation tools
- Quick student lookup
- Attendance marking from session view
- Auto-generate catch-ups on ABSENT marking

**Files to Create:**
- `app/dashboard/tutor/page.tsx` - Enhanced (already exists, needs upgrade)
- `components/dashboard/tutor/MyDayPanel.tsx`
- `components/dashboard/tutor/MarkingQueue.tsx`
- `components/dashboard/tutor/AtRiskAlerts.tsx`
- `components/dashboard/tutor/QuickGrader.tsx` - Split-pane interface
- `components/dashboard/tutor/StudentAnalytics.tsx`

**Priority**: HIGH - Critical for tutor workflow
**Estimated Time**: 6-8 days

### 5.3 Centre Admin Dashboard

**KPI Cards (Max 5-6):**
- Today's session count
- Attendance rate (with trend arrow)
- Outstanding invoice total
- Tutor utilization %
- At-risk student count
- Revenue this month

**Tabbed Sections:**
- Financial Overview
- Tutor Allocation (calendar with conflict detection)
- Capacity Management
- Attendance Trends (heatmap)

**Files to Create:**
- `app/dashboard/admin/page.tsx`
- `components/dashboard/admin/KPICard.tsx`
- `components/dashboard/admin/FinancialOverview.tsx`
- `components/dashboard/admin/TutorAllocation.tsx`
- `components/dashboard/admin/CapacityManagement.tsx`
- `components/dashboard/admin/AttendanceHeatmap.tsx`

**Priority**: MEDIUM - Admin efficiency
**Estimated Time**: 5-7 days

### 5.4 Parent Portal

**Features:**
- Child selector (for multiple children)
- Attendance calendar (color-coded)
- Progress view (grades, skill development)
- Invoice/payment tracking
- Direct messaging with tutors
- Notification preferences

**Files to Create:**
- `app/dashboard/parent/page.tsx`
- `components/dashboard/parent/ChildSelector.tsx`
- `components/dashboard/parent/AttendanceCalendar.tsx`
- `components/dashboard/parent/ProgressView.tsx`
- `components/dashboard/parent/InvoiceTracker.tsx`
- `components/dashboard/parent/MessagingPanel.tsx`

**Priority**: MEDIUM - Parent engagement
**Estimated Time**: 4-5 days

---

## Phase 6: Visual Identity & Branding (1-2 weeks)

### 6.1 Logo & Mascot Design

**Deliverables:**
- AetherLearn logo (SVG, multiple sizes)
- Platform mascot character (3 variants for age tiers)
- Favicon and app icons
- Loading animations
- Mascot animations (Rive format)

**Mascot Characteristics:**
- Rounded, friendly shape (Duolingo Duo pattern)
- Expressive face for feedback
- Adaptable presentation:
  - Tier 1: Large, animated, prominent
  - Tier 2: Present but smaller
  - Tier 3: Icon/avatar only

**Files to Create:**
- `public/logos/` - Logo assets
- `public/mascot/` - Mascot sprites/animations
- `components/branding/Logo.tsx`
- `components/branding/Mascot.tsx`
- `components/branding/LoadingAnimation.tsx`

**Priority**: MEDIUM - Visual identity
**Estimated Time**: External design work + 2-3 days integration

### 6.2 Illustration Library

**Components Needed:**
- Empty state illustrations
- Error state illustrations
- Success celebration graphics
- Badge/achievement icons
- Activity type icons
- Subject-specific illustrations

**Style Guide:**
- Minimal details (Duolingo philosophy)
- Three fundamental shapes (rounded rect, circle, rounded triangle)
- Consistent color palette
- Age-tier appropriate complexity

**Files to Create:**
- `components/illustrations/EmptyState.tsx`
- `components/illustrations/ErrorState.tsx`
- `components/illustrations/SuccessCelebration.tsx`
- `public/illustrations/` - SVG assets

**Priority**: MEDIUM - UX polish
**Estimated Time**: External design work + 2-3 days integration

### 6.3 Micro-Animations

**Animation Library:**
```typescript
export const microAnimations = {
  // Correct answer
  correctAnswer: {
    type: 'confetti',
    duration: 1500,
    sound: '/sounds/success.mp3',
  },
  
  // Wrong answer
  wrongAnswer: {
    type: 'shake',
    duration: 500,
    sound: '/sounds/error.mp3',
  },
  
  // XP earned
  xpEarned: {
    type: 'float-up',
    duration: 2000,
    sound: '/sounds/xp-gain.mp3',
  },
  
  // Level up
  levelUp: {
    type: 'burst',
    duration: 3000,
    sound: '/sounds/level-up.mp3',
  },
  
  // Badge unlocked
  badgeUnlock: {
    type: 'scale-bounce',
    duration: 2000,
    sound: '/sounds/badge.mp3',
  },
  
  // Streak milestone
  streakMilestone: {
    type: 'flame-burst',
    duration: 2500,
    sound: '/sounds/streak.mp3',
  },
};
```

**Files to Create:**
- `lib/animations/micro-interactions.ts`
- `components/animations/Confetti.tsx`
- `components/animations/FloatUp.tsx`
- `components/animations/Shake.tsx`
- `components/animations/Burst.tsx`
- `public/sounds/` - Sound effect assets

**Priority**: MEDIUM - Engagement polish
**Estimated Time**: 4-5 days

---

## Phase 7: Component Library Consolidation (2 weeks)

### 7.1 Design System Documentation

**Create:**
- Component catalog (Storybook)
- Usage guidelines per component
- Age-tier variants documentation
- Accessibility testing results
- Code examples

**Files to Create:**
- `.storybook/` - Storybook configuration
- `components/**/*.stories.tsx` - Component stories
- `docs/design-system/` - Design system docs

**Priority**: MEDIUM - Developer efficiency
**Estimated Time**: 5-7 days

### 7.2 Shared Component Library

**Core Components (Age-Tier Aware):**
- Button (3 variants: large/medium/small)
- Card (clickable, status badges)
- Input (text, number, date, select)
- Modal/Dialog
- Notification/Toast
- Progress Bar
- Badge/Chip
- Navigation (sidebar/navbar/tabs)
- Avatar
- Loading Skeleton

**Files to Update/Create:**
- `components/ui/Button.tsx` - Enhanced with tier variants
- `components/ui/Card.tsx` - Enhanced with click handlers
- `components/ui/Input.tsx` - Age-appropriate sizing
- `components/ui/Modal.tsx` - Tier-appropriate complexity
- `components/ui/Navigation.tsx` - Adaptive navigation
- `components/ui/Progress.tsx` - Visual progress indicators
- `components/ui/Badge.tsx` - Status and achievement badges

**Priority**: HIGH - Consistency across app
**Estimated Time**: 6-8 days

---

## Implementation Priorities

### Must-Have for Beta Launch (8-10 weeks)
1. ✅ Color system & typography (Foundation)
2. ✅ Age-tier theme system (Core differentiator)
3. ✅ XP system (Core gamification)
4. ✅ Badge system (Core gamification)
5. ✅ Streak system (Engagement driver)
6. ✅ QR code generation & scanning (Key feature)
7. ✅ Annotation system (Key feature)
8. ✅ Student "My Day" dashboard (Critical UX)
9. ✅ Tutor "Mission Control" (Critical UX)
10. ✅ Dyslexia mode (Accessibility requirement)

### Should-Have for Full Launch (+4-6 weeks)
- Focus mode (ADHD support)
- Calm mode (Autism support)
- High contrast mode
- Leaderboards (opt-in)
- Centre admin dashboard
- Parent portal
- Logo & mascot
- Micro-animations
- Component library documentation

### Nice-to-Have for Future Releases
- Team leaderboards
- Advanced analytics
- AI-powered at-risk prediction
- Multi-language support
- Mobile app (React Native)
- Offline mode

---

## Success Metrics

Track these to measure UX/design success:

### Engagement Metrics
- Daily Active Users (DAU)
- Session duration
- Homework completion rate
- Streak retention rate
- Badge unlock rate
- XP earning patterns

### Accessibility Metrics
- Accessibility mode adoption rate
- Screen reader usage
- Font override usage
- Color scheme preferences

### Satisfaction Metrics
- Net Promoter Score (NPS) by role
- User satisfaction surveys
- Feature adoption rates
- Support ticket volume by feature

---

## Next Immediate Steps

### Week 1-2: Design Foundation
1. Set up color system in Tailwind
2. Configure Lexend/Inter fonts
3. Create age-tier context
4. Build ThemeProvider
5. Document color/typography usage

### Week 3-4: Gamification Core
1. Implement XP system
2. Build badge definitions
3. Create streak tracker
4. Add level progression
5. Build XP/badge/streak UI components

### Week 5-6: QR & Annotation
1. QR generation system
2. Camera scanning interface
3. Fabric.js annotation setup
4. Annotation toolbar
5. Save/load annotation workflow

### Week 7-8: Dashboard Enhancements
1. Enhance student dashboard
2. Upgrade tutor dashboard
3. Build admin dashboard basics
4. Create parent portal MVP

### Week 9-10: Accessibility & Polish
1. Dyslexia mode implementation
2. Focus mode implementation
3. Component library consolidation
4. Testing & bug fixes
5. Documentation updates

---

## Resources & Tools

### Design Tools
- **Figma** - UI/UX design & prototyping
- **Rive** - Character animations
- **Excalidraw** - Wireframing
- **Coolors** - Color palette generation
- **WebAIM Contrast Checker** - Accessibility testing

### Development Libraries
- **Fabric.js** - Canvas annotation
- **html5-qrcode** - QR scanning
- **qrcode** - QR generation
- **Framer Motion** - React animations
- **React Confetti** - Celebration effects
- **Howler.js** - Sound effects

### Testing Tools
- **Storybook** - Component development
- **Axe DevTools** - Accessibility testing
- **Lighthouse** - Performance & accessibility audits
- **BrowserStack** - Cross-browser testing

---

## Conclusion

This roadmap transforms AetherLearn into a truly age-adaptive, accessibility-first, gamified learning platform that no competitor has successfully unified. The implementation is phased to deliver core value quickly while maintaining flexibility for iteration based on user feedback.

**Key Success Factors:**
1. Start with design foundation (colors, typography, theming)
2. Implement gamification core early (high engagement impact)
3. Deliver QR/annotation workflow (key differentiator)
4. Enhance dashboards with real user data
5. Layer in accessibility modes progressively
6. Test extensively with real users at each age tier

**Estimated Total Timeline**: 16-20 weeks for full implementation
**Beta Launch Readiness**: 8-10 weeks
**Team Size**: 2-3 developers + 1 designer + 1 QA

---

**Document Version**: 1.0
**Last Updated**: {new Date().toISOString()}
**Status**: Ready for Implementation
