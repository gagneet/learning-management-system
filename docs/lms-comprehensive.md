# LMS Platform Blueprint (Students + Tutors, Group Classroom First)

This document turns the existing LMS overview into a **full, build-ready Markdown blueprint** with added business + product context, end‑to‑end workflows, and missing modules needed for a **hybrid, group-classroom tutoring model**:

- **Group classroom** (tutor + students in a physical room, each student on their own laptop/desktop)
- **Remote classroom** (live online)
- **Catch‑up mode** (missed class → self-paced homework + optional remote/physical catch-up, based on tutor availability)
- **Multi‑centre / multi‑region** with strict tenant isolation and admin oversight
- **Academic intelligence** + accessibility-first design

This aligns with the multi‑tenant LMS implementation and feature inventory already in your repo docs (Next.js + Prisma + PostgreSQL, RBAC, course hierarchy, dashboards, analytics). fileciteturn0file0L1-L44 fileciteturn0file2L1-L58

---

## 1) Product Definition

### 1.1 What you’re building
You’re not building “just an LMS” — you’re building a **Centre-Based Tutoring Operating System** (multi-centre operations + learning delivery + academic profiling + tutor allocation + financials). fileciteturn0file1L1-L33 fileciteturn0file3L1-L29

### 1.2 Target delivery model (core differentiator)
**Classroom-first group teaching** with flexible attendance modalities:

| Mode | Description | Typical use cases |
|---|---|---|
| In-person group class | Tutor leads in a centre; students follow on their devices | Standard weekly sessions, intensive programs |
| Live remote class | Tutor leads via video provider; students join from home | Remote-only cohorts; tutor travel; weather/transport issues |
| Catch-up: self-paced | Missed lesson becomes a guided “make-up path” | Student illness, travel, schedule clash |
| Catch-up: tutor-led | 1:1 or small group catch-up (remote or in-person) | Struggling students; assessment recovery |

**Rule:** every scheduled lesson should be able to generate a **catch-up package** automatically (resources + tasks + checkpoint + optional live catch-up session slot).

---

## 2) Personas & Roles (RBAC)

### 2.1 Roles
Your repo already defines RBAC and the multi-centre roles. fileciteturn0file0L11-L24 fileciteturn0file2L12-L48  
Recommended roles for the tutoring model:

- **Global Admin (Super Admin):** cross-centre control, templates, global analytics, pricing models
- **Centre Admin:** onboarding + compliance + centre-wide reporting
- **Centre Supervisor:** class/tutor allocation, capacity, schedule oversight, performance QA
- **Tutor/Teacher:** lesson plans, marking, session delivery, student interventions
- **Student:** learning + submissions + progress + communication
- **Parent/Guardian (optional):** read-only progress + attendance + billing visibility fileciteturn0file1L53-L58

### 2.2 Permission principles
- **Least privilege** by default
- **Tenant isolation** always (centre_id enforced at query level)
- **Auditability** for grade changes, attendance edits, financial adjustments

---

## 3) Core Domain Model (What’s missing + how it fits)

Your current implementation includes Centers, Users, Course/Module/Lesson/Content, Enrollment, Progress. fileciteturn0file0L111-L125 fileciteturn0file2L147-L163  
To support the group-classroom + hybrid/catch-up model, add these first-class objects:

### 3.1 Classes & Cohorts
A **Course** is curriculum. A **Class** is a running cohort with a schedule.

- **Class (Cohort)**
  - course_id
  - centre_id
  - tutor_id (primary) + assistant_tutor_ids (optional)
  - capacity (seat limit)
  - delivery_mode default (in-person/remote/hybrid)
  - term dates, timezone, room (for centre)
- **ClassMembership**
  - class_id, student_id
  - membership_status (active, paused, completed)
  - accommodations (extra time, sensory mode, language)

### 3.2 Sessions (Scheduled lesson occurrences)
- **Session** = a scheduled occurrence of a lesson for a class (e.g., “Week 4 – Fractions – Tue 4pm”)
  - class_id, lesson_id
  - starts_at, ends_at
  - delivery_mode actual (in-person/remote)
  - room_id (if in-person)
  - video_provider (if remote)
  - join_url, recording_url, transcript_id
  - status: scheduled / live / completed / cancelled

### 3.3 Attendance & Participation (critical for centre operations)
- **AttendanceRecord**
  - session_id, student_id
  - present / late / excused / absent
  - participation_score (optional)
  - notes (behaviour, engagement)
- **SeatMap (optional)**
  - session_id, student_id → seat_id (useful for in-person supervision)

### 3.4 Catch‑Up Package (missed class conversion)
- **CatchUpPackage**
  - session_id (missed)
  - student_id
  - generated_at
  - resources: {content_ids}
  - tasks: {quiz_ids, worksheet_ids, reflection_prompts}
  - checkpoint: {mini-assessment}
  - tutor_followup_required (bool)
  - recommended_mode (self-paced vs tutor-led)
- **CatchUpSession**
  - student_id, tutor_id
  - provider + join_url (or centre room)
  - links to CatchUpPackage

### 3.5 Assessments & Marking (beyond “quiz content items”)
- **Assessment**
  - type: quiz / assignment / worksheet / oral / project
  - rubric_id (optional)
  - auto_grade_supported (bool)
- **Submission**
  - assessment_id, student_id
  - content_url (file), answers_json, attempt_no
  - submitted_at
- **Grade**
  - submission_id
  - score, max_score
  - rubric_breakdown_json
  - feedback_text + feedback_audio_url
  - graded_by, graded_at
  - audit trail events

### 3.6 Academic Profile (your “Academic Intelligence Engine”)
Already in your docs: academic age tracking, comprehension index, and trend analytics. fileciteturn0file1L118-L134 fileciteturn0file3L33-L52  
Minimum viable model:

- **AcademicProfile**
  - reading_age, numeracy_age, comprehension_index, writing_level
  - baseline_date
  - accommodations
- **SkillMap**
  - skill_id, mastery_level, last_evaluated
- **InterventionPlan**
  - triggers, actions, tutor tasks, parent notes (optional)

### 3.7 Communications (needed for classroom ops)
- **Announcements**
  - class_id (or course_id)
  - scheduled publish
- **Messages**
  - tutor ↔ student
  - centre announcements
- **Notifications**
  - email/SMS/push (pluggable)

---

## 4) Learning Experience Design (Group classroom on devices)

### 4.1 Classroom flow: “Tutor-led + device-guided”
Every session has:
1. **Tutor agenda** (what to teach, demos, timing)
2. **Student device path** (slides/video/worksheet/interactive tasks)
3. **Checkpoint** (quick quiz or micro-task)
4. **Marking pipeline** (auto where possible; tutor review where needed)

### 4.2 Lesson artifact pack
For each Lesson:
- “Teacher notes” (private)
- “Student handout” (device-friendly)
- Activities (H5P/SCORM/xAPI)
- Quiz checkpoint
- Homework assignment (optional)
- Catch-up generator rules

### 4.3 Catch-up rules (recommended defaults)
When a student is marked “Absent”:
- Auto-create **CatchUpPackage**
- Notify student (+ parent optionally)
- Add “Catch-up pending” to tutor “My Day”
- If student has 2 consecutive missed sessions → escalate to Supervisor task

---

## 5) UX / Portals (What each user sees)

Your docs already outline portal goals and dashboards. fileciteturn0file1L34-L75 fileciteturn0file2L68-L111  
Below extends it for group-classroom + catch-up:

### 5.1 Student Portal
**Home**
- Today’s classes (join/in-room)
- Catch-up tasks (if missed)
- Progress by subject
- XP + badges + streak
- “Ask for help” (message tutor)

**Class view**
- Session list (past + upcoming)
- Attendance history
- Resources + submissions
- Transcripts/recordings (if enabled)

### 5.2 Tutor Portal
**My Day**
- Today’s sessions (with mode + room/join)
- Attendance to take
- Marking queue
- Catch-up requests
- “At-risk” alerts (performance drop / repeated absences)

**Lesson Planner**
- Drag/drop agenda + resources (as per your vision) fileciteturn0file1L92-L108
- Build templates: “Week lesson template”, “Exam prep template”

### 5.3 Centre Supervisor
- Unallocated students + tutor matching
- Class capacity map
- Attendance trends, tutor utilisation, intervention queue
- Centre performance snapshot (learning + finance) fileciteturn0file1L109-L163

### 5.4 Global Admin
- Centre provisioning + branding
- Curriculum template publishing
- Global reports (region, revenue, learning outcomes)
- Multi-language management fileciteturn0file1L66-L75

---

## 6) Video + Transcription Integrations (Teams first, pluggable)

### 6.1 Design principle: pluggable providers
Keep your adapter pattern:

```
VideoService
  createMeeting(session)
  getJoinUrl(session)
  endMeeting(session)
  listTranscripts(session)
  fetchTranscript(transcriptId)
```

(As already described in your technical blueprint.) fileciteturn0file1L210-L236

### 6.2 Microsoft Teams (Graph API) — recommended integration points
**Scheduling:** create an online meeting for the tutor (delegated) and store join URL on Session. Microsoft Graph supports `POST /users/{userId}/onlineMeetings`. citeturn0search0

**Transcripts/recordings:** use the post-meeting transcript flow and permissions. Microsoft’s Teams platform guidance covers getting notified and then fetching transcripts/recordings. citeturn0search1

**Transcript API:** Graph supports listing transcripts on an onlineMeeting and then retrieving transcript content via the callTranscript APIs. citeturn0search9turn0search5

> Practical note: for production, plan for **meeting-specific consent (RSC)** vs org-wide access depending on the customer’s tenant governance. citeturn0search1

### 6.3 LTI 1.3 (optional but strategic)
If you want future interoperability with other LMS ecosystems and external tools, implement LTI 1.3 for secure launches and grade passback. citeturn0search3turn0search11

---

## 7) Multi‑Tenancy, Data Isolation, and Performance

You already have multi-tenancy as a first-class feature. fileciteturn0file0L11-L18 fileciteturn0file2L3-L11  
To harden it for real centres:

### 7.1 Tenant isolation options
- **Shared DB + centre_id + Row Level Security (RLS)** (recommended for most)
- Schema-per-centre (more isolation, more ops)
- DB-per-centre (enterprise isolation)

Your technical doc already recommends shared DB + strict tenant filtering/RLS. fileciteturn0file1L171-L178

### 7.2 Performance targets & tactics
Your docs target large concurrency and sub-300ms APIs. fileciteturn0file1L297-L305 fileciteturn0file3L78-L87  
Add:
- Read-heavy caching for catalog + lesson metadata (Redis)
- Background jobs for transcript ingestion, video processing, and analytics rollups
- CDN for static assets + video streaming manifests

---

## 8) Accessibility & Special Needs (Non-negotiable)

You have an accessibility-first strategy already. fileciteturn0file1L164-L188  
Update it to reference **WCAG 2.2** as the baseline spec and maintain AA compliance. citeturn0search2

### 8.1 Platform-level accessibility controls
- Font size, spacing, dyslexia-friendly fonts
- High contrast and reduced motion
- Keyboard-first navigation + focus visibility (WCAG 2.2 adds focus-related refinements) citeturn0search13
- Captions + transcripts on all recorded sessions

### 8.2 Learning accommodations (data model)
Store **AccessibilitySettings** + **Accommodations** per student:
- extra time multipliers
- sensory mode defaults
- preferred language
- read-aloud toggle
- simplified UI mode (reduced clutter)

---

## 9) Financial Engine (Centre-ready)

Your vision includes student billing, tutor payroll, and centre margin reporting. fileciteturn0file1L135-L163 fileciteturn0file3L54-L63  
Minimum viable set:

### 9.1 Billing
- Plans: weekly, term, subscription
- Invoices + receipts
- Refunds/credits
- Payment gateway integration (Stripe recommended for AU; can add others)

### 9.2 Tutor payroll
- Pay rules: per session, per hour, bonus rules
- Export to accounting/payroll systems
- Tutor utilisation % and payout previews

### 9.3 Centre P&L
- Revenue vs tutor costs vs overheads
- Profit margin by month/term
- Forecast based on enrolment + schedule

---

## 10) Implementation Roadmap (Phased delivery)

Your docs already propose a 3‑phase roadmap. fileciteturn0file1L330-L356 fileciteturn0file3L173-L205  
Below is a version tuned to group-classroom + catch-up:

### Phase 1 — Classroom Core (MVP that centres can run)
- Multi-tenant + RBAC hardening (tenant guardrails + audit logs)
- Class/Cohort + Session scheduling
- Attendance + Catch-up package generator
- Tutor “My Day” + Student dashboard essentials
- Teams meeting creation + join + basic transcript storage

### Phase 2 — Academic Intelligence + Marking
- Assessments + submissions + gradebook + rubrics
- Academic profile engine + growth charts + at-risk alerts
- Gamification (XP, badges, streaks) fileciteturn0file1L154-L163
- Centre supervisor dashboard + tutor allocation tooling

### Phase 3 — Scale + Franchise + Advanced Integrations
- Multi-region deployment patterns
- External tool integrations via LTI 1.3
- Advanced accessibility modes + assistive tech pathways
- AI-assisted insights (recommendations, anomaly detection)

---

## 11) Concrete “Missing Pieces” Checklist

Based on what’s already implemented (courses, content, enrollments, progress, dashboards, analytics) fileciteturn0file2L1-L140, the most impactful gaps for your tutoring model are:

1. **Class/Cohort + Session scheduling** (separate from Course/Lesson)
2. **Attendance + participation**
3. **Catch-up packages** (auto-generated learning paths for missed sessions)
4. **Assessment/Submission/Gradebook**
5. **Tutor My Day queue** (marking + catch-up + at-risk alerts)
6. **Supervisor capacity + allocation tooling**
7. **Transcripts/recordings ingestion pipeline** (post-meeting workflow)
8. **Financial engine** (billing + payroll + centre P&L)
9. **Audit logs** (grades, attendance, payments)
10. **Notification system** (email/SMS/push, pluggable)

---

## 12) Alignment with Your Current Codebase

Your repo documentation indicates:
- Next.js + React + TypeScript, Prisma + PostgreSQL fileciteturn0file0L1-L10
- Multi-tenancy, RBAC, course hierarchy, progress tracking fileciteturn0file2L1-L67
- Production deployment via Nginx + PM2 + Cloudflare Tunnel fileciteturn0file0L146-L171

The additions in this blueprint (Class/Session/Attendance/Catch-up/Gradebook) plug naturally into your current model without replacing it — they **extend** it to match the real-world centre teaching workflow.

---

## Appendix A — Mermaid: Extended ERD (Classroom + Catch-up)

```mermaid
erDiagram
  CENTRE ||--o{ USER : has
  CENTRE ||--o{ COURSE : offers
  COURSE ||--o{ MODULE : contains
  MODULE ||--o{ LESSON : contains
  COURSE ||--o{ CLASS : runs_as
  CLASS ||--o{ CLASS_MEMBERSHIP : has
  CLASS ||--o{ SESSION : schedules
  SESSION ||--o{ ATTENDANCE_RECORD : tracks
  SESSION ||--o{ CATCHUP_PACKAGE : generates
  SESSION ||--o{ TRANSCRIPT : produces

  LESSON ||--o{ CONTENT : includes
  LESSON ||--o{ ASSESSMENT : evaluates
  ASSESSMENT ||--o{ SUBMISSION : receives
  SUBMISSION ||--|| GRADE : results_in

  USER ||--o{ ACADEMIC_PROFILE : owns
  USER ||--o{ ENROLLMENT : participates

  CLASS_MEMBERSHIP {
    uuid id
    uuid class_id
    uuid student_id
    string status
  }

  SESSION {
    uuid id
    uuid class_id
    uuid lesson_id
    datetime starts_at
    string delivery_mode
    string provider
  }

  CATCHUP_PACKAGE {
    uuid id
    uuid session_id
    uuid student_id
    string status
  }
```

---

## Appendix B — Suggested API Surface (High level)
- `/api/classes` (create/update/list)
- `/api/classes/{id}/members`
- `/api/sessions` (schedule, cancel, start, complete)
- `/api/sessions/{id}/attendance`
- `/api/sessions/{id}/catchup` (generate + status)
- `/api/assessments` / `/api/submissions` / `/api/grades`
- `/api/integrations/video/{provider}` (create meeting, list transcripts)
- `/api/finance/invoices` / `/api/finance/payments` / `/api/finance/payouts`

---

## Appendix C — Operational Policies (Centre playbook)
- Attendance must be taken within X minutes of session start
- Catch-up packages are generated automatically on absent mark
- Tutor must review catch-up completion within Y days
- Supervisor review triggered after 2 missed sessions or performance drop threshold
- Recordings/transcripts retention policy per centre (privacy + consent)
