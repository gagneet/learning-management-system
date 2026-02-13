# AetherLearn LMS — Doc 4: Administration & Operations

**Supervisor, Centre Admin, Global Admin, Reception, Finance, and Parent Portals**

Doc 4 of 6 · Links to: All roles — governance and information flow layer

---

## 1. Role Hierarchy and Portal Access

| Role | Portal | Primary Function |
|------|--------|-----------------|
| SUPER_ADMIN | Global Console | Multi-centre oversight, platform configuration |
| CENTER_ADMIN | Centre Dashboard | Single-centre management, tutor allocation, finance |
| CENTER_SUPERVISOR | Supervisor Portal | Operational oversight + tutor/assessor capabilities |
| FINANCE_ADMIN | Finance Dashboard | Invoicing, payments, fee plans, financial reporting |
| RECEPTIONIST | Check-In Terminal | Student arrival/departure, session status |
| PARENT | Parent Portal | Child's progress, invoices, communication |

---

## 2. Centre Admin Dashboard

The Centre Admin is the operational manager of a single centre. Their dashboard follows the Arbor MIS pattern: KPI cards at the top, tabbed detail views below.

### KPI Cards (Top Row — Maximum 6)

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Today's   │ │Attendance│ │Outstanding│ │ Tutor    │ │ At-Risk  │ │ Open     │
│ Sessions  │ │ Rate     │ │ Invoices │ │Utilisation│ │ Students │ │ Tickets  │
│    12     │ │  87% ↑   │ │  £4,230  │ │   78%    │ │    3 ⚠️  │ │    5     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Tabbed Interface Below KPIs

**Tab 1: Operations Overview**
- Today's session schedule (timeline view showing all tutors and their sessions)
- Attendance heatmap (weekly view showing patterns)
- At-risk student alerts with reasons (3+ absences, declining scores, no homework submission)
- Quick actions: Create session, Enrol student, Assign tutor

**Tab 2: Student Management**
- Searchable student table (name, courses, assessed levels, attendance rate, last session date)
- Bulk actions: enrol in sessions, assign to tutors, export data
- Student profile drill-down showing full academic history
- New student onboarding wizard (personal details → parent linking → initial assessment → session assignment)

**Tab 3: Tutor Management**
- Tutor roster with session load, student count, and availability
- Session template management (recurring weekly schedules)
- Tutor performance metrics: student progress rates, marking turnaround time, session completion rates
- Tutor allocation engine: match students to tutors based on subject expertise, availability, and capacity

**Tab 4: Financial Overview**
- Revenue dashboard: monthly/quarterly/annual with trend lines
- Outstanding invoices with status badges (PAID ✅ / PENDING 🟡 / OVERDUE 🔴)
- Payment collection rate progress bar
- Quick invoice generation and payment recording
- Links to full Finance Dashboard (Section 4)

**Tab 5: Reports**
- Student progress aggregates (average level changes per term, completion rates)
- Attendance trends (weekly/monthly patterns, chronic absentee identification)
- Tutor workload distribution
- Export: PDF reports, CSV data exports

---

## 3. Supervisor Portal

Supervisors have the **union of administrative oversight + tutor capabilities + assessor capabilities**. Their portal extends the tutor interface (Doc 3) with additional admin sections.

### Additional Supervisor Navigation Items

```
Supervisor Portal Sidebar
├── [All Tutor Menu Items from Doc 3]
│   ├── 📅 Current Day Sessions (can view ALL tutors' sessions)
│   ├── 📋 Planning Next Sessions (can plan for ANY tutor's students)
│   ├── ✏️ Lesson Marking (can mark ANY tutor's sessions)
│   ├── 📚 History of Sessions (can search ANY student)
│   ├── 📖 Content Library (full access)
│   └── 📝 Create Assessment (full access)
│
├── ── Supervision ──
│   ├── 👥 All Tutors Overview
│   │     Shows all tutors, their current session status, student load
│   │     Can "observe" any live session without interrupting
│   │
│   ├── 📊 Student Analytics
│   │     Centre-wide student performance dashboard
│   │     At-risk student identification (early warning system)
│   │     Academic level distribution charts
│   │     Progress tracking across all subjects
│   │
│   ├── ⚡ Session Management
│   │     Create/edit session templates
│   │     Assign students to sessions
│   │     Handle session conflicts and rescheduling
│   │
│   └── 📋 Approval Queue
│         Pending tutor change requests
│         Level override requests
│         Special accommodation requests
```

### Early Warning System

The supervisor sees an at-risk student dashboard that aggregates signals:

```
⚠️ At-Risk Students (3)

┌────────────────────────────────────────────────────────────┐
│ 🔴 HIGH RISK: Michael Torres                               │
│ Triggers: 3 consecutive absences + homework overdue (5)    │
│ + declining scores (last 3 exercises: 45%, 38%, 32%)       │
│ Courses: Mathematics (Class 4), English (Class 3)          │
│ Last attended: 5 Feb 2026 (8 days ago)                     │
│ Parent contact: parent3@lms.com │ [Contact Parent] [View]  │
├────────────────────────────────────────────────────────────┤
│ 🟡 MEDIUM RISK: Sophia Chen                                │
│ Triggers: 2 absences this month + declining engagement     │
│ Courses: Science (Class 5)                                 │
│ Last attended: 10 Feb 2026 (3 days ago)                    │
│ Parent contact: parent2@lms.com │ [Contact Parent] [View]  │
├────────────────────────────────────────────────────────────┤
│ 🟡 MEDIUM RISK: Alex Thompson                              │
│ Triggers: Scoring below 50% on last 4 exercises            │
│ Courses: Mathematics (Class 6)                             │
│ Last attended: 12 Feb 2026 (1 day ago)                     │
│ Tutor note: "Struggling with fractions concepts"           │
│ [Schedule Assessment] [Contact Parent] [View]              │
└────────────────────────────────────────────────────────────┘
```

**Risk scoring algorithm:**
- 3+ consecutive absences = +30 risk points
- Homework overdue count × 5 = risk points
- Average score < 50% over last 5 exercises = +20 risk points
- Declining score trend (3+ consecutive drops) = +15 risk points
- No session attendance in 7+ days = +25 risk points
- Threshold: 20+ = MEDIUM RISK, 40+ = HIGH RISK

---

## 4. Finance Dashboard

The Finance Admin manages all monetary operations for the centre.

### Fee Plan Management

```prisma
model FeePlan {
  id           String     @id @default(cuid())
  centreId     String
  name         String     // "Standard Weekly", "Intensive Monthly"
  frequency    Frequency  // WEEKLY, FORTNIGHTLY, MONTHLY, TERM, ANNUAL
  amount       Decimal    @db.Decimal(10, 2)
  currency     String     @default("GBP")
  sessionsIncluded Int?   // Number of sessions included (null = unlimited)
  subjects     String[]   // Courses included
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())

  centre       Centre     @relation(fields: [centreId], references: [id])
  studentPlans StudentFeePlan[]
  @@index([centreId, isActive])
}

model StudentFeePlan {
  id          String    @id @default(cuid())
  studentId   String
  feePlanId   String
  centreId    String
  startDate   DateTime
  endDate     DateTime?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())

  student     User      @relation(fields: [studentId], references: [id])
  feePlan     FeePlan   @relation(fields: [feePlanId], references: [id])
  @@index([centreId, studentId])
}
```

### Invoice Workflow

```
Create Invoice → [DRAFT] → Send to Parent → [SENT/PENDING]
  → Parent pays → [PAID]
  → Partial payment → [PARTIAL]
  → Past due date → [OVERDUE] → Auto-reminder emails
  → Parent requests refund → [REFUND_PENDING] → Finance approves → [REFUNDED]
```

### Finance Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│ 💰 Finance Dashboard — February 2026                        │
│                                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │ Revenue  │ │Collection│ │ Overdue  │ │ Refunds  │       │
│ │ This Mth │ │   Rate   │ │ Amount  │ │ Pending  │       │
│ │ £12,450  │ │   82%    │ │ £2,180  │ │   £340   │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                            │
│ ── Outstanding Invoices ──                                 │
│ [Filter: All ▼] [Status: Overdue ▼] [Date Range: This Mth]│
│                                                            │
│ │ INV-2026-0089 │ Jane Smith (parent) │ £180 │ 🔴 OVERDUE  │
│ │ INV-2026-0092 │ Omar Hassan (parent)│ £240 │ 🟡 PENDING  │
│ │ INV-2026-0095 │ Alex Thompson (par) │ £180 │ 🟡 PENDING  │
│ │ ...                                                      │
│                                                            │
│ [Create Invoice] [Batch Generate] [Export CSV]             │
│                                                            │
│ ── Payment History ──                                      │
│ [Recent payments table with date, student, amount, method] │
└────────────────────────────────────────────────────────────┘
```

### Integration Points

- **Xero/QuickBooks:** Sync invoices and payments via API adapter (Doc 6)
- **Stripe/PayPal:** Online payment processing for parent portal payments
- **Email notifications:** Auto-send invoice PDFs, payment confirmations, overdue reminders

---

## 5. Reception / Check-In Terminal

The reception interface is designed for **speed and simplicity** — a single-purpose check-in/check-out terminal.

### Check-In Interface

```
┌────────────────────────────────────────────────────────────┐
│ 📋 Student Check-In — Greenfield Learning Centre            │
│ Thursday, 13 February 2026                                 │
│                                                            │
│ Search: [Type student name...______________________] [🔍]  │
│                                                            │
│ ── Expected Now (3:30 PM Session) ──                       │
│                                                            │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │ Jane │ │ Alex │ │Priya │ │ Omar │ │ Liam │ │Sophie│    │
│ │  ✅  │ │  ✅  │ │  ⬜  │ │  ⬜  │ │  ✅  │ │  ⬜  │    │
│ │3:28PM│ │3:31PM│ │      │ │      │ │3:35PM│ │      │    │
│ │[OUT] │ │[OUT] │ │ [IN] │ │ [IN] │ │[OUT] │ │ [IN] │    │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
│                                                            │
│ ── Checked In Today ──                                     │
│ Jane Smith     │ In: 3:28 PM │ Session: Afternoon M&E     │
│ Alex Thompson  │ In: 3:31 PM │ Session: Afternoon M&E     │
│ Liam Cooper    │ In: 3:35 PM │ Session: Afternoon M&E     │
│                                                            │
│ ── Checked Out ──                                          │
│ (empty)                                                    │
└────────────────────────────────────────────────────────────┘
```

**Behaviour:**
- Large tap targets for check-in buttons (minimum 56px)
- Single tap toggles check-in/check-out
- Auto-populates session based on current time
- Late arrivals (after session start) automatically flagged as LATE
- Fires event: `student.checked_in` → triggers attendance recording
- Parent notification: "Your child has arrived at the centre"
- Check-out fires: `student.checked_out` → parent notification: "Your child has left the centre"
- Reception has NO access to financial data, student academic records, or system configuration

---

## 6. Parent Portal

The parent portal provides visibility into their child's learning journey and handles administrative interactions with the centre.

### Parent Dashboard

```
┌────────────────────────────────────────────────────────────┐
│ Welcome, Mrs. Smith                                        │
│ Children: Jane Smith, Tom Smith                            │
│                                                            │
│ [Jane ▼]  ← Child selector (if parent has multiple)       │
│                                                            │
│ ── Jane's Overview ──                                      │
│                                                            │
│ 📅 Next Session: Tomorrow, 3:30 PM (Physical)              │
│    Tutor: Mr. Williams                                     │
│    Working on: English (Class 4), Mathematics (Class 3)    │
│                                                            │
│ 📊 Subject Progress                                        │
│ ┌──────────────────────────────────────────────────┐       │
│ │ English                                          │       │
│ │ Assessed Level: Class 4 ↑ (was Class 3 in Oct)  │       │
│ │ Reading Age: 9.2 years │ Spelling: Class 3       │       │
│ │ Recent: Comprehension 85%, Vocabulary 90%        │       │
│ │ [View Full Progress →]                           │       │
│ ├──────────────────────────────────────────────────┤       │
│ │ Mathematics                                      │       │
│ │ Assessed Level: Class 3 → (stable since Nov)     │       │
│ │ Numeracy Age: 8.5 years                          │       │
│ │ Recent: Fractions 72%, Word Problems 68%         │       │
│ │ [View Full Progress →]                           │       │
│ └──────────────────────────────────────────────────┘       │
│                                                            │
│ 📅 Attendance This Month                                    │
│ M  T  W  T  F  M  T  W  T  F                              │
│ ✅ ·  ✅ ·  ✅ ✅ ·  ✅ ·  ✅  (10/10 sessions)             │
│                                                            │
│ 📝 Recent Activity                                          │
│ Today: Comprehension exercise — 85% ⭐                      │
│ Yesterday: Homework submitted — Spelling Practice           │
│ 10 Feb: Assessment completed — Reading Age: 9.2 years      │
│                                                            │
│ 💰 Billing                                                  │
│ Current plan: Standard Weekly (£45/week)                   │
│ Next invoice: 17 Feb 2026 — £45.00                        │
│ Outstanding: £0.00 ✅                                       │
│ [View All Invoices →] [Make Payment →]                     │
│                                                            │
│ 📬 Messages                                                 │
│ Mr. Williams (12 Feb): "Jane did excellent work on..."     │
│ [View All Messages →] [Send Message →]                     │
│                                                            │
│ 📋 Requests                                                 │
│ [Request Schedule Change] [Request Tutor Change]           │
│ [Submit Feedback] [View Request History]                    │
└────────────────────────────────────────────────────────────┘
```

### Parent Notifications

| Event | Channel | Message |
|-------|---------|---------|
| Child checked in | Push + In-app | "Jane has arrived at Greenfield Centre" |
| Child checked out | Push + In-app | "Jane has left Greenfield Centre" |
| Session completed | Email (daily digest) | Summary of what Jane worked on today |
| Homework assigned | Push + In-app | "Jane has new English homework due 16 Feb" |
| Exercise graded | In-app | "Jane's Comprehension exercise was marked: 85%" |
| Level advancement | Push + Email | "Jane has advanced to Class 5 level in Reading!" |
| Assessment complete | Email | Full assessment report with component breakdown |
| Invoice generated | Email | PDF invoice attached |
| Payment confirmed | Email | Receipt with payment details |
| Session cancelled | Push + Email | "Tomorrow's 3:30 PM session has been cancelled" |

### Parent Request System

Parents can submit requests that flow into the ticketing system:

```
Request Types:
├── Schedule Change — "Can we move Jane to the 5:00 PM slot?"
├── Tutor Change — "We'd prefer a different tutor for Mathematics"
├── Additional Sessions — "Can Jane attend an extra session this week?"
├── Leave of Absence — "Jane will be away 20-24 Feb"
├── Complaint — General complaint form
└── General Enquiry — Any other question

Workflow: Parent submits → Supervisor notified → Reviewed → Response sent to parent
Status tracking: Submitted → Acknowledged → In Review → Resolved/Declined
```

---

## 7. Global Admin Console (SUPER_ADMIN)

The Global Admin manages multiple centres from a single console.

### Multi-Centre Overview

```
┌────────────────────────────────────────────────────────────┐
│ 🌐 AetherLearn Global Console                              │
│                                                            │
│ ── Centre Performance ──                                   │
│                                                            │
│ Centre              │ Students │ Attend. │ Revenue │ Status│
│ ─────────────────── │ ──────── │ ─────── │ ─────── │ ──── │
│ Greenfield Centre   │    48    │   87%   │ £12,450 │  🟢  │
│ Oakwood Academy     │    35    │   92%   │  £9,800 │  🟢  │
│ Riverside Learning  │    22    │   73%   │  £5,200 │  🟡  │
│ Downtown Centre     │    41    │   81%   │ £11,100 │  🟢  │
│                                                            │
│ 🟡 Alert: Riverside Learning attendance below 75% threshold│
│                                                            │
│ [Click any centre to drill down →]                         │
│                                                            │
│ ── Platform-Wide KPIs ──                                   │
│ Total students: 146 │ Active tutors: 18 │ Total revenue: £38,550│
│ Platform uptime: 99.8% │ Avg session rating: 4.2/5        │
└────────────────────────────────────────────────────────────┘
```

### Global Admin Capabilities

- Drill down into any centre's admin dashboard
- Cross-centre benchmarking (attendance, revenue, student progress by centre)
- Centre configuration: enable/disable features per centre, set subscription tiers
- Platform-wide content management: publish content available to all centres
- User management across centres: create centre admins, transfer students between centres
- System configuration: gamification defaults, notification templates, SLA configurations
- Audit log viewer across all centres

---

## 8. Cross-Role Notification Architecture

### Event-Driven Notification Flow

When any significant event occurs, the system publishes a domain event that triggers role-appropriate notifications:

```typescript
// Example: Student marked absent
// Event: attendance.recorded { studentId, status: 'ABSENT', sessionId }

// Notification targets:
// 1. PARENT → Push + Email: "Jane was absent from today's session"
// 2. SUPERVISOR → In-app: "Jane Smith absent (3rd absence this month)"
// 3. TUTOR → In-app: "Jane absent — catch-up package created"
```

### Notification Priority Tiers

| Priority | Delivery | Examples |
|----------|----------|---------|
| CRITICAL | Inline blocking + Push + Email | Safety alert, account locked |
| HIGH | Push + In-app banner | Session cancelled, schedule change |
| MEDIUM | In-app + optional email | Exercise graded, homework assigned |
| LOW | Daily/weekly digest | Weekly progress summary, new content |

### User Notification Preferences

Each user can configure:
- Per event type: enable/disable
- Per channel: push, email, SMS, in-app
- Per frequency: immediate, daily digest, weekly digest
- Quiet hours: no push notifications between set times

```prisma
model NotificationPreference {
  id          String   @id @default(cuid())
  userId      String
  eventType   String   // "homework.assigned", "session.cancelled", etc.
  channels    String[] // ["push", "email", "in_app"]
  frequency   String   @default("IMMEDIATE") // IMMEDIATE, DAILY_DIGEST, WEEKLY_DIGEST
  isEnabled   Boolean  @default(true)
  quietStart  String?  // "22:00"
  quietEnd    String?  // "07:00"
  
  @@unique([userId, eventType])
  @@index([userId])
}
```

---

## 9. Ticketing and Request System

The ticketing system handles all operational requests from any role.

### Ticket Categories and SLA

| Category | Default SLA (Response) | Default SLA (Resolution) | Priority Range |
|----------|----------------------|-------------------------|---------------|
| COMPLAINTS | 4 hours | 48 hours | MEDIUM-URGENT |
| TUTOR_CHANGE | 24 hours | 72 hours | MEDIUM-HIGH |
| SCHEDULE_CHANGE | 24 hours | 48 hours | LOW-MEDIUM |
| IT_SUPPORT | 4 hours | 24 hours | LOW-URGENT |
| MAINTENANCE | 24 hours | 72 hours | LOW-HIGH |
| GENERAL | 48 hours | 5 days | LOW-MEDIUM |

### Ticket Workflow

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
  │         │             │
  │         └→ ESCALATED (SLA breach) → IN_PROGRESS
  │
  └→ CANCELLED (by requester)
```

### Ticket Access by Role

| Role | Can Create | Can View | Can Assign | Can Resolve |
|------|-----------|----------|-----------|------------|
| STUDENT | Own requests | Own only | No | No |
| PARENT | Own requests | Own only | No | No |
| TEACHER | Own + student-related | Own + assigned | No | Own assigned |
| SUPERVISOR | All types | All in centre | Yes | Yes |
| CENTRE_ADMIN | All types | All in centre | Yes | Yes |
| FINANCE_ADMIN | Financial only | Financial in centre | No | Financial only |
| SUPER_ADMIN | All types | All centres | Yes | Yes |

---

## 10. Approval Workflow System

Certain actions require explicit approval from a higher authority:

| Approval Type | Requested By | Approved By | Triggers |
|---------------|-------------|------------|---------|
| REFUND | Finance Admin | Centre Admin | Refund > £50 |
| FEE_WAIVER | Centre Admin | Super Admin | Any fee waiver |
| TUTOR_OVERRIDE | Supervisor | Centre Admin | Tutor reassignment |
| LEVEL_OVERRIDE | Assessor | Supervisor | Level change > 2 levels |
| PAYROLL_EXCEPTION | Finance Admin | Centre Admin | Payroll adjustment |
| STUDENT_TRANSFER | Centre Admin | Super Admin | Cross-centre transfer |

```
Request Created → PENDING → Reviewer notified
  → APPROVED → Action executed automatically + Audit log + Notifications
  → REJECTED → Requester notified with reason + Audit log
  → EXPIRED → 72 hours without action → Escalated to next level
```
