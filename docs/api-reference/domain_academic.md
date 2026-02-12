# Centre-Based LMS — Domain Specification Pack
Generated: 2026-02-11 (Australia/Sydney)

This pack splits the platform into **5 implementable domain documents** for different teams:
1. Academic Domain
2. Operations Domain
3. Finance Domain
4. Infrastructure Domain
5. Governance Domain

Assumptions (aligned to your current direction):
- Web: Next.js + React + TypeScript
- API: REST (OpenAPI) + async events (queue)
- DB: PostgreSQL (multi-tenant via `centre_id`), Prisma ORM
- Cache/queues: Redis + a worker (BullMQ or equivalent)
- Storage: S3-compatible (or Azure Blob) for files/media
- Video providers: pluggable (Teams first)

Notation:
- `UUID` types are shown as `String @db.Uuid` in Prisma-style examples.
- Every table includes `centre_id` unless it is global/template-level.
- All APIs are shown as REST; GraphQL can sit on top later.

---
# 1) Academic Domain
## Scope
Everything related to teaching/learning delivery:
- Courses, modules, lessons, content
- Classes (cohorts), sessions, attendance
- Assessments, submissions, gradebook, rubrics
- Catch-up packages (missed-class recovery)
- Tutor assignment, transfers, substitution readiness
- Student academic profile + skill mastery

## Key Outcomes
- Tutors can deliver group lessons (in-person/remote) with device-guided paths.
- Students can catch up after missed classes with automated packages.
- Supervisors can assign/move students and preserve history.
- Assessors can baseline-test and place students into correct levels.

---
## 1.1 Core UX/UI (Screens & Flows)

### Student Portal
**Primary pages**
- Home: upcoming sessions + “Join” + catch-up queue + progress snapshot
- Class: session timeline, resources, transcripts/recordings, submissions
- Lesson Player: step-by-step activities (device-guided)
- Catch-up: package checklist + checkpoint assessment
- Assessments: attempts + results + tutor feedback
- Profile: academic level, goals, accommodations, badges/XP

**Key UI components**
- “Today’s Agenda” card
- Lesson stepper (content → activity → checkpoint)
- Submission uploader (files, images, typed answers)
- Progress charts (per subject & skill)

### Tutor Portal
**Primary pages**
- My Day: today’s sessions, attendance pending, marking queue, at-risk alerts
- Class Roster: students + quick level indicators + last lesson notes
- Session Delivery: agenda + live attendance + “push activity to devices” (optional)
- Gradebook: rubric grading + feedback (text/audio)
- Student Profile: skill mastery heatmap + last 5 lessons summary
- Transfers: accept/decline incoming students (with summary pack)

**Key UI components**
- Attendance table with one-click statuses
- Marking queue with filters
- Student “Level badge” + risk chip (e.g., “Needs support”, “2 misses”)

### Supervisor Portal (Academic Lead)
**Primary pages**
- Tutor allocation: matching recommendations + override controls
- Capacity dashboard: class seat map, tutor quotas
- Intervention queue: students flagged by rules
- Assessment pipeline: pending diagnostics and re-marks

### Assessor Portal
**Primary pages**
- New enrolments needing diagnostic
- Assessment delivery (in-centre or remote)
- Marking + placement recommendation
- Placement outcomes + suggested class options

---
## 1.2 Data Model (Prisma-style)
> Minimal implementable schema for classroom + catch-up + transfers.

```prisma
model Centre {
  id        String @id @default(uuid()) @db.Uuid
  name      String
  timezone  String @default("Australia/Sydney")
  status    String @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String? @db.Uuid
  email     String @unique
  fullName  String
  role      String // GLOBAL_ADMIN, CENTRE_ADMIN, SUPERVISOR, TUTOR, ASSESSOR, STUDENT, PARENT
  status    String @default("ACTIVE")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Course {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  title     String
  category  String?
  level     String?
  status    String @default("DRAFT") // DRAFT, PUBLISHED, ARCHIVED
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  modules   Module[]
}

model Module {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  courseId  String @db.Uuid
  title     String
  orderNo   Int
  lessons   Lesson[]
}

model Lesson {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  moduleId  String @db.Uuid
  title     String
  orderNo   Int
  teacherNotes String?
  objectives String?
  content   ContentItem[]
  assessments Assessment[]
}

model ContentItem {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  lessonId  String @db.Uuid
  kind      String // PDF, VIDEO, AUDIO, LINK, H5P, SCORM, TEXT
  title     String
  url       String
  metadata  Json?
  orderNo   Int
}

model ClassCohort {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  courseId  String @db.Uuid
  tutorId   String? @db.Uuid
  capacity  Int @default(12)
  defaultMode String @default("IN_PERSON") // IN_PERSON, REMOTE, HYBRID
  startDate DateTime
  endDate   DateTime?
  room      String?
  status    String @default("ACTIVE")
  members   ClassMembership[]
  sessions  Session[]
}

model ClassMembership {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  classId   String @db.Uuid
  studentId String @db.Uuid
  status    String @default("ACTIVE") // ACTIVE, PAUSED, COMPLETED
  accommodations Json?
  joinedAt  DateTime @default(now())
}

model Session {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  classId   String @db.Uuid
  lessonId  String @db.Uuid
  startsAt  DateTime
  endsAt    DateTime
  mode      String // IN_PERSON, REMOTE
  room      String?
  videoProvider String?
  joinUrl   String?
  recordingUrl String?
  status    String @default("SCHEDULED") // SCHEDULED, LIVE, COMPLETED, CANCELLED
  attendance AttendanceRecord[]
  catchUps  CatchUpPackage[]
}

model AttendanceRecord {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  sessionId String @db.Uuid
  studentId String @db.Uuid
  status    String // PRESENT, LATE, ABSENT, EXCUSED
  participationScore Int?
  notes     String?
  markedBy  String? @db.Uuid
  markedAt  DateTime?
}

model Assessment {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  lessonId  String @db.Uuid
  type      String // QUIZ, ASSIGNMENT, WORKSHEET, ORAL, PROJECT
  title     String
  maxScore  Int
  rubricId  String? @db.Uuid
  settings  Json?
  submissions Submission[]
}

model Submission {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  assessmentId String @db.Uuid
  studentId String @db.Uuid
  attemptNo Int @default(1)
  answers   Json?
  fileUrl   String?
  submittedAt DateTime?
  status    String @default("DRAFT") // DRAFT, SUBMITTED, GRADED
  grade     Grade?
}

model Grade {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  submissionId String @unique @db.Uuid
  score     Int
  rubricBreakdown Json?
  feedbackText String?
  feedbackAudioUrl String?
  gradedBy  String @db.Uuid
  gradedAt  DateTime @default(now())
}

model CatchUpPackage {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  sessionId String @db.Uuid
  studentId String @db.Uuid
  status    String @default("OPEN") // OPEN, IN_PROGRESS, COMPLETED, ESCALATED
  resources Json
  tasks     Json
  checkpoint Json?
  tutorFollowupRequired Boolean @default(false)
  generatedAt DateTime @default(now())
}

model AcademicProfile {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  studentId String @unique @db.Uuid
  baselineAt DateTime?
  readingAge  Float?
  numeracyAge Float?
  comprehensionIndex Float?
  levelLabel  String?
  accommodations Json?
  updatedAt DateTime @updatedAt
}
```

---
## 1.3 APIs (Implementable REST)

### Courses / Content
- GET /api/courses?centreId=&status=
- POST /api/courses
- POST /api/courses/{courseId}/publish
- POST /api/lessons/{lessonId}/content
- GET /api/lessons/{lessonId}

### Classes / Membership
- POST /api/classes
- GET /api/classes/{id}
- POST /api/classes/{id}/members
- DELETE /api/classes/{id}/members/{studentId}
- POST /api/classes/{id}/transfer

### Sessions / Attendance / Catch-up
- POST /api/sessions
- POST /api/sessions/{id}/cancel
- POST /api/sessions/{id}/attendance
- POST /api/sessions/{id}/catchup/generate?studentId=
- GET /api/students/{id}/catchup

### Assessments / Gradebook
- POST /api/assessments
- POST /api/assessments/{id}/submissions
- POST /api/submissions/{id}/grade
- GET /api/classes/{id}/gradebook

---
## 1.4 Policies (Implement as a policy layer)
- Attendance ABSENT → create CatchUpPackage via worker
- 2 consecutive absences → raise “risk” event and notify supervisor
- Tutor compatibility enforced via TutorCapability; override requires justification (Governance)
- Cancellation fallback: convert remote → substitute → redistribute → catch-up (always)

---
## 1.5 Events (Async)
- attendance.marked
- session.cancelled
- catchup.generated
- student.transferred
- assessment.graded
- risk.flagged
