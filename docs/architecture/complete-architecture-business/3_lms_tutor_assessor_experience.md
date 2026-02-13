# AetherLearn LMS — Doc 3: Tutor & Assessor Experience

**Tutor Portal, Session Management, Lesson Marking, Assessment Creation, QR Scanning, and Student Analytics**

Doc 3 of 6 · Links to: Student submissions (Doc 2) → Admin course allocation (Doc 4) → Parent notifications (Doc 4)

---

## 1. The Tutor's Core Model — Supervised Individualised Learning

The tutor in AetherLearn does **not** teach a single class on a single subject. Instead, the tutor supervises a group of 5-15 students during a timeslot, where each student may be working on a **different course at a different assessed level**. This means:

- A tutor's 4:00-5:00 PM session might have a Class 3 student doing English at Class 1 reading level, a Class 5 student doing Mathematics at Class 4 level, and a Class 9 student doing Science at Class 7 level — all simultaneously
- The tutor monitors progress, provides individual help, marks attendance, assigns content, and reviews completed work
- Sessions can be PHYSICAL (students at the centre), VIDEO (students online with tutor on camera), or HYBRID

This model mirrors Kumon and Mathnasium's supervised tutoring approach but with full digital content delivery and real-time monitoring.

---

## 2. Tutor Portal Navigation — Six Core Menu Items

The tutor portal sidebar contains six primary navigation items. Each is detailed below with component architecture, data queries, and interaction flows.

### Navigation Structure

```
Tutor Portal Sidebar
├── 📅 Current Day Sessions        [Section 2.1]
├── 📋 Planning Next Sessions       [Section 2.2]
├── ✏️ Lesson Marking               [Section 2.3]
├── 📚 History of Sessions          [Section 2.4]
├── 📖 Content Library              [Section 2.5]
└── 📝 Create Assessment            [Section 2.6]
```

---

### 2.1 Current Day Sessions

**Purpose:** Show all sessions planned for today with student rosters and real-time status.

**Initial View — Session List:**

```
┌──────────────────────────────────────────────────────────┐
│ 📅 Today's Sessions — Thursday, 13 February 2026         │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 🟢 LIVE  Session: Afternoon Maths & English         │   │
│ │ Centre: Greenfield Learning Centre                  │   │
│ │ Time: 3:30 PM - 4:30 PM │ Mode: Physical           │   │
│ │ Students: 8/12 attending                            │   │
│ │                                                     │   │
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │   │
│ │ │ Jane │ │ Alex │ │ Priya│ │ Omar │ │ Liam │ ...   │   │
│ │ │ Eng  │ │ Math │ │ Math │ │ Sci  │ │ Eng  │       │   │
│ │ │ Cl.4 │ │ Cl.6 │ │ Cl.3 │ │ Cl.7 │ │ Cl.2 │       │   │
│ │ │ 🟢   │ │ 🟡   │ │ 🟢   │ │ 🔴   │ │ 🟢   │       │   │
│ │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │   │
│ │                                                     │   │
│ │ [Enter Session Dashboard →]                         │   │
│ └────────────────────────────────────────────────────┘   │
│                                                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │ ⬜ UPCOMING  Session: Evening Science Group          │   │
│ │ Centre: Greenfield Learning Centre                  │   │
│ │ Time: 5:00 PM - 6:00 PM │ Mode: Video              │   │
│ │ Students: 6 enrolled                                │   │
│ │                                                     │   │
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ...   │   │
│ │ │Sophie│ │ Dev  │ │ Emma │ │ Noah │ │ Zara │       │   │
│ │ │ Sci  │ │ Sci  │ │ Math │ │ Sci  │ │ Eng  │       │   │
│ │ │ Cl.5 │ │ Cl.8 │ │ Cl.4 │ │ Cl.6 │ │ Cl.7 │       │   │
│ │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │   │
│ │                                                     │   │
│ │ [View Session Details →]                            │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**Student Cards within Sessions:** Each student card is clickable and shows:
- Student name + avatar
- Course they're enrolled for ("Eng" / "Math" / "Sci")
- Assessed level ("Cl.4" = working at Class 4 level)
- Status indicator: 🟢 Working, 🟡 Idle, 🔴 Needs Help, ⬜ Not started, ✅ Completed

**Clicking "Enter Session Dashboard"** opens the real-time session monitoring interface (detailed in Section 3).

**Clicking a student card** opens a quick-view popup showing:
- Current exercise title and progress
- Recent session notes
- Quick actions: Assign Exercise, Mark Attendance, Send Message

**Data Query:**

```typescript
// API: GET /api/tutor/sessions/today
async function getTodaySessions(tutorId: string, centreId: string) {
  const today = startOfDay(new Date());
  const tomorrow = endOfDay(new Date());

  return prisma.tutoringSession.findMany({
    where: {
      tutorId,
      centreId,
      date: { gte: today, lte: tomorrow },
      status: { not: 'CANCELLED' },
    },
    orderBy: { scheduledStart: 'asc' },
    include: {
      enrollments: {
        include: {
          student: { select: { id: true, name: true, avatarUrl: true } },
          course: { select: { id: true, name: true } },
          assessedLevel: { select: { level: true, label: true } },
          activities: {
            where: { status: { not: 'COMPLETED' } },
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
        },
      },
      helpRequests: { where: { status: 'PENDING' } },
    },
  });
}
```

---

### 2.2 Planning Next Sessions

**Purpose:** Show all future sessions and allow the tutor to plan activities, assign homework, and prepare assessments for each student.

**Initial View — Future Sessions List:**

Same card format as Current Day Sessions, but grouped by date:

```
📋 Upcoming Sessions

── Friday, 14 Feb 2026 ──
[Session Card: Afternoon Maths & English | 3:30-4:30 PM | 10 students]
[Session Card: Evening Science Group | 5:00-6:00 PM | 6 students]

── Monday, 17 Feb 2026 ──
[Session Card: Morning English | 9:00-10:00 AM | 8 students]
[Session Card: Afternoon Mixed | 2:00-3:00 PM | 12 students]

── Tuesday, 18 Feb 2026 ──
...
```

**Clicking a student name** within a future session expands to a **Student Session Planning Page** with three sections:

```
┌──────────────────────────────────────────────────────────────┐
│ Planning: Jane Smith — English (Class 4 Level)                │
│ Session: Afternoon Maths & English │ Friday, 14 Feb 2026      │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📚 TODAY'S LESSON ACTIVITIES                              │ │
│ │                                                          │ │
│ │ Auto-sequenced next content (based on assessed level):   │ │
│ │                                                          │ │
│ │ Unit 3: Comprehension — Lesson 7: Inferring Meaning      │ │
│ │ ├── Exercise 1: Reading Passage — "The Lost Garden"      │ │
│ │ │   Type: Reading + Comprehension │ Est: 15 min          │ │
│ │ │   [Preview] [Add Notes] [Override →]                   │ │
│ │ │                                                        │ │
│ │ ├── Exercise 2: Vocabulary Matching                      │ │
│ │ │   Type: Matching │ Est: 10 min                         │ │
│ │ │   [Preview] [Add Notes]                                │ │
│ │ │                                                        │ │
│ │ └── Exercise 3: Short Answer Questions                   │ │
│ │     Type: Short Answer │ Est: 15 min                     │ │
│ │     [Preview] [Add Notes]                                │ │
│ │                                                          │ │
│ │ [+ Add Activity from Content Library]                    │ │
│ │ [+ Upload Physical Worksheet]                            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📝 HOMEWORK ACTIVITIES                                    │ │
│ │                                                          │ │
│ │ Currently assigned:                                      │ │
│ │ ├── Spelling Practice — Unit 3, Lesson 6 (Due: 14 Feb)  │ │
│ │ │   Status: IN_PROGRESS (3/10 completed)                 │ │
│ │ │   [Preview] [Add Notes] [Extend Deadline]              │ │
│ │ │                                                        │ │
│ │ └── Reading Log — Chapter 4 (Due: 16 Feb)               │ │
│ │     Status: NOT_STARTED                                  │ │
│ │     [Preview] [Add Notes]                                │ │
│ │                                                          │ │
│ │ [+ Assign New Homework]                                  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📊 ASSESSMENTS                                            │ │
│ │                                                          │ │
│ │ Pending assessments:                                     │ │
│ │ ├── Comprehension Assessment — Scheduled for this session│ │
│ │ │   Type: Short Answer + Multiple Choice                 │ │
│ │ │   [Preview] [Add Notes] [Reschedule]                   │ │
│ │ │                                                        │ │
│ │ Recent results:                                          │ │
│ │ ├── Spelling Test (10 Feb) — Score: 78% (15/20)         │ │
│ │ │   Assessor: Ms. Johnson │ [View Details]               │ │
│ │ │                                                        │ │
│ │ └── Reading Age Test (3 Feb) — Reading Age: 9.2 years   │ │
│ │     Assessor: Mr. Patel │ [View Details]                 │ │
│ │                                                          │ │
│ │ [+ Create New Assessment]                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ 📋 Tutor Notes for this session:                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ [Text area: Add notes for this session planning...]      │ │
│ │ [Save Notes]                                             │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Action Buttons:**

- **Preview:** Opens the exercise/activity in read-only mode so the tutor can see exactly what the student will see
- **Add Notes:** Opens an inline text editor to attach tutor notes to the activity (stored as TutorNote linked to the enrollment)
- **Upload Additional Work:** Opens a file upload dialog for physical worksheets or supplementary materials. Files are stored in MinIO/S3 and linked to the student's session enrollment
- **Override →:** Allows the tutor to replace the auto-sequenced activity with a different exercise from the content library (creates a ContentAssignment record)
- **+ Add Activity from Content Library:** Opens the Content Library browser (Section 2.5) filtered to the student's course and assessed level
- **+ Assign New Homework:** Opens the homework assignment form with exercise picker

**Data Query:**

```typescript
// API: GET /api/tutor/sessions/:sessionId/student/:studentId/plan
async function getStudentSessionPlan(sessionId: string, studentId: string) {
  const enrollment = await prisma.studentSessionEnrollment.findFirst({
    where: { sessionId, studentId },
    include: {
      course: true,
      assessedLevel: true,
    },
  });

  // Get auto-sequenced content
  const nextContent = await getNextContent(studentId, enrollment.courseId);

  // Get homework
  const homework = await prisma.homeworkAssignment.findMany({
    where: { studentId, courseId: enrollment.courseId, status: { not: 'GRADED' } },
    include: { exercise: true },
    orderBy: { dueDate: 'asc' },
  });

  // Get assessments
  const assessments = await prisma.assessmentReview.findMany({
    where: {
      OR: [
        { exerciseAttempt: { studentId } },
        { physicalWorkUpload: { studentId } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      assessor: { select: { name: true } },
      exerciseAttempt: { include: { exercise: true } },
    },
  });

  // Get tutor notes
  const notes = await prisma.tutorNote.findMany({
    where: { enrollment: { sessionId, studentId } },
    orderBy: { createdAt: 'desc' },
  });

  return { enrollment, nextContent, homework, assessments, notes };
}
```

---

### 2.3 Lesson Marking

**Purpose:** After a session is over, the tutor selects a specific date and revisits the activities and assessments for each student to review digitally completed work and grade it.

**Initial View — Date Picker + Session Selector:**

```
┌────────────────────────────────────────────────────────────┐
│ ✏️ Lesson Marking                                          │
│                                                            │
│ Select Date: [📅 February 12, 2026 ▼]                      │
│                                                            │
│ Sessions on this date:                                     │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Afternoon Maths & English │ 3:30-4:30 PM │ 8 students │ │
│ │ [Select →]                                             │ │
│ └────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Evening Science Group │ 5:00-6:00 PM │ 6 students     │ │
│ │ [Select →]                                             │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**After selecting a session — Student Marking Queue:**

```
┌────────────────────────────────────────────────────────────┐
│ ✏️ Marking: Afternoon Maths & English │ 12 Feb 2026         │
│                                                            │
│ Filter: [All Courses ▼] [All Statuses ▼] [Search student] │
│                                                            │
│ Progress: 5 of 8 students marked │ ████████░░░ 62%         │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🟢 Jane Smith │ English │ Class 4                     │   │
│ │ Exercises: 3/3 completed │ Avg Score: 82%             │   │
│ │ Status: ✅ All marked                                 │   │
│ │ [Review Marking →]                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🟡 Alex Thompson │ Mathematics │ Class 6              │   │
│ │ Exercises: 2/3 completed │ 1 needs review             │   │
│ │ Status: ⏳ 1 pending                                  │   │
│ │ [Start Marking →]                                     │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🔴 Omar Hassan │ Science │ Class 7                    │   │
│ │ Physical work uploaded │ Not yet reviewed              │   │
│ │ Status: 📷 Physical work needs marking                │   │
│ │ [Start Marking →]                                     │   │
│ └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

**Marking Interface — Split Pane (Canvas SpeedGrader pattern):**

```
┌──────────────────────────┬──────────────────────────────┐
│ Student Work (Left)       │ Grading Panel (Right)        │
│                          │                              │
│ Exercise: Comprehension  │ Score: [__] / 20             │
│ Questions                │                              │
│                          │ Rubric:                      │
│ Q1: What is the main    │ ☑ Content understanding [4/5]│
│ idea?                    │ ☑ Use of evidence      [3/5] │
│ Student: "The passage    │ ☑ Vocabulary           [4/5] │
│ talks about how gardens  │ ☑ Expression           [3/5] │
│ change over seasons..."  │                              │
│ ✅ Correct (auto-graded) │ Feedback:                    │
│                          │ ┌────────────────────────┐   │
│ Q2: Why did the author   │ │ Good comprehension of  │   │
│ use the word "transform"?│ │ the main themes. Work  │   │
│ Student: "Because it     │ │ on supporting your     │   │
│ shows big change"        │ │ answers with specific  │   │
│ ⏳ Needs review          │ │ quotes from the text.  │   │
│                          │ └────────────────────────┘   │
│ Q3: [Worksheet scan]     │                              │
│ ┌────────────────────┐   │ [Save Draft]                 │
│ │ 📷 Physical work   │   │ [Complete Marking →]         │
│ │ [View Full Image]  │   │                              │
│ │ [Open Annotation   │   │ Tutor Notes:                 │
│ │  Tool →]           │   │ ┌────────────────────────┐   │
│ └────────────────────┘   │ │ Jane struggled with    │   │
│                          │ │ inference questions.   │   │
│                          │ │ Plan more practice.    │   │
│ [← Previous Student]     │ └────────────────────────┘   │
│ [Next Student →]         │ [Next Student →]             │
└──────────────────────────┴──────────────────────────────┘
```

**For physical work**, clicking "Open Annotation Tool" opens the Fabric.js canvas overlay where the tutor can:
- Draw freehand marks (red pen for corrections)
- Add stamps (✓, ✗, ⭐, "Well Done")
- Place text comments
- Highlight sections
- The annotations are saved as JSON alongside the original image

**On "Complete Marking":**
- ExerciseAttempt status updates to GRADED
- Score is recorded
- Gamification event fires: XP awarded to student
- Notification sent to student: "Your English work has been marked"
- Notification sent to parent: "Jane's English exercises have been reviewed"
- The exercise appears in the student's "Reviewed Feedback" view (Doc 2, Section 8)

---

### 2.4 History of Sessions

**Purpose:** Search for past sessions by date or student, then drill into the full history of activities for any student.

**Initial View — Search Interface:**

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Session History                                         │
│                                                            │
│ Search by: [Student Name ▼] [________________] [🔍 Search] │
│     or     [📅 Select Date: ____________]                   │
│                                                            │
│ ── Recent Sessions ──                                      │
│                                                            │
│ 12 Feb │ Afternoon Maths & English │ 8 students │ ✅ Marked│
│ 12 Feb │ Evening Science Group │ 6 students │ ⏳ 2 pending │
│ 11 Feb │ Morning English │ 8 students │ ✅ Marked          │
│ 10 Feb │ Afternoon Mixed │ 12 students │ ✅ Marked         │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
```

**After searching for a student — Student Activity Overview:**

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Student History: Jane Smith                              │
│                                                            │
│ ── Enrolled Courses ──                                     │
│                                                            │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📗 English │ Assessed Level: Class 4 │ Since: Sep 2025│    │
│ │ Sessions attended: 42 │ Exercises completed: 156     │    │
│ │ Current unit: Comprehension — Lesson 7              │    │
│ │ Average score: 78% │ Level changes: Cl.2 → Cl.3 → Cl.4│  │
│ │ [View History →]                                    │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                            │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📘 Mathematics │ Assessed Level: Class 3 │ Since: Oct 25│  │
│ │ Sessions attended: 28 │ Exercises completed: 89      │    │
│ │ Current unit: Fractions — Lesson 4                  │    │
│ │ Average score: 72% │ Level changes: Cl.2 → Cl.3    │    │
│ │ [View History →]                                    │    │
│ └─────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

**Clicking "View History"** opens paginated session-by-session history for that course:

```
┌────────────────────────────────────────────────────────────┐
│ Jane Smith — English History                                │
│                                                            │
│ Page 1 of 12 │ Showing 10 per page                        │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 12 Feb 2026 │ Session: Afternoon Maths & English       │ │
│ │ Tutor: Mr. Williams                                    │ │
│ │ Exercises:                                             │ │
│ │   ├── Comprehension: "The Lost Garden" — 85% ✅        │ │
│ │   ├── Vocabulary Matching — 90% ✅                     │ │
│ │   └── Short Answer Questions — 75% ⏳ (in review)     │ │
│ │ Tutor Notes: "Good progress on comprehension..."       │ │
│ │ [View Full Details →]                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 10 Feb 2026 │ Session: Afternoon Maths & English       │ │
│ │ Tutor: Mr. Williams                                    │ │
│ │ Exercises:                                             │ │
│ │   ├── Spelling Test — 78% ✅                           │ │
│ │   └── Reading Log — Completed ✅                       │ │
│ │ Homework submitted: Spelling Practice (on time)        │ │
│ │ [View Full Details →]                                  │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ [← Previous Page] [Page 1] [2] [3] ... [12] [Next →]     │
└────────────────────────────────────────────────────────────┘
```

**Data Query — Paginated:**

```typescript
// API: GET /api/tutor/students/:studentId/history?courseId=xxx&page=1&limit=10
async function getStudentCourseHistory(studentId: string, courseId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    prisma.studentSessionEnrollment.findMany({
      where: { studentId, courseId },
      orderBy: { session: { date: 'desc' } },
      skip,
      take: limit,
      include: {
        session: {
          select: { date: true, scheduledStart: true, scheduledEnd: true },
        },
        activities: {
          include: {
            exercise: { select: { title: true, exerciseType: true, maxScore: true } },
          },
        },
        exerciseAttempts: {
          select: { score: true, maxScore: true, status: true, submittedAt: true },
        },
        physicalUploads: {
          select: { imageUrls: true, createdAt: true },
        },
        tutorNotes: {
          select: { content: true, createdAt: true },
        },
      },
    }),
    prisma.studentSessionEnrollment.count({ where: { studentId, courseId } }),
  ]);

  return { enrollments, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

---

### 2.5 Content Library (Full Content of Student Material)

**Purpose:** Tutors can explore all available content organised by course and grade level. They can browse, preview, and assign content to specific students for homework or assessment activities. This allows tutors to select content that may be above or below the student's assessed level to gauge their true level.

**Initial View — Course & Level Browser:**

```
┌────────────────────────────────────────────────────────────┐
│ 📖 Content Library                                         │
│                                                            │
│ Course: [English ▼]  Level: [All Levels ▼]                 │
│ Content Type: [All Types ▼]  Search: [____________] [🔍]   │
│                                                            │
│ ── Class 1 Level ──                                        │
│ Unit 1: Phonics Foundations (12 exercises)        [Expand ▼]│
│ Unit 2: Basic Reading (10 exercises)              [Expand ▼]│
│ Unit 3: Simple Writing (8 exercises)              [Expand ▼]│
│                                                            │
│ ── Class 2 Level ──                                        │
│ Unit 1: Word Recognition (15 exercises)           [Expand ▼]│
│ Unit 2: Sentence Structure (12 exercises)         [Expand ▼]│
│ ...                                                        │
│                                                            │
│ ── Class 3 Level ──                                        │
│ Unit 1: Paragraph Reading (14 exercises)          [Expand ▼]│
│ ...                                                        │
│                                                            │
│ ── Class 4 Level ──  ← Jane's assessed level               │
│ Unit 1: Story Comprehension (16 exercises)        [Expand ▼]│
│ Unit 2: Grammar Foundations (12 exercises)         [Expand ▼]│
│ Unit 3: Comprehension (10 exercises)              [Expand ▼]│
│   ├── Lesson 1: Finding Main Ideas (3 exercises)           │
│   ├── Lesson 2: Making Predictions (3 exercises)           │
│   ├── Lesson 3: Identifying Themes (2 exercises)           │
│   └── Lesson 4: Inferring Meaning (2 exercises)            │
│                                                            │
│ ── Class 5 Level ──                                        │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
```

**Expanding a lesson shows exercises with actions:**

```
Lesson 7: Inferring Meaning
├── Exercise 1: Reading Passage — "The Lost Garden"
│   Type: Reading + Comprehension │ Questions: 5 │ Max Score: 20
│   [Preview] [Assign as Homework →] [Assign as Assessment →]
│
├── Exercise 2: Vocabulary Matching
│   Type: Matching │ Questions: 10 │ Max Score: 10
│   [Preview] [Assign as Homework →] [Assign as Assessment →]
│
└── Exercise 3: Short Answer Questions
    Type: Short Answer │ Questions: 4 │ Max Score: 16
    [Preview] [Assign as Homework →] [Assign as Assessment →]
```

**"Assign as Homework"** opens a student picker:

```
┌────────────────────────────────────────────────┐
│ Assign Homework                                │
│                                                │
│ Exercise: Vocabulary Matching (Class 4, Unit 3)│
│                                                │
│ Select Students:                               │
│ ☑ Jane Smith (English, Class 4) — matches      │
│ ☐ Liam Cooper (English, Class 2) — below level │
│ ☐ Priya Patel (Maths only) — different course  │
│                                                │
│ Due Date: [📅 16 Feb 2026]                      │
│ Notes: [Optional instructions for the student] │
│                                                │
│ [Cancel] [Assign Homework]                     │
└────────────────────────────────────────────────┘
```

**"Assign as Assessment"** follows the same flow but creates an assessment activity rather than homework (see Section 2.6).

The key feature of the Content Library is that tutors can **browse content at ANY grade level**, not just the student's assessed level. This allows tutors to:
- Assign lower-level content to diagnose gaps
- Assign higher-level content to test readiness for advancement
- Use content from different levels as formal assessments to determine the student's true assessed age

---

### 2.6 Create Assessment for Student

**Purpose:** Tutors, Assessors, and Supervisors can create structured assessments to determine or update a student's assessed level in a specific subject.

**Step 1 — Select Student and Subject:**

```
┌────────────────────────────────────────────────────────────┐
│ 📝 Create Assessment                                        │
│                                                            │
│ Student: [Search or select student ▼]                      │
│          → Jane Smith selected                             │
│                                                            │
│ Subject: [English ▼]                                       │
│                                                            │
│ Subject Components:                                        │
│ ☑ Reading                                                  │
│ ☑ Comprehension                                            │
│ ☑ Spelling                                                 │
│ ☐ Early Reading (typically for Class 1-2)                  │
│ ☐ Creative Writing                                         │
│ ☐ Grammar                                                  │
│                                                            │
│ Assessment Purpose:                                        │
│ ○ Initial Placement (new student)                          │
│ ● Progress Review (existing student)                       │
│ ○ Level Advancement Test                                   │
│ ○ Diagnostic (identify specific gaps)                      │
│                                                            │
│ [Next: Select Content →]                                   │
└────────────────────────────────────────────────────────────┘
```

**Subject components vary by course:**

| Course | Components |
|--------|-----------|
| English | Reading, Comprehension, Spelling, Early Reading, Creative Writing, Grammar, Vocabulary, Punctuation |
| Mathematics | Basic Arithmetic, Fractions, Decimals, Geometry, Algebra, Word Problems, Mental Maths, Advanced |
| Science | Biology, Chemistry, Physics, Environmental Science, Scientific Method, Lab Skills |

**Step 2 — Select Assessment Content:**

The system auto-suggests exercises based on the student's current assessed level, testing both at-level and slightly above/below:

```
┌────────────────────────────────────────────────────────────┐
│ 📝 Assessment Content — Jane Smith, English                 │
│                                                            │
│ Current assessed level: Class 4                            │
│                                                            │
│ ── Recommended Assessment Exercises ──                     │
│                                                            │
│ Reading (testing at Class 4-5):                            │
│ ☑ Reading Passage: "The Winter Garden" (Class 4, 15 min)  │
│ ☑ Reading Passage: "Ocean Explorers" (Class 5, 15 min)    │
│                                                            │
│ Comprehension (testing at Class 3-5):                      │
│ ☑ Comprehension Quiz: Inference (Class 3, 10 min)         │
│ ☑ Comprehension Quiz: Analysis (Class 4, 10 min)          │
│ ☑ Comprehension Quiz: Synthesis (Class 5, 15 min)         │
│                                                            │
│ Spelling (testing at Class 4-5):                           │
│ ☑ Spelling Test: Common Words (Class 4, 10 min)           │
│ ☑ Spelling Test: Advanced Words (Class 5, 10 min)         │
│                                                            │
│ Total estimated time: 85 minutes                           │
│ Total exercises: 7                                         │
│                                                            │
│ [+ Add from Content Library]                               │
│ [+ Upload Custom Assessment]                               │
│                                                            │
│ Schedule: ○ Next session │ ○ Specific date: [📅____]       │
│           ● Immediate (start now)                          │
│                                                            │
│ [Back] [Create Assessment →]                               │
└────────────────────────────────────────────────────────────┘
```

**Step 3 — Assessment Execution:**

The assessment can be:
- **Digital:** Student completes exercises on-screen (same as normal exercise flow, but flagged as assessment)
- **Physical:** Tutor prints worksheets, student completes on paper, tutor uploads scans via QR code
- **Mixed:** Some components digital, some physical

**Step 4 — Assessment Review & Level Update:**

After all exercises are completed and graded:

```
┌────────────────────────────────────────────────────────────┐
│ 📊 Assessment Results — Jane Smith, English                 │
│                                                            │
│ Overall Score: 76% (152/200)                               │
│                                                            │
│ Component Breakdown:                                       │
│ ├── Reading:        85% (Class 4-5 range) ✅               │
│ ├── Comprehension:  72% (Class 4 level)   ─               │
│ └── Spelling:       70% (Class 3-4 range) ⚠️               │
│                                                            │
│ Current Assessed Level: Class 4                            │
│ Recommended Level: Class 4 (maintain)                      │
│                                                            │
│ Assessor Decision:                                         │
│ ○ Maintain at Class 4                                      │
│ ○ Advance to Class 5                                       │
│ ○ Adjust to Class 3 (remedial)                             │
│ ● Custom: Reading=Cl.5, Comprehension=Cl.4, Spelling=Cl.3 │
│                                                            │
│ Assessor Notes:                                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Strong reading skills, ready for Class 5 material.   │   │
│ │ Comprehension is solid at current level. Spelling    │   │
│ │ needs additional practice at Class 3-4 level before  │   │
│ │ advancing.                                           │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│ [Save as Draft] [Confirm & Update Profile →]               │
└────────────────────────────────────────────────────────────┘
```

**On "Confirm & Update Profile":**
- SubjectAssessment record updated with new assessed level
- AcademicProfileLog entry created with previous/new levels, reason, and assessor
- Content sequencing engine immediately serves content at the new level
- Notification to parent: "Jane's English assessment is complete. Reading level: Class 5, Spelling level: Class 3"
- Gamification: If level advanced, award Mastery XP and check for Rising Star badge

---

## 3. Real-Time Session Dashboard (from "Enter Session Dashboard")

When the tutor clicks "Enter Session Dashboard" from Current Day Sessions, they enter the full monitoring interface:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🟢 LIVE SESSION │ Afternoon Maths & English │ 42:18 remaining   │
│ [Mark All Attendance ▼] [Broadcast Message] [End Session]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🚨 Help Requests (2)                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔴 Omar Hassan │ "I don't understand Q3" │ 3 min ago │ [Go]│ │
│ │ 🔴 Liam Cooper │ "Need help with spelling" │ 1 min │ [Go] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│ │ Jane │ │ Alex │ │Priya │ │ Omar │ │ Liam │ │Sophie│ │ Dev  ││
│ │ 🟢   │ │ 🟢   │ │ 🟢   │ │ 🔴   │ │ 🔴   │ │ 🟡   │ │ 🟢   ││
│ │ Eng  │ │ Math │ │ Math │ │ Sci  │ │ Eng  │ │ Sci  │ │ Sci  ││
│ │ Cl.4 │ │ Cl.6 │ │ Cl.3 │ │ Cl.7 │ │ Cl.2 │ │ Cl.5 │ │ Cl.8 ││
│ │──────│ │──────│ │──────│ │──────│ │──────│ │──────│ │──────││
│ │Ex3/8 │ │Ex5/6 │ │Ex2/4 │ │Ex1/5 │ │Ex4/7 │ │ Idle │ │Ex3/3 ││
│ │ 85%  │ │ 72%  │ │ 90%  │ │ HELP │ │ HELP │ │ 0min │ │ Done ││
│ │12min │ │ 8min │ │15min │ │ 5min │ │ 3min │ │ 0min │ │22min ││
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘│
│                                                                 │
│ Stats: 🟢 Working: 4 │ 🔴 Need Help: 2 │ 🟡 Idle: 1 │ ✅ Done: 1│
└─────────────────────────────────────────────────────────────────┘
```

**Clicking any student tile** opens a detail panel showing their current exercise, answers so far, and action buttons (assign next, send message, mark, add note).

**For video sessions**, each tile optionally shows a small video thumbnail of the student. The tutor's own camera is broadcast to all students as a PiP overlay on their exercise page.

---

## 4. QR Code and Physical Work Upload Workflow

### QR-Based Workflow for Physical Worksheets

**Generation:** Before a session, worksheets can be printed with QR codes. Each QR encodes: `AE-{studentId}-{exerciseId}-{sessionDate}`

**Scanning Interface:**

```
┌────────────────────────────────────────────────┐
│ 📷 Scan Student Work                            │
│                                                │
│ ┌────────────────────────────┐                 │
│ │                            │                 │
│ │     [Camera Viewfinder]    │                 │
│ │     ┌──────────────┐       │                 │
│ │     │ Align QR code│       │                 │
│ │     │   here       │       │                 │
│ │     └──────────────┘       │                 │
│ │                            │                 │
│ └────────────────────────────┘                 │
│                                                │
│ Or enter manually:                             │
│ Student: [Search by name or ID ▼]              │
│ Exercise: [Select exercise ▼]                  │
│                                                │
│ ── Scan Queue (3 scanned) ──                   │
│ ✅ Jane Smith — Comprehension Ex.1             │
│ ✅ Alex Thompson — Fractions Ex.3              │
│ ✅ Omar Hassan — Science Worksheet             │
│                                                │
│ [Upload All →] [Clear Queue]                   │
└────────────────────────────────────────────────┘
```

After scanning, the tutor photographs the work, which uploads to storage and enters the marking queue.

---

## 5. Annotation Workspace

When marking physical work (scanned images), the tutor uses the annotation workspace built on Fabric.js:

**Toolbar:**
- 🖊️ Freehand Pen (red default, colour picker, width slider)
- 🔆 Highlighter (semi-transparent strokes)
- 💬 Text Comment (click to place, type comment)
- ⭐ Stamps (✓ checkmark, ✗ cross, ⭐ star, "Well Done", "Try Again", custom stamps)
- 🎙️ Voice Comment (record up to 3 min, attach to a point on the document)
- ↩️ Undo / ↪️ Redo
- 🗑️ Eraser (annotation layer only)

**Storage:** Fabric.js canvas state is serialized as JSON and stored in the `annotations` field of `ScannedDocument`. The original image is never modified.

---

## 6. Supervisor and Assessor Access

**Supervisors** see the same tutor portal navigation but with additional capabilities:
- Can view ANY tutor's sessions (not just their own)
- Can enter any session's dashboard as an observer
- Can conduct sessions themselves (acting as tutor)
- Can create assessments (acting as assessor)
- Can update academic profiles directly
- See additional analytics: tutor performance, centre-wide attendance, at-risk students

**Assessors** see a subset of the tutor portal:
- Assessment queue (all pending work to review)
- Create Assessment
- History of Sessions (read-only, to understand student context)
- Content Library (read-only, for assessment planning)
- Cannot conduct sessions or mark attendance

The permission composition model from the Architecture document (Doc 1) ensures that role capabilities are enforced at the API level, not just the UI level.
