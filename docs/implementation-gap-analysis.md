# Implementation Gap Analysis & Roadmap
**Date:** 2026-02-13
**Current System:** Basic LMS with class-based sessions
**Target System:** Multi-student, multi-course tutoring platform (AetherLearn vision)

---

## Executive Summary

The current LMS has a solid foundation but requires significant architectural changes to support the **individualized, multi-level tutoring model** described in the architecture documents. The critical insight is: **"The session is a time container, not a content container"** — each student works on different content at different levels within the same session.

**Estimated Implementation:** 12-16 weeks for MVP, 20-24 weeks for full feature parity

---

## Part 1: Critical Gaps

### 1.1 Database Schema - Fundamental Restructuring Required

#### CURRENT STATE
```prisma
ClassCohort → ClassMembership → Session → SessionAttendance
- Class-based: one class, one subject, grouped students
- Students all work on the same content
- Sessions tied to a single lesson
```

#### TARGET STATE
```prisma
SessionTemplate → TutoringSession → StudentSessionEnrollment → StudentSessionActivity
- Student-centric: each enrollment links student + session + course + assessed level
- Students work on different courses at different levels
- Sessions are time containers, not content containers
```

#### MIGRATION STRATEGY
- **Phase 1**: Add new models alongside existing (parallel run)
- **Phase 2**: Migrate existing data to new structure
- **Phase 3**: Deprecate old models (mark with @@map for historical queries)

---

### 1.2 Academic Assessment System

#### CURRENT GAP
- `AcademicProfile` has basic fields (readingAge, numeracyAge) but lacks per-subject assessed levels
- No distinction between chronological grade and working level per subject
- No historical tracking of level changes

#### REQUIRED MODELS
```prisma
model SubjectAssessment {
  studentId          String
  courseId           String
  assessedGradeLevel Int      // THE KEY FIELD: Class 7 student working at Class 4 English
  readingAge         Float?
  numeracyAge        Float?
  comprehensionLevel Float?
  writingLevel       Float?
  lastAssessedAt     DateTime
  assessedById       String   // Who made this assessment

  @@unique([studentId, courseId])
}

model AcademicProfileLog {
  studentId           String
  courseId            String
  previousLevel       Int
  newLevel            Int
  updateType          ProfileUpdateType  // ASSESSMENT_RESULT, TUTOR_OVERRIDE, DIAGNOSTIC_TEST
  reason              String?
  updatedById         String
  assessmentReviewId  String?
  createdAt           DateTime
}
```

**Implementation Impact:** Content sequencing, tutor planning, parent reports all depend on this

---

### 1.3 Content Hierarchy Restructuring

#### CURRENT STATE
```
Course → Module → Lesson → Content
- No grade level separation
- No exercise granularity
- No auto-sequencing logic
```

#### REQUIRED STATE
```
Course → GradeLevel → ContentUnit → Lesson → Exercise
- Each Exercise has: type (MULTIPLE_CHOICE, FILL_IN_BLANK, etc.), questions JSON, expectedAnswers JSON
- Auto-sequencing algorithm uses SubjectAssessment to serve appropriate level
- Tutor override capability via ContentAssignment
```

**Critical Feature:** `getNextContent()` function must:
1. Check for tutor overrides first
2. Get student's assessed level for course
3. Find next incomplete exercise at that level
4. Return content or flag for level advancement

---

### 1.4 Exercise & Attempt System

#### MISSING MODELS
```prisma
model Exercise {
  id              String
  lessonId        String
  sequenceOrder   Int
  exerciseType    ExerciseType  // MULTIPLE_CHOICE, FILL_IN_BLANK, SHORT_ANSWER, etc.
  title           String
  instructions    String?
  questions       Json           // [{question, options?, type}]
  expectedAnswers Json?          // For auto-grading
  maxScore        Int
  timeLimit       Int?
  isAutoGradable  Boolean
}

model ExerciseAttempt {
  id                  String
  studentId           String
  exerciseId          String
  sessionEnrollmentId String?
  answers             Json
  score               Float?
  maxScore            Int
  status              AttemptStatus  // IN_PROGRESS, SUBMITTED, AUTO_GRADED, UNDER_REVIEW, GRADED
  startedAt           DateTime
  submittedAt         DateTime?
  autoGraded          Boolean
}

model AssessmentReview {
  id                   String
  assessorId           String
  exerciseAttemptId    String?
  physicalWorkUploadId String?
  rubricId             String?
  criteriaScores       Json?
  overallScore         Float
  feedback             String?
  status               AssessmentStatus
  reviewedAt           DateTime?
}
```

**Why Critical:** This is the core learning loop — student attempts exercises, gets graded, advances levels

---

### 1.5 Physical Work & QR Code System

#### CURRENT STATE
None — completely missing

#### REQUIRED IMPLEMENTATION
1. **PhysicalWorkUpload Model**: Store scanned worksheets linked via QR codes
2. **QR Code Format**: `AE-{studentId}-{exerciseId}-{sessionId}`
3. **Annotation Layer**: Fabric.js canvas for tutor marking overlays
4. **Scanning Interface**: Camera-based QR scanner + manual entry fallback
5. **Storage**: MinIO/S3 buckets for images

**Workflow:**
```
Generate QR → Print worksheet → Student completes → Tutor scans QR →
Upload photo → Annotate digitally → Submit to marking queue →
Student sees annotated work
```

---

### 1.6 Real-Time Session Monitoring

#### CURRENT STATE
Basic session tracking, no live monitoring

#### REQUIRED INFRASTRUCTURE

**Technology Stack:**
- **PartyKit** (or Ably): WebSocket room-per-session
- **LiveKit**: Video (tutor PiP on student screens)
- **TanStack Query v5**: Server state caching
- **Zustand v5**: Client-side real-time state

**Features Needed:**
1. **Tutor Dashboard**: Grid of 5-15 student tiles showing:
   - Current exercise + progress %
   - Status indicator (🟢 Working, 🟡 Idle, 🔴 Need Help)
   - Time on task
   - Live answer preview (for supervisor only)
2. **Student Interface**: Exercise workspace + tutor video PiP
3. **Help Request System**: Student raises hand → appears in tutor queue → tutor acknowledges/resolves
4. **WebSocket Events**: activity:start, activity:progress, help:request, content:assign

**Why Critical:** The core differentiator — real-time monitoring of individualized work

---

### 1.7 Age-Tier Adaptive UI

#### CURRENT STATE
Single UI for all ages

#### REQUIRED SYSTEM

**Three Tiers:**
- **Tier 1 (Ages 5-8)**: Large text (22px), big buttons (56px touch targets), character guide, audio instructions, single activity per screen, star-path progress
- **Tier 2 (Ages 9-13)**: Standard UI (18px), progress bars, streak flames, XP counter
- **Tier 3 (Ages 14+)**: Data-dense (16px), mastery grids, analytics, no gamification visuals

**Implementation:**
```typescript
// CSS custom properties set by AgeTierProvider
'--font-size-body': '22px' | '18px' | '16px'
'--touch-target': '56px' | '44px' | '40px'
// Plus feature flags per tier
```

**Accessibility Modes** (stackable on tiers):
- Dyslexia Mode: Lexend font, increased letter-spacing
- Focus Mode: Single-task view, hidden sidebar
- Calm Mode: Muted palette, no animations
- High Contrast: 7:1 ratios

---

### 1.8 Homework System

#### MISSING MODELS
```prisma
model HomeworkAssignment {
  id                  String
  studentId           String
  courseId            String
  exerciseId          String
  assignedById        String
  sessionEnrollmentId String?
  dueDate             DateTime
  status              HomeworkStatus  // NOT_STARTED, IN_PROGRESS, SUBMITTED, GRADED
  startedAt           DateTime?
  submittedAt         DateTime?
}
```

**Workflow:**
```
Tutor assigns exercise as homework (from session planning or content library) →
Student sees in dashboard with due date →
Student completes (same ExerciseAttempt flow) →
Tutor grades →
XP awarded + parent notified
```

---

### 1.9 Fee Plans & Invoicing

#### MISSING MODELS
```prisma
model FeePlan {
  id               String
  centreId         String
  name             String        // "Standard Weekly", "Intensive Monthly"
  frequency        Frequency     // WEEKLY, FORTNIGHTLY, MONTHLY, TERM, ANNUAL
  amount           Decimal
  sessionsIncluded Int?
  subjects         String[]
}

model Invoice {
  id            String
  centreId      String
  studentId     String
  parentId      String
  amount        Decimal
  currency      String
  status        InvoiceStatus  // DRAFT, SENT, PENDING, PAID, PARTIAL, OVERDUE, REFUNDED
  dueDate       DateTime
  paidAt        DateTime?
  lineItems     Json
}
```

**Integration:** Xero/QuickBooks sync, Stripe payment processing

---

### 1.10 Session Planner with Historical Data

#### CURRENT STATE
Can view sessions, but no planning interface

#### REQUIRED FEATURES

**Planning View per Student:**
1. **Today's Lesson Activities**: Auto-sequenced content + ability to override
2. **Homework Activities**: Current assignments + due dates
3. **Assessments**: Pending assessments + recent results
4. **Historical Context**: Show previous 4 lessons with:
   - Exercises completed
   - Scores achieved
   - Tutor notes
   - Time spent per activity

**Critical Query:**
```typescript
// Get last 4 session enrollments for this student in this course
const recentHistory = await prisma.studentSessionEnrollment.findMany({
  where: { studentId, courseId },
  orderBy: { session: { date: 'desc' } },
  take: 4,
  include: {
    activities: { include: { exercise: true, lesson: true } },
    exerciseAttempts: { select: { score: true, maxScore: true } },
    tutorNotes: true
  }
});
```

---

## Part 2: Infrastructure Gaps

### 2.1 Redis
**Purpose:** Caching, BullMQ event bus, leaderboards, rate limiting
**Installation:** Already documented in Doc 5
**Required Setup:**
- Install redis-server
- Configure persistence (AOF)
- Set maxmemory-policy allkeys-lru

### 2.2 MinIO (S3-Compatible Storage)
**Purpose:** Scanned documents, course materials, avatars, exports
**Buckets:**
- aetherlearn-documents
- aetherlearn-content
- aetherlearn-avatars
- aetherlearn-exports

### 2.3 Event Bus (BullMQ)
**Purpose:** Domain event propagation for cross-module side effects
**Example Events:**
- `session.started` → notify parents
- `exercise.submitted` → award XP, update leaderboard
- `level.changed` → notify all, update content sequencing

### 2.4 Real-Time Services
**Options:**
1. **PartyKit** (recommended): Cloudflare-based WebSocket rooms
2. **Ably**: Managed service with React SDK
3. **LiveKit**: Open-source WebRTC for video

---

## Part 3: Priority Phasing

### Phase 1: Foundation (Weeks 1-4) - CRITICAL PATH
**Goal:** Core schema changes to support student-centric model

1. **Add New Models** (parallel with existing):
   - `TutoringSession`
   - `StudentSessionEnrollment`
   - `SubjectAssessment`
   - `AcademicProfileLog`
   - `Exercise`
   - `ExerciseAttempt`
   - `StudentSessionActivity`

2. **Update Seed Data**: Create sample data for new models

3. **Migrate Existing Sessions**: Convert ClassCohort data to new structure

4. **Basic API Endpoints**:
   - GET `/api/v1/sessions/today` (with enrollments)
   - GET `/api/v1/content/next?studentId&courseId`
   - POST `/api/v1/exercises/:id/start`
   - POST `/api/v1/attempts/:id/submit`

**Deliverables:**
- Updated Prisma schema with all new models
- Migration script from old to new structure
- Seed data updated
- Basic session + content APIs working

---

### Phase 2: Core Learning Loop (Weeks 5-8)
**Goal:** Students can complete exercises, get graded, see progress

1. **Exercise Renderer Components**:
   - MultipleChoiceExercise
   - FillInBlankExercise
   - ShortAnswerExercise
   - NumericalExercise

2. **Auto-Grading System**: Implement for objective question types

3. **Manual Review Queue**: Assessor interface for subjective answers

4. **Student Dashboard**: "My Day" view with:
   - Next session card
   - Current homework
   - Subject progress cards
   - Recent feedback

5. **Basic Gamification**:
   - XP awards on exercise completion
   - Level calculation
   - Badge system (5-10 basic badges)

**Deliverables:**
- Functional exercise flow (start → complete → submit → grade → feedback)
- Student can see progress per subject
- Basic XP and levels working

---

### Phase 3: Tutor Experience (Weeks 9-12)
**Goal:** Tutors can monitor, plan, and mark sessions

1. **Tutor Portal Navigation**:
   - Current Day Sessions
   - Planning Next Sessions
   - Lesson Marking
   - History of Sessions
   - Content Library
   - Create Assessment

2. **Session Planning Interface**:
   - View auto-sequenced content per student
   - Override with Content Library browser
   - Assign homework
   - Add session notes

3. **Marking Interface**:
   - Split pane: student work | grading panel
   - Rubric scoring
   - Feedback text
   - Save draft / Complete marking

4. **Homework Assignment Workflow**

**Deliverables:**
- Complete tutor portal with all 6 menu sections
- Tutors can plan, monitor (basic), and mark sessions
- Homework assignment functional

---

### Phase 4: Real-Time Monitoring (Weeks 13-16)
**Goal:** Live session dashboard with student activity monitoring

1. **Infrastructure Setup**:
   - Install Redis
   - Set up PartyKit (or Ably)
   - Integrate LiveKit

2. **Tutor Dashboard Grid**:
   - 5-15 student tiles
   - Live status indicators
   - Help request queue
   - Click tile → student detail panel

3. **Student Real-Time Interface**:
   - Exercise workspace
   - Tutor video PiP
   - Raise hand button
   - Auto-save every 30s

4. **WebSocket Events**:
   - activity:start, activity:progress, activity:complete
   - help:request, help:acknowledge, help:resolve
   - content:assign

**Deliverables:**
- Real-time session monitoring working
- Tutor sees all students' live status
- Help request system functional
- Video integration (basic PiP)

---

### Phase 5: Physical Work & Assessments (Weeks 17-20)
**Goal:** Support scanned worksheets and formal assessments

1. **Physical Work System**:
   - MinIO setup
   - PhysicalWorkUpload model
   - QR code generation
   - Scanning interface (camera + manual)
   - Image upload to MinIO
   - Annotation workspace (Fabric.js)

2. **Assessment Creation Wizard**:
   - Select student + subject
   - Choose components (Reading, Comprehension, etc.)
   - Auto-suggest exercises
   - Schedule assessment

3. **Assessment Review Workflow**:
   - Complete assessment
   - Review results by component
   - Make level decision
   - Update SubjectAssessment
   - Log to AcademicProfileLog

**Deliverables:**
- Physical worksheets can be scanned, annotated, graded
- Formal assessments can determine/update assessed levels
- Parent receives assessment report

---

### Phase 6: Advanced Features (Weeks 21-24)
**Goal:** Polish and advanced functionality

1. **Age-Tier UI System**:
   - AgeTierProvider component
   - CSS custom properties per tier
   - Tier-specific components (star path, mastery grid, etc.)

2. **Finance System**:
   - FeePlan management
   - Invoice generation
   - Payment recording
   - Xero/QuickBooks integration

3. **Parent Portal**:
   - Child progress dashboard
   - Attendance calendar
   - Recent activity feed
   - Invoices + payments
   - Request system (schedule change, tutor change, etc.)

4. **Advanced Gamification**:
   - Streak system with safety nets
   - Leaderboards (opt-in, nearby positions only)
   - Team challenges
   - Unlockable rewards

5. **Reception Check-In Terminal**

6. **Supervisor Portal**:
   - All tutors overview
   - At-risk student dashboard
   - Session management
   - Approval queue

**Deliverables:**
- Full parent experience
- Complete finance workflow
- Reception check-in functional
- Age-appropriate UI for all tiers

---

## Part 4: Redundancies to Remove

### 4.1 Old Models to Deprecate (After Migration)
- `ClassCohort` → replaced by `TutoringSession` + `StudentSessionEnrollment`
- `ClassMembership` → replaced by `StudentSessionEnrollment`
- `Session` (old model) → replaced by `TutoringSession`
- `SessionAttendance` → replaced by `AttendanceRecord` (which already exists)

**Approach:** Mark with `@@map("legacy_class_cohort")` to preserve historical queries

### 4.2 Schema Simplifications
- Current `Content` model has video/document/quiz types but no exercise granularity → merge into new `Exercise` model
- Current `Progress` model tracks lesson completion → replace with `StudentSessionActivity` + `ExerciseAttempt`

### 4.3 Duplicate Functionality
- Both `SessionAttendance` and `AttendanceRecord` exist → standardize on `AttendanceRecord`
- Current basic gamification in `GamificationProfile` → expand with new models or migrate to comprehensive system

---

## Part 5: Critical Technical Decisions

### Decision 1: Real-Time Architecture
**Options:**
1. **PartyKit** (recommended): $10/mo, Cloudflare edge, room-per-session pattern
2. **Ably**: $29/mo, managed, React SDK, easier but vendor lock-in
3. **Self-hosted Socket.io**: Free but requires sticky sessions (PM2 cluster issue)

**Recommendation:** Start with PartyKit (can migrate to self-hosted later)

### Decision 2: Video Solution
**Options:**
1. **LiveKit** (recommended): Open-source, 50K participant-minutes/month free
2. **Daily.co**: Easier API but $10/mo minimum
3. **Teams/Zoom Embed**: Limited control, student experience worse

**Recommendation:** LiveKit (matches budget, full control)

### Decision 3: File Storage
**Options:**
1. **MinIO** (recommended): Self-hosted S3-compatible, free
2. **Cloudflare R2**: $0.015/GB, no egress fees
3. **AWS S3**: More expensive for egress

**Recommendation:** Start with MinIO (on-prem), migrate to R2 if scaling needed

### Decision 4: Migration Strategy
**Options:**
1. **Big-bang cutover**: Risky, all-or-nothing
2. **Parallel run**: New features use new models, old features keep working (recommended)
3. **Feature flags**: Gradual rollout per centre

**Recommendation:** Parallel run (Phases 1-2) → gradual migration (Phase 3) → deprecation (Phase 6)

---

## Part 6: Implementation Checklist

### Immediate Next Steps (This Week)
- [ ] **Task #8**: Complete this gap analysis document (DONE)
- [ ] **Task #9**: Add SubjectAssessment + AcademicProfileLog models to schema
- [ ] **Task #10**: Add Exercise + ExerciseAttempt models
- [ ] **Task #11**: Add TutoringSession + StudentSessionEnrollment models
- [ ] **Task #12**: Add PhysicalWorkUpload model
- [ ] **Task #13**: Add HomeworkAssignment model
- [ ] Run `npm run db:generate && npm run db:push`
- [ ] Update seed.ts with sample data for new models
- [ ] Run `npm run db:seed`

### Week 1-2: Schema Foundation
- [ ] Create migration script from ClassCohort to TutoringSession
- [ ] Implement `getNextContent()` auto-sequencing function
- [ ] Create API endpoints: sessions/today, content/next, exercises/start, attempts/submit
- [ ] Update existing Playwright tests
- [ ] Create new tests for exercise flow

### Week 3-4: Basic Exercise Flow
- [ ] Build exercise renderer components
- [ ] Implement auto-save hook
- [ ] Create auto-grading logic
- [ ] Build manual review queue for assessors
- [ ] Test end-to-end: student starts → completes → submits → tutor grades → student sees feedback

---

## Part 7: Risk Mitigation

### Risk 1: Data Migration Complexity
**Mitigation:**
- Run old and new models in parallel
- Create comprehensive migration scripts with rollback capability
- Test migration on copy of production database first
- Gradual cutover centre-by-centre if multi-tenant

### Risk 2: Real-Time Performance at Scale
**Mitigation:**
- Start with PartyKit (proven at scale)
- Implement batched updates (150ms window) to prevent render storms
- Use entity-keyed Zustand stores for selective re-rendering
- Load test with 15 concurrent students per session

### Risk 3: Physical Work Annotation UX
**Mitigation:**
- Prototype Fabric.js annotation layer early
- Test on tablets (tutors likely to use iPads)
- Provide stamp shortcuts (✓, ✗, ⭐)
- Allow voice comments as alternative to typing

### Risk 4: Content Library Population
**Mitigation:**
- Partner with Australian curriculum content providers (Scootle, Education Perfect, Stile)
- Start with English + Math (most common)
- Create content authoring tools for tutors to add exercises
- Accept that initial population is manual work (6-12 months)

---

## Part 8: Success Metrics

### Phase 1-2 Success Criteria
- [ ] All new models in production database
- [ ] Seed data creates realistic multi-student session scenario
- [ ] API returns correct next content based on assessed level
- [ ] Student can complete exercise and see score

### Phase 3 Success Criteria
- [ ] Tutor can view today's sessions with all enrolled students
- [ ] Tutor can plan next session for each student
- [ ] Tutor can mark submitted work and student sees feedback
- [ ] Homework assignment flow works end-to-end

### Phase 4 Success Criteria
- [ ] Tutor dashboard shows live status of 15 students
- [ ] Help requests appear in queue within 1 second
- [ ] Video PiP displays tutor camera on student screen
- [ ] No WebSocket disconnections during 60-min session

### Phase 5-6 Success Criteria
- [ ] Physical worksheet scanned → annotated → student sees marked work
- [ ] Assessment determines new level → content sequencing updates
- [ ] Parent sees child's progress across all subjects
- [ ] Invoice generated → parent pays → receipt sent

---

## Conclusion

This is a **12-24 week transformation** from a class-based LMS to an individualized tutoring platform. The critical path is:

1. **Weeks 1-4**: Schema restructuring (cannot proceed without this)
2. **Weeks 5-8**: Core learning loop (students use the system)
3. **Weeks 9-12**: Tutor experience (tutors can manage sessions)
4. **Weeks 13-16**: Real-time monitoring (the key differentiator)
5. **Weeks 17-24**: Advanced features (physical work, finance, polish)

**Recommendation:** Focus on **Phase 1 (schema) and Phase 2 (learning loop)** first. Once students can complete exercises and see progress, the platform has core value. Real-time monitoring and physical work are powerful but can be added incrementally.

The good news: **Most infrastructure is already in place** (Next.js 16, Prisma, PostgreSQL, CloudFlare, PM2). The challenge is **data model restructuring and UI development**, not infrastructure setup.

**Next Action:** Begin implementing Task #9 (Subject Assessment models) → this unlocks the entire system.
