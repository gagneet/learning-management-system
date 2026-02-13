# Architecture patterns for multi-student, multi-course tutoring sessions

AetherLearn's tutoring model — where a single tutor supervises 5–15 students each working on different courses at individually assessed levels — has no off-the-shelf equivalent in existing LMS platforms. **The closest industry analogues are Kumon's worksheet-based supervised sessions, Mathnasium's 1:4 individualized coaching model, and IXL's real-time diagnostic dashboard**, but none combines all three dimensions (multi-subject, multi-level, real-time digital monitoring) in one system. This report provides the complete technical architecture: database schema, real-time communication, content delivery, assessment workflows, RBAC patterns, and migration strategy for the Next.js 16 + Prisma + PostgreSQL modular monolith.

The critical architectural insight is that **the session is a time container, not a content container**. Content delivery, progress tracking, and assessment are all per-student-per-course, decoupled from the session itself. The session merely establishes who supervises whom and when.

---

## 1. The "session container" database schema

The schema pivots from the current `ClassCohort` model (one class, one subject, grouped students) to a student-centric enrollment model where each enrollment links a student to a session AND their specific course and assessed level. Below is the complete Prisma schema.

### Enums

```prisma
enum SessionMode {
  PHYSICAL
  VIDEO
  HYBRID
}

enum SessionStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum EnrollmentStatus {
  ENROLLED
  ATTENDING
  ABSENT
  WITHDRAWN
}

enum ActivityStatus {
  NOT_STARTED
  WORKING
  WAITING_HELP
  COMPLETED
  IDLE
}

enum ExerciseType {
  MULTIPLE_CHOICE
  FILL_IN_BLANK
  SHORT_ANSWER
  LONG_ANSWER
  NUMERICAL
  MATCHING
  WORKSHEET
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  AUTO_GRADED
  UNDER_REVIEW
  GRADED
}

enum HelpRequestStatus {
  PENDING
  ACKNOWLEDGED
  RESOLVED
  CANCELLED
}

enum ContentType {
  READING
  EXERCISE
  WORKSHEET
  VIDEO_LESSON
  INTERACTIVE
}

enum AssessmentStatus {
  PENDING
  IN_REVIEW
  COMPLETED
  RETURNED
}

enum ProfileUpdateType {
  ASSESSMENT_RESULT
  TUTOR_OVERRIDE
  DIAGNOSTIC_TEST
  LEVEL_ADVANCEMENT
  LEVEL_REGRESSION
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}
```

### Core session models

```prisma
model SessionTemplate {
  id            String      @id @default(cuid())
  tutorId       String
  centreId      String
  dayOfWeek     DayOfWeek
  startTime     String      // "16:00" stored as HH:mm
  endTime       String      // "17:00"
  sessionMode   SessionMode
  maxCapacity   Int         @default(15)
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  tutor         User        @relation("TutorTemplates", fields: [tutorId], references: [id])
  centre        Centre      @relation(fields: [centreId], references: [id])
  sessions      TutoringSession[]

  @@index([tutorId])
  @@index([centreId])
  @@index([dayOfWeek])
}

model TutoringSession {
  id              String        @id @default(cuid())
  templateId      String?
  tutorId         String
  centreId        String
  date            DateTime      @db.Date
  scheduledStart  DateTime
  scheduledEnd    DateTime
  actualStart     DateTime?
  actualEnd       DateTime?
  sessionMode     SessionMode
  status          SessionStatus @default(SCHEDULED)
  videoMeetingUrl String?
  videoRoomId     String?       // LiveKit room identifier
  notes           String?       @db.Text
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  template        SessionTemplate? @relation(fields: [templateId], references: [id])
  tutor           User             @relation("TutorSessions", fields: [tutorId], references: [id])
  centre          Centre           @relation(fields: [centreId], references: [id])
  enrollments     StudentSessionEnrollment[]
  helpRequests    HelpRequest[]

  @@unique([templateId, date])
  @@index([tutorId, date])
  @@index([centreId, date])
  @@index([status])
  @@index([date])
}

model StudentSessionEnrollment {
  id               String           @id @default(cuid())
  sessionId        String
  studentId        String
  courseId          String
  assessedLevelId  String
  status           EnrollmentStatus @default(ENROLLED)
  attendanceMarked Boolean          @default(false)
  attendanceTime   DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  session          TutoringSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  student          User             @relation("StudentEnrollments", fields: [studentId], references: [id])
  course           Course           @relation(fields: [courseId], references: [id])
  assessedLevel    GradeLevel       @relation(fields: [assessedLevelId], references: [id])
  activities       StudentSessionActivity[]
  exerciseAttempts ExerciseAttempt[]
  physicalUploads  PhysicalWorkUpload[]
  tutorNotes       TutorNote[]
  contentOverrides ContentAssignment[]

  @@unique([sessionId, studentId, courseId])
  @@index([studentId])
  @@index([sessionId])
  @@index([courseId])
  @@index([status])
}

model StudentSessionActivity {
  id            String         @id @default(cuid())
  enrollmentId  String
  lessonId      String?
  exerciseId    String?
  status        ActivityStatus @default(NOT_STARTED)
  startedAt     DateTime?
  completedAt   DateTime?
  progressPct   Int            @default(0)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  enrollment    StudentSessionEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  lesson        Lesson?                  @relation(fields: [lessonId], references: [id])
  exercise      Exercise?                @relation(fields: [exerciseId], references: [id])

  @@index([enrollmentId])
  @@index([status])
  @@index([lessonId])
  @@index([exerciseId])
}
```

### Academic profile models

The **assessed level** concept is the linchpin — a student's chronological grade (Class 7) differs from their working level per subject (Class 4 English, Class 6 Math). Each `SubjectAssessment` captures one student's level in one course.

```prisma
model SubjectAssessment {
  id                  String    @id @default(cuid())
  studentId           String
  courseId             String
  assessedGradeLevel  Int       // The grade level they're working at
  readingAge          Float?    // In years, e.g., 8.5
  numeracyAge         Float?
  comprehensionLevel  Float?
  writingLevel        Float?
  lastAssessedAt      DateTime  @default(now())
  assessedById        String
  notes               String?   @db.Text
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  student             User      @relation("StudentAssessments", fields: [studentId], references: [id])
  course              Course    @relation(fields: [courseId], references: [id])
  assessedBy          User      @relation("AssessorAssessments", fields: [assessedById], references: [id])
  profileLogs         AcademicProfileLog[]

  @@unique([studentId, courseId])
  @@index([studentId])
  @@index([courseId])
  @@index([assessedGradeLevel])
}

model AcademicProfileLog {
  id                  String            @id @default(cuid())
  studentId           String
  courseId             String
  subjectAssessmentId String
  previousLevel       Int
  newLevel            Int
  updateType          ProfileUpdateType
  reason              String?           @db.Text
  updatedById         String
  assessmentReviewId  String?
  createdAt           DateTime          @default(now())

  student             User              @relation("StudentProfileLogs", fields: [studentId], references: [id])
  course              Course            @relation("CourseProfileLogs", fields: [courseId], references: [id])
  subjectAssessment   SubjectAssessment @relation(fields: [subjectAssessmentId], references: [id])
  updatedBy           User              @relation("UpdatedByLogs", fields: [updatedById], references: [id])
  assessmentReview    AssessmentReview? @relation(fields: [assessmentReviewId], references: [id])

  @@index([studentId, courseId])
  @@index([createdAt])
}
```

### Content hierarchy models

Content follows a strict hierarchy: **Course → GradeLevel → ContentUnit → Lesson → Exercise**. This enables the system to serve content filtered by the student's assessed level.

```prisma
model Course {
  id            String    @id @default(cuid())
  name          String    @unique  // "English", "Mathematics", "Science"
  description   String?   @db.Text
  subjectArea   String
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  units              ContentUnit[]
  enrollments        StudentSessionEnrollment[]
  assessments        SubjectAssessment[]
  rubrics            AssessmentRubric[]
  profileLogs        AcademicProfileLog[] @relation("CourseProfileLogs")
  contentAssignments ContentAssignment[]
}

model GradeLevel {
  id        String    @id @default(cuid())
  level     Int       @unique  // 1, 2, 3... representing Class 1, Class 2...
  label     String             // "Class 1", "Class 2"

  units       ContentUnit[]
  enrollments StudentSessionEnrollment[]
  rubrics     AssessmentRubric[]
}

model ContentUnit {
  id            String    @id @default(cuid())
  courseId       String
  gradeLevelId  String
  sequenceOrder Int
  title         String
  description   String?   @db.Text
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  course        Course     @relation(fields: [courseId], references: [id])
  gradeLevel    GradeLevel @relation(fields: [gradeLevelId], references: [id])
  lessons       Lesson[]

  @@unique([courseId, gradeLevelId, sequenceOrder])
  @@index([courseId, gradeLevelId])
}

model Lesson {
  id            String      @id @default(cuid())
  unitId        String
  sequenceOrder Int
  title         String
  contentType   ContentType
  content       Json        // Structured lesson content
  estimatedMins Int?
  isActive      Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  unit          ContentUnit @relation(fields: [unitId], references: [id], onDelete: Cascade)
  exercises     Exercise[]
  activities    StudentSessionActivity[]
  assignments   ContentAssignment[]

  @@unique([unitId, sequenceOrder])
  @@index([unitId])
}

model Exercise {
  id              String       @id @default(cuid())
  lessonId        String
  sequenceOrder   Int
  exerciseType    ExerciseType
  title           String
  instructions    String?      @db.Text
  questions       Json         // [{question, options?, type}]
  expectedAnswers Json?        // [{answer, acceptableVariants?}]
  maxScore        Int
  timeLimit       Int?         // in minutes
  isAutoGradable  Boolean      @default(false)
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  lesson          Lesson       @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  attempts        ExerciseAttempt[]
  physicalUploads PhysicalWorkUpload[]
  activities      StudentSessionActivity[]
  assignments     ContentAssignment[]

  @@unique([lessonId, sequenceOrder])
  @@index([lessonId])
}
```

### Student work and assessment models

```prisma
model ExerciseAttempt {
  id                  String       @id @default(cuid())
  studentId           String
  exerciseId          String
  sessionEnrollmentId String?
  answers             Json         // [{questionIndex, answer, isCorrect?}]
  score               Float?
  maxScore            Int
  status              AttemptStatus @default(IN_PROGRESS)
  startedAt           DateTime     @default(now())
  submittedAt         DateTime?
  autoGraded          Boolean      @default(false)
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  student             User                      @relation("StudentAttempts", fields: [studentId], references: [id])
  exercise            Exercise                  @relation(fields: [exerciseId], references: [id])
  sessionEnrollment   StudentSessionEnrollment? @relation(fields: [sessionEnrollmentId], references: [id])
  reviews             AssessmentReview[]

  @@index([studentId, exerciseId])
  @@index([sessionEnrollmentId])
  @@index([status])
  @@index([submittedAt])
}

model PhysicalWorkUpload {
  id                  String    @id @default(cuid())
  studentId           String
  exerciseId          String?
  sessionEnrollmentId String?
  imageUrls           String[]  // Array of image URLs in S3/R2
  qrCodeIdentifier    String?   @unique  // Links to physical QR code
  uploadedById        String
  notes               String?   @db.Text
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  student             User                      @relation("StudentPhysicalWork", fields: [studentId], references: [id])
  exercise            Exercise?                 @relation(fields: [exerciseId], references: [id])
  sessionEnrollment   StudentSessionEnrollment? @relation(fields: [sessionEnrollmentId], references: [id])
  uploadedBy          User                      @relation("UploadedPhysicalWork", fields: [uploadedById], references: [id])
  reviews             AssessmentReview[]

  @@index([studentId])
  @@index([qrCodeIdentifier])
  @@index([sessionEnrollmentId])
}

model AssessmentReview {
  id                   String           @id @default(cuid())
  assessorId           String
  exerciseAttemptId    String?
  physicalWorkUploadId String?
  rubricId             String?
  criteriaScores       Json?            // [{criterionName, score, maxScore, comment}]
  overallScore         Float
  maxScore             Float
  feedback             String?          @db.Text
  status               AssessmentStatus @default(PENDING)
  reviewedAt           DateTime?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  assessor             User                @relation("AssessorReviews", fields: [assessorId], references: [id])
  exerciseAttempt      ExerciseAttempt?    @relation(fields: [exerciseAttemptId], references: [id])
  physicalWorkUpload   PhysicalWorkUpload? @relation(fields: [physicalWorkUploadId], references: [id])
  rubric               AssessmentRubric?   @relation(fields: [rubricId], references: [id])
  profileLogs          AcademicProfileLog[]

  @@index([assessorId])
  @@index([exerciseAttemptId])
  @@index([physicalWorkUploadId])
  @@index([status])
}

model AssessmentRubric {
  id            String       @id @default(cuid())
  courseId      String
  gradeLevelId  String
  exerciseType  ExerciseType
  name          String
  criteria      Json         // [{name, description, maxPoints, levels:[]}]
  maxScore      Int
  isActive      Boolean      @default(true)
  createdAt     DateTime     @default(now())

  course        Course       @relation(fields: [courseId], references: [id])
  gradeLevel    GradeLevel   @relation(fields: [gradeLevelId], references: [id])
  reviews       AssessmentReview[]

  @@unique([courseId, gradeLevelId, exerciseType])
}
```

### Interaction and override models

```prisma
model HelpRequest {
  id            String            @id @default(cuid())
  studentId     String
  sessionId     String
  message       String?
  status        HelpRequestStatus @default(PENDING)
  createdAt     DateTime          @default(now())
  acknowledgedAt DateTime?
  resolvedAt    DateTime?
  resolvedById  String?

  student       User              @relation("StudentHelpRequests", fields: [studentId], references: [id])
  session       TutoringSession   @relation(fields: [sessionId], references: [id])
  resolvedBy    User?             @relation("ResolvedHelpRequests", fields: [resolvedById], references: [id])

  @@index([sessionId, status])
  @@index([studentId])
  @@index([createdAt])
}

model TutorNote {
  id            String    @id @default(cuid())
  enrollmentId  String
  tutorId       String
  content       String    @db.Text
  createdAt     DateTime  @default(now())

  enrollment    StudentSessionEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  tutor         User      @relation("TutorNotes", fields: [tutorId], references: [id])

  @@index([enrollmentId])
}

model ContentAssignment {
  id                    String    @id @default(cuid())
  tutorId               String
  studentId             String
  courseId               String
  sessionEnrollmentId   String?
  lessonId              String?
  exerciseId            String?
  overridesAutoSequence Boolean   @default(true)
  reason                String?
  isActive              Boolean   @default(true)
  assignedAt            DateTime  @default(now())

  tutor                 User                      @relation("AssignedByTutor", fields: [tutorId], references: [id])
  student               User                      @relation("AssignedToStudent", fields: [studentId], references: [id])
  course                Course                    @relation(fields: [courseId], references: [id])
  sessionEnrollment     StudentSessionEnrollment? @relation(fields: [sessionEnrollmentId], references: [id])
  lesson                Lesson?                   @relation(fields: [lessonId], references: [id])
  exercise              Exercise?                 @relation(fields: [exerciseId], references: [id])

  @@index([studentId, courseId, isActive])
  @@index([sessionEnrollmentId])
}
```

### Five essential Prisma queries

**Query 1 — Load tutor's session dashboard** (all enrolled students with their courses, levels, current activities, and pending help requests):

```typescript
const sessionDashboard = await prisma.tutoringSession.findUnique({
  where: { id: sessionId },
  include: {
    enrollments: {
      include: {
        student: { select: { id: true, name: true, avatarUrl: true } },
        course: { select: { id: true, name: true } },
        assessedLevel: { select: { level: true, label: true } },
        activities: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            exercise: { select: { title: true, exerciseType: true } },
            lesson: { select: { title: true } },
          },
        },
      },
    },
    helpRequests: {
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    },
  },
});
```

**Query 2 — Get next content** for a student based on assessed level, checking for tutor overrides first:

```typescript
async function getNextContent(studentId: string, courseId: string) {
  // Check tutor override first
  const override = await prisma.contentAssignment.findFirst({
    where: { studentId, courseId, isActive: true, overridesAutoSequence: true },
    orderBy: { assignedAt: 'desc' },
    include: { lesson: true, exercise: true },
  });
  if (override) return { source: 'TUTOR_OVERRIDE', ...override };

  // Get assessed level
  const assessment = await prisma.subjectAssessment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });

  // Find completed exercise IDs
  const completed = await prisma.exerciseAttempt.findMany({
    where: { studentId, status: 'GRADED', exercise: { lesson: { unit: { courseId } } } },
    select: { exerciseId: true },
  });
  const completedIds = completed.map(c => c.exerciseId);

  // Get next uncompleted exercise at assessed level
  const nextExercise = await prisma.exercise.findFirst({
    where: {
      id: { notIn: completedIds },
      isActive: true,
      lesson: {
        isActive: true,
        unit: { courseId, gradeLevel: { level: assessment.assessedGradeLevel } },
      },
    },
    orderBy: [
      { lesson: { unit: { sequenceOrder: 'asc' } } },
      { lesson: { sequenceOrder: 'asc' } },
      { sequenceOrder: 'asc' },
    ],
    include: { lesson: { include: { unit: true } } },
  });

  return { source: 'AUTO_SEQUENCE', exercise: nextExercise };
}
```

**Query 3 — Submit exercise and auto-grade** (transactional):

```typescript
const result = await prisma.$transaction(async (tx) => {
  const exercise = await tx.exercise.findUnique({
    where: { id: exerciseId },
    select: { expectedAnswers: true, maxScore: true, isAutoGradable: true },
  });

  let score = null;
  let status: AttemptStatus = 'SUBMITTED';

  if (exercise.isAutoGradable) {
    score = calculateAutoScore(answers, exercise.expectedAnswers as any);
    status = 'AUTO_GRADED';
  }

  return tx.exerciseAttempt.create({
    data: {
      studentId, exerciseId, sessionEnrollmentId,
      answers, score, maxScore: exercise.maxScore,
      status, submittedAt: new Date(), autoGraded: exercise.isAutoGradable,
    },
  });
});
```

**Query 4 — Assessor reviews work and updates academic profile** (transactional):

```typescript
await prisma.$transaction(async (tx) => {
  const review = await tx.assessmentReview.update({
    where: { id: reviewId },
    data: { overallScore, criteriaScores, feedback, status: 'COMPLETED', reviewedAt: new Date() },
  });

  if (shouldAdvanceLevel) {
    const prev = await tx.subjectAssessment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });

    await tx.subjectAssessment.update({
      where: { studentId_courseId: { studentId, courseId } },
      data: { assessedGradeLevel: newLevel, lastAssessedAt: new Date(), assessedById: assessorId },
    });

    await tx.academicProfileLog.create({
      data: {
        studentId, courseId, subjectAssessmentId: prev.id,
        previousLevel: prev.assessedGradeLevel, newLevel,
        updateType: 'ASSESSMENT_RESULT', updatedById: assessorId,
        assessmentReviewId: review.id, reason,
      },
    });
  }
});
```

**Query 5 — Student's cross-session progress** for the parent portal:

```typescript
const progress = await prisma.subjectAssessment.findMany({
  where: { studentId },
  include: {
    course: { select: { name: true } },
    profileLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
  },
});

const recentSessions = await prisma.studentSessionEnrollment.findMany({
  where: { studentId },
  orderBy: { session: { date: 'desc' } },
  take: 20,
  include: {
    session: { select: { date: true, tutorId: true } },
    course: { select: { name: true } },
    activities: { select: { status: true, progressPct: true } },
    tutorNotes: { select: { content: true, createdAt: true } },
  },
});
```

---

## 2. Real-time session architecture with PartyKit and LiveKit

The tutor dashboard requires live updates from **5–15 students simultaneously**, each pushing activity status changes, exercise progress, and help requests. The student interface needs to receive content assignments and see the tutor's video. Here is the recommended real-time stack.

### Technology choices and rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| **WebSocket transport** | **PartyKit** (Cloudflare) | Each session becomes an isolated "room" — a stateful WebSocket server on Cloudflare's edge. Room-per-session maps perfectly to the tutoring model. Supports both WebSocket AND HTTP endpoints per room. |
| **Video** | **LiveKit** (`@livekit/components-react`) | Open-source WebRTC with first-class React SDK. Free tier covers **50K participant-minutes/month**. Provides `<VideoTrack>` component ideal for a small PiP overlay. |
| **Server state** | **TanStack Query v5** | Manages initial data fetch, caching, and refetching. WebSocket events trigger targeted `invalidateQueries` calls. |
| **Client real-time state** | **Zustand v5** | Handles hot transient state (heartbeats, typing indicators, idle detection) without server roundtrips. Entity-keyed state ensures selective re-rendering. |
| **Fallback** | **SSE via Next.js ReadableStream** | For environments where WebSocket is unavailable. Unidirectional server→client only. |

**PartyKit is the primary recommendation** because its "room" abstraction maps 1:1 to tutoring sessions. The tutor connects to one room for their active session; all 5–15 students connect to the same room. State is held in-memory on the edge server for sub-50ms latency to **95%** of global users. If deploying on Vercel (which doesn't support WebSockets natively), PartyKit runs as a separate Cloudflare service. Alternatively, **Ably** provides a fully managed equivalent with a React hooks SDK.

### WebSocket event schema

```typescript
// Student → Server events
type StudentEvent =
  | { type: 'activity:start'; exerciseId: string; timestamp: number }
  | { type: 'activity:progress'; exerciseId: string; progressPct: number; answeredCount: number }
  | { type: 'activity:complete'; exerciseId: string; score?: number }
  | { type: 'help:request'; message?: string }
  | { type: 'help:cancel' }
  | { type: 'heartbeat'; isActive: boolean }

// Server → Tutor events (broadcast)
type TutorEvent =
  | { type: 'student:update'; studentId: string; activity: ActivitySnapshot }
  | { type: 'student:joined'; studentId: string; enrollment: EnrollmentSnapshot }
  | { type: 'student:left'; studentId: string }
  | { type: 'help:new'; studentId: string; requestId: string; message?: string }
  | { type: 'session:sync'; students: Record<string, StudentState> }

// Tutor → Server → Student events
type TutorAction =
  | { type: 'content:assign'; studentId: string; exerciseId: string }
  | { type: 'help:acknowledge'; requestId: string }
  | { type: 'help:resolve'; requestId: string }
  | { type: 'message:send'; studentId: string; text: string }
  | { type: 'attendance:mark'; studentId: string; status: 'ATTENDING' | 'ABSENT' }
  | { type: 'session:start' }
  | { type: 'session:end' }
```

### State management pattern — the two-layer approach

**TanStack Query handles durable server state** (enrollment data, exercise content, assessment results) with a high `staleTime` of **30 seconds** because WebSocket invalidation handles freshness. **Zustand handles ephemeral real-time state** (which student is typing, heartbeat timestamps, idle detection) that doesn't warrant a server roundtrip.

```typescript
// Zustand store — entity-keyed for selective re-rendering
const useDashboardStore = create<DashboardState>((set) => ({
  students: {} as Record<string, StudentLiveState>,
  updateStudent: (id, update) =>
    set((state) => ({
      students: {
        ...state.students,
        [id]: { ...state.students[id], ...update },
      },
    })),
  batchUpdate: (updates: Map<string, Partial<StudentLiveState>>) =>
    set((state) => {
      const next = { ...state.students };
      updates.forEach((update, id) => { next[id] = { ...next[id], ...update }; });
      return { students: next };
    }),
}));

// Each StudentCard selects ONLY its own data — prevents cascade re-renders
function StudentCard({ studentId }: { studentId: string }) {
  const student = useDashboardStore(
    (state) => state.students[studentId], shallow
  );
  // Only re-renders when THIS student's state changes
}
```

**Batched updates** prevent render storms when multiple students submit progress simultaneously. Incoming WebSocket messages are accumulated in a 150ms window and flushed as a single Zustand `batchUpdate`.

### Video integration — LiveKit PiP component

The student sees their exercise content full-screen with a **small draggable PiP window** showing the tutor's camera. LiveKit's React components make this straightforward:

```typescript
function TutorPiP() {
  const participants = useRemoteParticipants();
  const tutor = participants.find(p => p.identity.startsWith('tutor-'));

  if (!tutor) return null;

  return (
    <div className="fixed bottom-4 right-4 w-48 h-36 rounded-lg
                    overflow-hidden shadow-xl z-50 border-2 border-white
                    cursor-move" draggable>
      <VideoTrack trackRef={{ participant: tutor, source: 'camera' }} />
    </div>
  );
}
```

For the tutor's side, LiveKit provides a grid of optional student video feeds. The tutor publishes their camera; students subscribe. Students optionally publish their camera (configurable per session). **Bandwidth budget**: at **300kbps per video stream** for 15 students, the tutor receives ~4.5 Mbps — manageable on modern broadband. Students only receive the tutor's single stream (~300kbps).

---

## 3. Tutor dashboard and student interface component architecture

### Tutor dashboard component tree

The dashboard follows the **GoGuardian/LanSchool grid pattern** discovered in industry research — a tile grid with drill-down capability. This is the universal pattern across all classroom monitoring tools.

```
<TutorSessionPage>
  ├── <SessionHeader>
  │     ├── SessionTimer (countdown/elapsed)
  │     ├── SessionModeIndicator (PHYSICAL | VIDEO | HYBRID)
  │     ├── AttendanceSummary (12/15 present)
  │     └── SessionControls (Start, End, Broadcast Message)
  │
  ├── <QuickStats>
  │     ├── WorkingCount (green: 8)
  │     ├── NeedingHelpCount (red: 2)
  │     ├── IdleCount (yellow: 1)
  │     └── CompletedCount (blue: 1)
  │
  ├── <StudentGrid>  // CSS Grid: 3-5 columns
  │     └── <StudentCard key={enrollmentId}>  // repeated 5-15x
  │           ├── StatusIndicator (color dot)
  │           ├── StudentAvatar + Name
  │           ├── CourseBadge ("English")
  │           ├── LevelBadge ("Class 4")
  │           ├── CurrentExercise title
  │           ├── ProgressBar (65%)
  │           ├── TimeOnTask ("12 min")
  │           └── QuickActions
  │                 ├── MarkAttendance
  │                 ├── AssignExercise
  │                 ├── SendEncouragement
  │                 └── ViewDetail → opens StudentDetailPanel
  │
  ├── <HelpRequestQueue>  // Sidebar or bottom bar
  │     └── <HelpRequestItem> (student name, time waiting, message)
  │
  └── <StudentDetailPanel>  // Slide-over when tutor clicks a student
        ├── StudentInfo (name, grade, assessed levels)
        ├── CurrentExerciseView (see student's actual work)
        ├── AnswersSoFar (live-updating)
        ├── StudentVideoFeed (if video session)
        ├── DirectMessage input
        ├── SessionHistory (exercises completed today)
        └── AssignNextExercise picker
```

### Student session interface component tree

```
<StudentSessionPage>
  ├── <SessionToolbar>  // Fixed top bar
  │     ├── SessionTimer
  │     ├── CourseName + LevelBadge
  │     ├── ProgressIndicator (exercise 3 of 8)
  │     ├── RaiseHandButton (toggleable, pulses when active)
  │     └── NotificationBell (messages from tutor)
  │
  ├── <ExerciseArea>  // Full main content area
  │     ├── <LessonContent>  // Reading material if applicable
  │     └── <ExerciseRenderer>  // Dynamic based on exercise type
  │           ├── MultipleChoiceExercise
  │           ├── FillInBlankExercise
  │           ├── ShortAnswerExercise
  │           ├── NumericalExercise
  │           └── WorksheetExercise (instructions for physical work)
  │
  ├── <AutoSaveIndicator>  // "Saved 3 seconds ago"
  │
  ├── <TutorPiP>  // Fixed bottom-right, draggable
  │     └── LiveKit VideoTrack (tutor camera)
  │
  └── <TutorMessagePopup>  // Toast notification on tutor message
```

### API endpoint design

```
SESSION MANAGEMENT
  GET  /api/sessions/:id/dashboard        → Full session state for tutor
  GET  /api/sessions/:id/student-view     → Student's session (their enrollment + current exercise)
  POST /api/sessions/:id/start            → Tutor starts session
  POST /api/sessions/:id/end              → Tutor ends session
  POST /api/sessions/:id/attendance       → Mark attendance {studentId, status}

REAL-TIME INTERACTIONS
  POST /api/sessions/:id/help-request     → Student raises hand {message?}
  PATCH /api/help-requests/:id/resolve    → Tutor resolves help request
  POST /api/sessions/:id/message          → Send message {studentId, text}

CONTENT & EXERCISES
  GET  /api/content/next?studentId&courseId → Get next exercise (auto-sequence or override)
  POST /api/exercises/:id/submit           → Submit exercise answers {answers: JSON}
  PATCH /api/enrollments/:id/assign        → Tutor assigns content {exerciseId | lessonId}

ASSESSMENT
  GET  /api/assessment/queue               → Assessor's review queue {filters}
  POST /api/assessment/review              → Submit review {scores, feedback}
  PATCH /api/students/:id/academic-profile → Update assessed level {courseId, newLevel}

PHYSICAL WORK
  POST /api/physical-work/upload           → Upload scan {studentId, exerciseId, images}
  GET  /api/physical-work/scan/:qrCode     → Lookup record from QR code

VIDEO
  GET  /api/sessions/:id/video-token       → Get LiveKit token for session room
```

---

## 4. Assessment workflow and the content feedback loop

The assessment system creates a closed loop: **exercise → submission → assessment → profile update → content adjustment**. This mirrors ALEKS's Knowledge Space Theory approach and IXL's real-time diagnostic system, simplified for a tutor-mediated environment.

### Digital assessment workflow

**Step 1: Auto-grading.** When a student submits answers, objective question types (multiple choice, fill-in-blank, numerical) are auto-graded immediately against stored `expectedAnswers`. The attempt status moves to `AUTO_GRADED`. Subjective questions (short answer, long answer) are flagged as `UNDER_REVIEW` and enter the assessment queue.

**Step 2: Assessment queue.** Assessors see a filterable queue of pending work ordered by submission date. Filters include course, grade level, and urgency (exercises waiting longest appear first). The queue query:

```typescript
const queue = await prisma.exerciseAttempt.findMany({
  where: { status: { in: ['SUBMITTED', 'AUTO_GRADED'] } },
  orderBy: { submittedAt: 'asc' },
  include: {
    student: { select: { name: true } },
    exercise: { include: { lesson: { include: { unit: { include: { course: true, gradeLevel: true } } } } } },
  },
});
```

**Step 3: Review and score.** The assessor sees the student's answers alongside the rubric criteria. For physical work, they view the uploaded photograph and score against the same rubric. All scoring is stored as structured JSON in `criteriaScores`, making rubric application consistent across digital and physical work.

**Step 4: Profile update trigger.** After a configurable threshold — **3 consecutive exercises scored above 80% in the same unit** — the system recommends a level advancement. The assessor confirms or adjusts. The `AcademicProfileLog` creates an immutable audit trail of every level change with the triggering assessment, the assessor, and the reason.

### Physical work assessment via QR codes

Each printed worksheet carries a QR code encoding a compact identifier: `AE-{studentId}-{exerciseId}-{sessionId}`. The workflow:

1. Student completes the physical worksheet during the session
2. Tutor or assessor scans the QR code with their device camera
3. The system resolves the QR to the student record and exercise
4. The tutor uploads a photograph (stored in **Cloudflare R2** or S3)
5. A `PhysicalWorkUpload` record is created, linked by `qrCodeIdentifier`
6. The upload enters the same assessment queue as digital submissions
7. The assessor views the image and scores it using the appropriate rubric

### Content sequencing algorithm

The content selection follows a **mastery-based linear progression** with tutor override capability. This is simpler than ALEKS's knowledge-space approach but appropriate for a tutor-mediated system where tutors can manually intervene:

```
function getNextContent(studentId, courseId):
  1. CHECK tutor override (ContentAssignment where isActive=true)
     → If exists, return the overridden content
  
  2. GET student's assessed level for this course (SubjectAssessment)
  
  3. FIND all exercises at this level, ordered by unit→lesson→exercise sequence
  
  4. FILTER OUT exercises with graded attempts scoring ≥ mastery threshold (80%)
  
  5. FIND the first remaining exercise in sequence
     → If found, return it
  
  6. IF all exercises at current level are mastered:
     → Flag for level advancement review
     → Return first exercise of next level as preview
```

**Manual override handling**: When a tutor assigns specific content via `ContentAssignment`, that content is served next regardless of the auto-sequence. The override can be session-scoped (applies only during the current session) or persistent (applies until completed or deactivated). After the override is completed, the student returns to their auto-sequence position.

### Academic profile metrics

Based on research into tutoring centre assessment practices (Kumon, Kip McGrath, Sylvan), the `SubjectAssessment` model tracks:

- **assessedGradeLevel** (Int) — the core metric; which grade level the student works at in this subject
- **readingAge** (Float) — measured in years (e.g., 8.5 years), applicable to language courses
- **numeracyAge** (Float) — measured in years, applicable to mathematics
- **comprehensionLevel** (Float) — reading comprehension on a normalized scale
- **writingLevel** (Float) — writing proficiency on a normalized scale

These metrics are updated only through the formal assessment review process, never automatically. Every change is logged in `AcademicProfileLog` with the previous value, new value, the assessor who made the change, and the triggering assessment review.

---

## 5. Dual-role RBAC for supervisors

The supervisor dual-role challenge — acting as tutor OR assessor while retaining administrative oversight — requires a **permission composition** model rather than simple role switching. After evaluating four approaches, the recommended pattern uses **composable permission sets with context-aware elevation**.

### The recommended pattern: permission composition with active context

Rather than switching roles (which creates confusion about "which role am I in?"), the supervisor's permission set **inherits all permissions from tutor + assessor + their own supervisor permissions**. The UI adapts based on the **current context** (viewing a session dashboard vs. viewing the assessment queue vs. viewing admin reports), not a role toggle.

```prisma
model UserRole {
  id          String   @id @default(cuid())
  userId      String
  role        Role     // STUDENT, TEACHER, SUPERVISOR, ASSESSOR, ADMIN, PARENT
  centreId    String?  // Scoped to a specific centre
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  centre      Centre?  @relation(fields: [centreId], references: [id])

  @@unique([userId, role, centreId])
  @@index([userId])
}

// Permission definitions
enum Permission {
  // Tutor permissions
  SESSION_CONDUCT
  SESSION_VIEW_STUDENTS
  ATTENDANCE_MARK
  CONTENT_ASSIGN
  HELP_REQUEST_RESPOND
  STUDENT_NOTE_CREATE
  PHYSICAL_WORK_UPLOAD

  // Assessor permissions
  ASSESSMENT_QUEUE_VIEW
  ASSESSMENT_REVIEW
  ACADEMIC_PROFILE_UPDATE
  RUBRIC_MANAGE

  // Supervisor permissions (includes all above + admin)
  CENTRE_MANAGE
  TUTOR_MANAGE
  STUDENT_MANAGE
  REPORTS_VIEW
  REPORTS_EXPORT
  SCHEDULE_MANAGE
  SYSTEM_SETTINGS
}
```

**The permission map**:

| Permission | Teacher | Assessor | Supervisor | Admin |
|-----------|---------|----------|------------|-------|
| SESSION_CONDUCT | ✓ | — | ✓ | ✓ |
| ATTENDANCE_MARK | ✓ | — | ✓ | ✓ |
| CONTENT_ASSIGN | ✓ | — | ✓ | ✓ |
| ASSESSMENT_REVIEW | — | ✓ | ✓ | ✓ |
| ACADEMIC_PROFILE_UPDATE | — | ✓ | ✓ | ✓ |
| CENTRE_MANAGE | — | — | ✓ | ✓ |
| REPORTS_VIEW | Limited | Limited | ✓ | ✓ |

### UI pattern: context-aware navigation

Instead of a "role switcher" dropdown, the supervisor sees a **unified navigation** with sections that naturally group by function. When they click into a session, they get the tutor dashboard. When they navigate to the assessment queue, they get the assessor interface. When they view reports, they get the supervisor analytics. The currently active context is highlighted in the sidebar.

```typescript
// Middleware permission check
function checkPermission(user: User, permission: Permission, context?: { sessionId?: string, centreId?: string }) {
  const userRoles = user.roles; // Array of UserRole
  const permissions = userRoles.flatMap(role => ROLE_PERMISSION_MAP[role.role]);
  
  if (!permissions.includes(permission)) return false;
  
  // Context check: is the user assigned to this session/centre?
  if (context?.sessionId) {
    return user.sessions.some(s => s.id === context.sessionId) ||
           userRoles.some(r => r.role === 'SUPERVISOR' || r.role === 'ADMIN');
  }
  return true;
}
```

### Audit trail for dual-role actions

Every action logs the user's ID AND the permission context under which it was performed. This answers the question "When the supervisor graded this work, were they acting as assessor or as supervisor?"

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  action      String   // "ASSESSMENT_REVIEW", "ATTENDANCE_MARK"
  actingRole  Role     // Which role's permissions authorized this action
  resourceType String  // "ExerciseAttempt", "TutoringSession"
  resourceId  String
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([resourceType, resourceId])
}
```

---

## 6. Migration strategy from ClassCohort to student-centric model

The existing `ClassCohort` → `ClassMembership` → `Session` model assumes grouped, class-based learning. The new model fundamentally changes this to individual enrollments. The migration must be **additive, not destructive** — both models coexist during transition.

### Three-phase migration plan

**Phase 1 — Parallel models (weeks 1–4).** Deploy all new models (`SessionTemplate`, `TutoringSession`, `StudentSessionEnrollment`, etc.) alongside existing `ClassCohort` and `Session` models. New tutoring sessions use the new model exclusively. Existing class-based features continue working unchanged. Add a `legacySessionId` field to `TutoringSession` for backward compatibility during transition.

**Phase 2 — Feature parity (weeks 5–8).** Migrate attendance tracking to work with `StudentSessionEnrollment`. Update parent portal to read from both old and new models. Update gamification to award XP based on new enrollment-level activities. Update reporting to aggregate data from both sources.

**Phase 3 — Deprecation (weeks 9–12).** Migrate historical `ClassCohort` data to the new model structure for reporting continuity. Mark old models as deprecated in Prisma schema with `@@map("legacy_class_cohort")`. Remove old model references from application code. Retain database tables for historical queries.

### Impact on gamification

With students doing different things in the same session, gamification shifts from **class-level to individual-level rewards**:

- **Attendance XP**: Awarded per session enrollment, regardless of course (unchanged)
- **Completion XP**: Awarded per exercise completed, scaled by difficulty level
- **Mastery XP**: Bonus awarded when a student advances a grade level in any subject
- **Consistency XP**: Streak bonuses for attending consecutive sessions
- **Leaderboards**: Offer per-centre overall leaderboards (total XP) and per-course leaderboards (course-specific progress). **Never compare students across different assessed levels** — a Class 3 student and Class 7 student should not compete on the same ranking.

### Impact on parent portal

Parents see a **multi-course progress view** showing each subject their child is enrolled in, with the assessed level, recent session activity, and assessment results per course. The data comes from the `StudentSessionEnrollment` → `StudentSessionActivity` chain plus `SubjectAssessment` records. Each session card in the parent portal shows: date, duration, course worked on, exercises completed, tutor notes for that session.

### Impact on analytics and reporting

Three new reporting dimensions emerge:

- **Per-student cross-course reports**: A student's assessed levels across all courses plotted over time, showing which subjects are progressing and which are stalling
- **Per-tutor workload reports**: How many students per session, distribution of courses/levels managed, student outcomes tracked by supervising tutor
- **Per-centre operations reports**: Session utilization rates, course demand patterns, assessment queue throughput, average time-to-assessment

---

## 7. What the tutoring industry reveals about this model

Research into **Kumon, Mathnasium, Sylvan Learning, and Kip McGrath** — the four largest franchise tutoring operations — confirms that AetherLearn's multi-student, multi-course, multi-level model is standard practice in physical tutoring centres but **virtually unserved by existing digital platforms**.

**Kumon's model is the closest analogue**: students sit in the same room working on individualized worksheet sets at completely different levels. Instructors observe, grade completed worksheets, and decide advancement. Kumon's digital platform (Kumon Connect) auto-delivers assigned worksheets and lets instructors replay student work, but it's proprietary and limited to the Kumon curriculum. **Mathnasium's Radius platform** is an integrated CRM + LMS + scheduling system handling individualized learning plans, but it's similarly proprietary and math-only. **Sylvan's SylvanSync** is the most technically sophisticated — it auto-generates personalized learning plans from diagnostic results and serves contextually appropriate content to teachers' iPads.

The monitoring tools space (GoGuardian, LanSchool, Hāpara) universally uses a **thumbnail grid dashboard** where each student appears as a tile with real-time status. GoGuardian's "Scenes" feature — pushing different browsing rule sets to different student groups — is directly analogous to serving different content to different students in the same session.

From adaptive learning platforms, **IXL's real-time diagnostic strand grouping** is the most applicable pattern. It auto-groups students into proficiency quintiles and generates per-group content recommendations. **ALEKS's Knowledge Space Theory** provides a theoretical foundation for determining what a student is ready to learn next based on their mastery graph — this could inform a future version of AetherLearn's content sequencing.

**The gap in the market**: No existing platform combines (1) multi-subject content delivery, (2) real-time tutor monitoring of individualized student work, (3) integrated assessment with academic profile updates, and (4) franchise centre management. Oases Online comes closest with per-student session notes and auto-generated learning plans, but lacks real-time in-session monitoring. AetherLearn has the opportunity to be the first platform purpose-built for this model.

---

## Conclusion

The architecture presented here treats the tutoring session as a **time container** that holds independent student learning tracks, rather than a content delivery mechanism. This single design principle cascades through every layer: the `StudentSessionEnrollment` model decouples student-course pairings from session groupings; the PartyKit room-per-session pattern provides isolated real-time state for each session; the content sequencing algorithm operates per-student-per-course regardless of session context; and the assessment feedback loop updates individual academic profiles that drive future content selection.

**Three decisions will have the highest architectural impact**: first, choosing PartyKit (or Ably) for WebSocket transport, since Next.js on Vercel cannot host persistent connections natively. Second, implementing the `SubjectAssessment` model as the single source of truth for a student's working level per course — this table is queried on every content delivery request and must be indexed aggressively. Third, running the old `ClassCohort` and new `StudentSessionEnrollment` models in parallel during migration rather than attempting a big-bang cutover.

The complete schema contains **17 models, 10 enums, and 60+ indexes** optimized for the five critical query patterns: loading the tutor's session dashboard, determining next content for a student, submitting and auto-grading exercises, processing assessment reviews with profile updates, and generating parent portal progress views. Every model includes `createdAt`/`updatedAt` timestamps and `cuid()` primary keys for distributed-system compatibility.