# AetherLearn LMS — Doc 2: Student Experience

**Student Portal, Age-Adaptive UI, Gamification Engine, and Progress Tracking**

Doc 2 of 6 · Links to: Tutor marking (Doc 3) → Parent visibility (Doc 4) → Supervisor oversight (Doc 4)

---

## 1. The Student's Core Journey

The student experience in AetherLearn differs fundamentally from traditional LMS platforms because **students do not choose courses or attend class-based lessons**. Instead, the student's journey is:

1. **Assessment** — An assessor evaluates the student's level per subject (English, Mathematics, Science, etc.) and assigns an `assessedGradeLevel` that may differ from their chronological class
2. **Enrolment** — A supervisor or admin enrols the student into tutoring session timeslots with a tutor
3. **Session attendance** — The student attends their scheduled sessions (physical or video), where they work on individually tailored exercises at their assessed level
4. **Exercise completion** — During and between sessions, the student works through exercises served by the content sequencing engine
5. **Homework** — Tutors assign homework activities based on the lesson covered during the session
6. **Progress** — As the student demonstrates mastery, their assessed level advances, unlocking higher-level content

The student portal must surface this journey clearly across three age tiers while driving engagement through gamification.

---

## 2. Age-Adaptive UI Architecture

### Three-Tier Theme System

Age tiers are set during account creation (by parents for under-13s per COPPA) and stored in the User model. Supervisors can override the tier. The tier determines which CSS custom properties (design tokens) are applied.

**Implementation — CSS Custom Properties with Tailwind:**

```typescript
// lib/config/age-tiers.ts
export const AGE_TIERS = {
  TIER_1: { // Ages 5-8
    minAge: 5, maxAge: 8,
    tokens: {
      '--font-size-body': '22px',
      '--line-height': '1.75',
      '--spacing-unit': '1.5rem',
      '--border-radius': '1.5rem',
      '--touch-target': '56px',
      '--content-max-width': '640px',
      '--animation-duration': '0.5s',
    },
    features: {
      audioInstructions: true,
      characterGuide: true,
      simplifiedNav: true,
      soundEffects: true,
      singleActivityPerScreen: true,
    },
  },
  TIER_2: { // Ages 9-13
    minAge: 9, maxAge: 13,
    tokens: {
      '--font-size-body': '18px',
      '--line-height': '1.6',
      '--spacing-unit': '1rem',
      '--border-radius': '0.75rem',
      '--touch-target': '44px',
      '--content-max-width': '960px',
      '--animation-duration': '0.3s',
    },
    features: {
      audioInstructions: false,
      characterGuide: false,
      simplifiedNav: false,
      soundEffects: true,
      singleActivityPerScreen: false,
    },
  },
  TIER_3: { // Ages 14+
    minAge: 14, maxAge: 99,
    tokens: {
      '--font-size-body': '16px',
      '--line-height': '1.5',
      '--spacing-unit': '0.75rem',
      '--border-radius': '0.5rem',
      '--touch-target': '40px',
      '--content-max-width': '1200px',
      '--animation-duration': '0.2s',
    },
    features: {
      audioInstructions: false,
      characterGuide: false,
      simplifiedNav: false,
      soundEffects: false,
      singleActivityPerScreen: false,
    },
  },
};
```

**Theme Provider Component:**

```typescript
// components/providers/AgeTierProvider.tsx
'use client';
import { createContext, useContext, useEffect } from 'react';
import { AGE_TIERS } from '@/lib/config/age-tiers';

const AgeTierContext = createContext(AGE_TIERS.TIER_2);

export function AgeTierProvider({ tier, children }) {
  useEffect(() => {
    const root = document.documentElement;
    const config = AGE_TIERS[tier];
    Object.entries(config.tokens).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.setAttribute('data-age-tier', tier);
  }, [tier]);

  return (
    <AgeTierContext.Provider value={AGE_TIERS[tier]}>
      {children}
    </AgeTierContext.Provider>
  );
}

export const useAgeTier = () => useContext(AgeTierContext);
```

### Accessibility Modes (Stackable on Top of Age Tiers)

Four toggleable modes stored in User preferences JSON:

| Mode | CSS Class | Key Changes |
|------|-----------|------------|
| Dyslexia Mode | `[data-a11y-dyslexia]` | Lexend font, letter-spacing 0.12em, line-height 1.75, background #FDF6E3 |
| Focus Mode | `[data-a11y-focus]` | Hide sidebar, single-task view, Pomodoro timer visible, reduced motion |
| Calm Mode | `[data-a11y-calm]` | Muted palette, no animations, no auto-play, text labels on all icons |
| High Contrast | `[data-a11y-contrast]` | 7:1 contrast ratios, thicker borders, no colour-only indicators |

These modes compose with age tiers — a Tier 1 student with Dyslexia Mode gets both large text AND Lexend font.

---

## 3. Student Dashboard — "My Day" View

The dashboard is the student's primary interface. It answers the single question: **"What do I do right now?"**

### Component Architecture

```
<StudentDashboard>
  ├── <MyDayPanel>                    // TOP: Today's focus
  │     ├── <NextSessionCard>         // Next upcoming session with countdown
  │     │     ├── TutorName + Avatar
  │     │     ├── SessionTime + Mode (Physical/Video)
  │     │     ├── SubjectBadges (what they'll work on)
  │     │     └── JoinButton (for video) or "See you at the centre!" (physical)
  │     ├── <CurrentExercise>         // If homework is pending
  │     │     ├── CourseName + ExerciseTitle
  │     │     ├── ProgressBar (3 of 8 questions done)
  │     │     └── ContinueButton
  │     └── <DailyChecklist>          // Tier 1: visual schedule, Tier 3: task list
  │           ├── ✅ Attended morning session
  │           ├── 🔄 Complete English homework (3 questions left)
  │           └── ⬜ Review tutor's feedback on yesterday's work
  │
  ├── <SubjectProgressCards>          // MIDDLE: Per-subject progress
  │     └── <SubjectCard> (repeated per enrolled course)
  │           ├── SubjectIcon + Name ("English")
  │           ├── AssessedLevel ("Working at Class 4 level")
  │           ├── ProgressRing (65% through current unit)
  │           ├── CurrentUnit ("Unit 3: Comprehension")
  │           ├── RecentScore (last exercise: 85%)
  │           └── Tier 1: Star path | Tier 2: Progress bar | Tier 3: Mastery grid
  │
  ├── <HomeworkSection>               // Pending homework assignments
  │     └── <HomeworkCard>
  │           ├── CourseName
  │           ├── ExerciseTitle
  │           ├── DueDate with countdown
  │           ├── StatusBadge (NOT_STARTED | IN_PROGRESS | SUBMITTED)
  │           └── StartButton
  │
  ├── <AchievementShelf>              // 3-5 recent badges
  │     ├── BadgeIcon + Name (compact)
  │     └── ViewAllLink → /achievements
  │
  ├── <StreakDisplay>                  // Attendance + homework streaks
  │     ├── 🔥 7-day attendance streak
  │     ├── 📝 5 homework submissions in a row
  │     └── StreakFreezeIndicator (if equipped)
  │
  └── <RecentFeedback>                // Latest tutor comments
        └── <FeedbackCard>
              ├── TutorName
              ├── ExerciseName
              ├── Comment preview
              └── ViewFullButton
```

### Tier-Specific Dashboard Variations

**Tier 1 (Ages 5-8):** The "My Day" panel becomes a **visual schedule** using a first-then board pattern. Each task is a large illustrated card (minimum 120px height) with an icon, a short label in 22px+ text, and an audio play button. The mascot character appears alongside each card with encouraging speech bubbles. The Subject Progress section uses a **star-path journey map** where completed lessons light up as golden stars along a winding path. No numerical scores are shown — only star counts and character celebrations.

**Tier 2 (Ages 9-13):** Standard dashboard layout with card-based design. Subject progress uses **coloured progress bars** with percentage labels. Homework shows as a checklist with status badges. Gamification elements are prominent — streak flames, XP counter in the header, and level progress bar.

**Tier 3 (Ages 14+):** Data-dense layout. Subject progress shows as a **mastery grid** with skill categories (Reading, Comprehension, Spelling, etc.) each showing Not Started → Familiar → Proficient → Mastered. Homework appears as a sortable table. Analytics section shows weekly study time, exercise accuracy trends, and upcoming assessment schedule.

---

## 4. Student Session Interface

When a student joins a session (video or views their in-session work), they see their **individual exercise workspace** — not a shared classroom view.

### Video Session Layout

```
┌─────────────────────────────────────────────────┐
│ [Session Toolbar]                                │
│  Timer: 42:18 │ English · Class 4 │ Ex 3/8 │ 🤚│
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐     │
│  │                                         │     │
│  │         EXERCISE CONTENT AREA           │     │
│  │                                         │     │
│  │   Read the passage below and answer     │     │
│  │   the following questions:              │     │
│  │                                         │     │
│  │   [Passage text here...]               │     │
│  │                                         │     │
│  │   Q1: What is the main idea of the     │     │
│  │       passage?                          │     │
│  │   ○ Option A                            │     │
│  │   ○ Option B                            │ ┌──┐│
│  │   ○ Option C                            │ │🎥││
│  │   ○ Option D                            │ │  ││
│  │                                         │ └──┘│
│  │   [Next Question →]                     │ PiP │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  [Auto-saved 3s ago]              [Submit All →] │
└─────────────────────────────────────────────────┘
```

**Key behaviours:**
- The tutor's video feed appears as a small draggable PiP window (bottom-right default)
- The student works on their individual exercise — they cannot see other students' work
- The "Raise Hand" button (🤚) sends a help request to the tutor's dashboard
- Auto-save triggers every 30 seconds and on every answer change
- When the tutor sends a message, it appears as a toast notification
- If the tutor assigns new content during the session, the student receives a notification: "Your tutor has assigned a new activity"

### Exercise Renderer Components

The `<ExerciseRenderer>` dynamically renders the correct UI based on `exerciseType`:

```typescript
// components/student/ExerciseRenderer.tsx
function ExerciseRenderer({ exercise, attempt, onAnswerChange }) {
  switch (exercise.exerciseType) {
    case 'MULTIPLE_CHOICE':
      return <MultipleChoiceExercise exercise={exercise} attempt={attempt} onChange={onAnswerChange} />;
    case 'FILL_IN_BLANK':
      return <FillInBlankExercise exercise={exercise} attempt={attempt} onChange={onAnswerChange} />;
    case 'SHORT_ANSWER':
      return <ShortAnswerExercise exercise={exercise} attempt={attempt} onChange={onAnswerChange} />;
    case 'NUMERICAL':
      return <NumericalExercise exercise={exercise} attempt={attempt} onChange={onAnswerChange} />;
    case 'MATCHING':
      return <MatchingExercise exercise={exercise} attempt={attempt} onChange={onAnswerChange} />;
    case 'WORKSHEET':
      return <WorksheetExercise exercise={exercise} />; // Instructions only — physical work
    default:
      return <GenericExercise exercise={exercise} />;
  }
}
```

**Age tier adaptations within exercises:**
- Tier 1: Larger buttons, drag-and-drop for matching, audio reading of questions, animated feedback on each answer
- Tier 2: Standard input fields, visual feedback indicators, hint system
- Tier 3: Compact layout, keyboard shortcuts (1-4 for multiple choice), timer display

---

## 5. Homework and Between-Session Work

Homework is assigned by the tutor (see Doc 3 for the tutor's workflow) and appears in the student's dashboard. The content comes from the same exercise pool but is flagged as homework.

### Homework Data Model

```prisma
model HomeworkAssignment {
  id                String   @id @default(cuid())
  centreId          String
  studentId         String
  courseId           String
  exerciseId        String
  assignedById      String   // Tutor who assigned it
  sessionEnrollmentId String? // Session during which it was assigned
  dueDate           DateTime
  status            HomeworkStatus @default(NOT_STARTED)
  startedAt         DateTime?
  submittedAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  student           User     @relation("StudentHomework", fields: [studentId], references: [id])
  course            Course   @relation(fields: [courseId], references: [id])
  exercise          Exercise @relation(fields: [exerciseId], references: [id])
  assignedBy        User     @relation("AssignedHomework", fields: [assignedById], references: [id])
  attempt           ExerciseAttempt? @relation("HomeworkAttempt")

  @@index([centreId, studentId, status])
  @@index([studentId, dueDate])
  @@index([assignedById])
}

enum HomeworkStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  GRADED
  RETURNED
}
```

### Homework View Flow

1. Student sees homework cards on dashboard sorted by due date
2. Clicking "Start" navigates to the exercise renderer (same component as in-session)
3. Progress auto-saves — student can return later
4. "Submit" marks the homework as SUBMITTED and triggers:
   - Gamification event: `homework.submitted` (awards XP + streak check)
   - Notification to tutor: homework ready for review
   - Notification to parent: "Your child submitted their English homework"
5. After tutor grades it, the student sees the score and feedback in their dashboard

---

## 6. Gamification Engine

### XP System

XP is the foundational metric. Every learning action earns XP, which accumulates into levels.

**XP Award Table:**

| Action | XP | Conditions |
|--------|-----|-----------|
| Session attendance | 10 | Marked as ATTENDING by tutor |
| Exercise completed | 15-50 | Scaled by difficulty: Easy=15, Medium=25, Hard=35, Challenge=50 |
| Exercise scored 80%+ | +10 bonus | First attempt only |
| Exercise scored 100% | +25 bonus | First attempt only |
| Homework submitted on time | 20 | Before due date |
| Homework submitted late | 10 | After due date (still rewarded, just less) |
| Level advancement | 100 | When assessed grade level increases |
| Daily login | 5 | Once per day, max 1 |
| Reading time (10 min) | 5 | Tracked per session, max 3 per day |

**Level Progression:**

```typescript
// lib/config/gamification.ts
export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Beginner' },
  { level: 2, xpRequired: 100, title: 'Explorer' },
  { level: 3, xpRequired: 300, title: 'Learner' },
  { level: 4, xpRequired: 600, title: 'Achiever' },
  { level: 5, xpRequired: 1000, title: 'Scholar' },
  { level: 6, xpRequired: 1500, title: 'Expert' },
  { level: 7, xpRequired: 2200, title: 'Master' },
  { level: 8, xpRequired: 3000, title: 'Champion' },
  { level: 9, xpRequired: 4000, title: 'Legend' },
  { level: 10, xpRequired: 5500, title: 'Grandmaster' },
];

export function calculateLevel(totalXp: number) {
  const level = LEVEL_THRESHOLDS.filter(l => totalXp >= l.xpRequired).pop();
  const nextLevel = LEVEL_THRESHOLDS.find(l => l.xpRequired > totalXp);
  return {
    current: level,
    next: nextLevel,
    progressToNext: nextLevel
      ? (totalXp - level.xpRequired) / (nextLevel.xpRequired - level.xpRequired)
      : 1,
  };
}
```

### Badge System

Four categories, each with tiered milestones:

**Completion Badges:**
- First Steps: Complete 1 exercise
- Dedicated Learner: Complete 25 exercises
- Century Club: Complete 100 exercises
- Knowledge Seeker: Complete 500 exercises

**Streak Badges:**
- Getting Started: 3-day attendance streak
- On a Roll: 7-day streak
- Unstoppable: 30-day streak
- Iron Will: 90-day streak

**Mastery Badges:**
- Rising Star: Advance 1 grade level in any subject
- Double Advance: Advance 2 grade levels
- Subject Master: Reach the highest grade level in a subject
- Polymath: Advance in 3+ different subjects

**Participation Badges:**
- Helping Hand: First help request in a session
- Homework Hero: 5 consecutive on-time homework submissions
- Perfect Score: Score 100% on any exercise
- Consistent: Attend all scheduled sessions in a month

### Streak System with Safety Nets

```prisma
model Streak {
  id          String    @id @default(cuid())
  studentId   String
  centreId    String
  streakType  StreakType
  currentCount Int      @default(0)
  longestCount Int      @default(0)
  lastActivityDate DateTime?
  freezesAvailable Int  @default(1)
  weekendPassActive Boolean @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([studentId, streakType])
  @@index([centreId, streakType])
}

enum StreakType {
  ATTENDANCE   // Sessions attended
  HOMEWORK     // Homework submitted on time
  DAILY_LOGIN  // Consecutive daily logins
}
```

**Safety nets:**
- **Streak Freeze:** Each student gets 1 freeze per week (configurable per centre). If they miss a day, the freeze auto-activates and preserves the streak. Earned by completing 5 exercises.
- **Weekend Pass:** By default, weekends don't break streaks. Configurable per centre.
- **Streak Repair:** If a streak is broken within the last 48 hours, the student can "repair" it by completing 2 extra exercises. Available once per month.

### Leaderboards — Opt-In, Class-Scoped

```typescript
// Leaderboard computation (cached in Redis, refreshed hourly)
async function computeLeaderboard(centreId: string, period: 'WEEKLY' | 'MONTHLY') {
  const since = period === 'WEEKLY'
    ? startOfWeek(new Date())
    : startOfMonth(new Date());

  const rankings = await prisma.xPLedger.groupBy({
    by: ['studentId'],
    where: { centreId, createdAt: { gte: since } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 50,
  });

  return rankings.map((r, i) => ({
    rank: i + 1,
    studentId: r.studentId,
    xp: r._sum.amount,
  }));
}
```

**Leaderboard display rules:**
- Default: OFF. Students must opt in via settings
- Shows only the student's nearby positions (3 above, 3 below)
- "Beat Your Score" (personal best comparison) is the default competitive model
- Team leaderboards available alongside individual
- Never show full rankings — only relative position

### Age-Tier Gamification Calibration

| Element | Tier 1 (5-8) | Tier 2 (9-13) | Tier 3 (14+) |
|---------|-------------|-------------|-------------|
| XP display | Stars collected (⭐×47) | XP counter + level bar | XP in header, detailed analytics |
| Badges | Stickers with character | Coloured badges with names | Professional skill endorsements |
| Streaks | Growing plant animation | Flame counter 🔥 | Subtle calendar heatmap |
| Level up | Full-screen character celebration | Confetti + level badge | Toast notification + stats update |
| Leaderboard | Not available | Opt-in class board | Opt-in + personal analytics |
| Rewards | Unlockable avatar items | Unlockable themes + avatar | Completion certificates |
| Competition | None — only personal progress | Speed challenges (Kahoot-style) | Personal best tracking |

---

## 7. Progress Tracking and Student Analytics

### Progress Data Model

Student progress is tracked at multiple levels:

1. **Per-exercise:** ExerciseAttempt records with scores, time spent, and attempt count
2. **Per-unit:** Aggregated from exercise completions within a ContentUnit
3. **Per-subject:** SubjectAssessment showing assessed grade level and academic ages
4. **Cross-subject:** Overall XP, level, badges, and session attendance

### Student-Facing Progress Views

**My Progress Page:**

```
<ProgressPage>
  ├── <OverallStats>
  │     ├── TotalXP + CurrentLevel
  │     ├── ExercisesCompleted (this week / all time)
  │     ├── AverageScore (this week / all time)
  │     └── SessionsAttended (this month)
  │
  ├── <SubjectTabs>
  │     └── <SubjectProgress> (per enrolled course)
  │           ├── AssessedLevel + Trend arrow (↑ advancing / → stable)
  │           ├── UnitProgressList
  │           │     └── <UnitRow>
  │           │           ├── UnitTitle
  │           │           ├── ExercisesCompleted / Total
  │           │           ├── AverageScore
  │           │           └── StatusBadge (In Progress / Completed / Mastered)
  │           ├── SkillBreakdown (Reading: 75%, Comprehension: 60%, Spelling: 85%)
  │           └── RecentActivity timeline
  │
  └── <AchievementsGallery>
        ├── EarnedBadges (with earned date)
        ├── InProgressBadges (with progress toward criteria)
        └── LockedBadges (silhouettes with requirements)
```

### Data Flow to Parents (→ Doc 4)

Every student action generates data visible to parents:
- Session attendance → Parent attendance calendar
- Exercise scores → Parent subject progress charts
- Homework status → Parent homework tracker
- XP/badges earned → Parent achievement feed
- Tutor notes → Parent session summaries
- Level changes → Parent notification ("Your child advanced to Class 5 level in Mathematics!")

### Data Flow to Tutors (→ Doc 3)

Tutors see aggregated student progress to inform session planning:
- Exercise completion rates and scores → Lesson marking queue
- Time spent on exercises → Difficulty assessment
- Error patterns → Content selection guidance
- Help request frequency → Attention needs
- Attendance trends → At-risk identification

---

## 8. Reviewed Feedback View

After a tutor or assessor reviews the student's work, the student sees:

**For digital exercises:** The original exercise with correct answers highlighted, the student's answers marked (correct in green, incorrect in red with the correct answer shown), the overall score, and the tutor's feedback comments.

**For physical work:** The uploaded photograph of their work with annotation overlays (pen marks, stamps, comments) applied by the tutor using the Fabric.js annotation layer (see Doc 3). The annotations appear as a transparent layer over the original image.

### Feedback Component

```typescript
// components/student/FeedbackView.tsx
function FeedbackView({ attempt, review }) {
  return (
    <div>
      <ScoreHeader score={review.overallScore} maxScore={review.maxScore} />

      {attempt.exercise.exerciseType === 'WORKSHEET' ? (
        <AnnotatedWorkView
          images={review.physicalWorkUpload.imageUrls}
          annotations={review.physicalWorkUpload.annotations}
        />
      ) : (
        <DigitalExerciseReview
          exercise={attempt.exercise}
          studentAnswers={attempt.answers}
          expectedAnswers={attempt.exercise.expectedAnswers}
          criteriaScores={review.criteriaScores}
        />
      )}

      <TutorFeedback
        tutorName={review.assessor.name}
        feedback={review.feedback}
        reviewedAt={review.reviewedAt}
      />
    </div>
  );
}
```

---

## 9. Student Notifications

| Event | In-App | Push | Age Adaptation |
|-------|--------|------|---------------|
| Session starting in 15 min | ✅ Banner | ✅ | Tier 1: Character says "Time to learn!" |
| New homework assigned | ✅ Card in dashboard | ✅ | Tier 1: "Your tutor left you a fun activity!" |
| Exercise graded | ✅ Feedback card | Optional | All tiers: score + feedback preview |
| Badge earned | ✅ Celebration modal | ✅ | Tier 1: Full animation; Tier 3: Toast |
| Level up | ✅ Full celebration | ✅ | Tier 1: Character dance; Tier 3: Stats popup |
| Streak at risk | ✅ Subtle reminder | Optional | "Complete 1 more exercise to keep your streak!" |
| Level advancement | ✅ Major celebration | ✅ | "You're now working at Class 5 level in English!" |
| Tutor message | ✅ Toast notification | ✅ | Direct message display |

---

## 10. Technical Implementation Notes

### Server Components vs Client Components

| Component | Rendering | Why |
|-----------|-----------|-----|
| Dashboard layout | Server Component | Initial data fetch, SEO, fast first paint |
| SubjectProgressCards | Server Component | Static per page load, no interactivity |
| ExerciseRenderer | Client Component | Interactive form inputs, auto-save |
| GamificationWidgets | Client Component | Real-time XP updates, animations |
| StreakDisplay | Server Component | Computed once per load |
| Leaderboard | Client Component | Opt-in toggle, periodic refresh |
| SessionInterface | Client Component | WebSocket, video, real-time |

### Caching Strategy

- Student dashboard: ISR with 60s revalidation + WebSocket invalidation for real-time events
- Exercise content: Static generation at build time, immutable after creation
- Gamification profiles: Redis cache with 30s TTL, invalidated on XP award
- Leaderboards: Redis sorted sets, recomputed hourly via BullMQ cron job
- Progress aggregations: Redis cache with 5-minute TTL

### Auto-Save for Exercises

```typescript
// hooks/useAutoSave.ts
function useAutoSave(attemptId: string, answers: any, interval = 30000) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timeoutRef.current = setInterval(async () => {
      await fetch(`/api/exercises/attempts/${attemptId}/autosave`, {
        method: 'PATCH',
        body: JSON.stringify({ answers }),
      });
    }, interval);

    return () => clearInterval(timeoutRef.current);
  }, [attemptId, answers, interval]);

  // Also save on answer change (debounced 2s)
  const debouncedSave = useDebouncedCallback(async () => {
    await fetch(`/api/exercises/attempts/${attemptId}/autosave`, {
      method: 'PATCH',
      body: JSON.stringify({ answers }),
    });
  }, 2000);

  return { save: debouncedSave };
}
```
