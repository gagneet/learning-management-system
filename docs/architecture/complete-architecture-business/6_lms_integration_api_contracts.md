# AetherLearn LMS — Doc 6: Integration & API Contracts

**External Integrations, Full API Specification, Notification System, and Event Bus**

Doc 6 of 6 · Links to: Cross-role event propagation, real-time updates

---

## 1. API Design Principles

All API routes follow these conventions:

- **Base path:** `/api/v1/` (versioned from the start)
- **Authentication:** NextAuth.js JWT in HttpOnly cookie (automatic)
- **Authorisation:** RBAC middleware checks role + centre scope
- **Tenancy:** `centreId` extracted from session, never from request body
- **Validation:** Zod schemas on all request bodies
- **Response format:** `{ success: boolean, data?: T, error?: string, details?: any }`
- **Pagination:** Cursor-based for timeline data, offset-based for tables
- **Rate limiting:** Nginx (IP-based) + application (user-based)

### Standard Response Shapes

```typescript
// Success
{ "success": true, "data": { ... } }

// Success with pagination
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}

// Error
{ "success": false, "error": "Validation failed", "details": { "title": "Required" } }
```

---

## 2. Full API Endpoint Specification

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signin` | None | NextAuth credentials sign-in |
| POST | `/api/auth/signout` | Any | Sign out, clear session |
| GET | `/api/auth/session` | Any | Get current session |
| POST | `/api/v1/auth/forgot-password` | None | Request password reset [FUTURE] |
| POST | `/api/v1/auth/reset-password` | None | Reset with token [FUTURE] |

### Users & Profiles

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users` | Admin+ | List users (centre-scoped, paginated, filterable) |
| POST | `/api/v1/users` | Admin+ | Create user |
| GET | `/api/v1/users/:id` | Self/Admin+ | Get user profile |
| PATCH | `/api/v1/users/:id` | Self/Admin+ | Update user profile |
| GET | `/api/v1/users/:id/academic-profile` | Teacher+/Parent(own child) | Get academic assessments |
| GET | `/api/v1/users/:id/gamification` | Self/Teacher+/Parent(own child) | Get XP, level, badges, streaks |

### Sessions (Tutoring Sessions)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/sessions/today` | Teacher+ | Today's sessions for current tutor |
| GET | `/api/v1/sessions/upcoming` | Teacher+ | Future sessions (paginated by date) |
| GET | `/api/v1/sessions/:id` | Teacher+/Student(enrolled) | Session details with enrollments |
| GET | `/api/v1/sessions/:id/dashboard` | Teacher+ | Full real-time dashboard data |
| POST | `/api/v1/sessions/:id/start` | Teacher+ | Start a session |
| POST | `/api/v1/sessions/:id/end` | Teacher+ | End a session |
| POST | `/api/v1/sessions` | Supervisor+ | Create a new session |
| PATCH | `/api/v1/sessions/:id` | Supervisor+ | Update session details |
| DELETE | `/api/v1/sessions/:id` | Supervisor+ | Cancel session |

### Session Enrolments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/sessions/:id/enrollments` | Teacher+ | List enrolled students with activities |
| POST | `/api/v1/sessions/:id/enrollments` | Supervisor+ | Enrol student in session |
| DELETE | `/api/v1/sessions/:sessionId/enrollments/:enrollmentId` | Supervisor+ | Remove student from session |
| POST | `/api/v1/sessions/:id/attendance` | Teacher+ | Mark attendance `{ studentId, status }` |
| POST | `/api/v1/sessions/:id/attendance/bulk` | Teacher+ | Bulk mark `{ records: [{ studentId, status }] }` |

### Student Session Planning

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/sessions/:sessionId/students/:studentId/plan` | Teacher+ | Get student's lesson plan for session |
| POST | `/api/v1/sessions/:sessionId/students/:studentId/notes` | Teacher+ | Add tutor note |
| POST | `/api/v1/enrollments/:id/assign-content` | Teacher+ | Override auto-sequenced content `{ exerciseId }` |

### Content & Exercises

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/content/courses` | Teacher+ | List all courses |
| GET | `/api/v1/content/courses/:courseId/levels` | Teacher+ | List grade levels with unit counts |
| GET | `/api/v1/content/courses/:courseId/levels/:levelId/units` | Teacher+ | List units with lessons |
| GET | `/api/v1/content/lessons/:lessonId/exercises` | Teacher+ | List exercises in a lesson |
| GET | `/api/v1/content/exercises/:id` | Teacher+/Student(assigned) | Exercise details with questions |
| GET | `/api/v1/content/next?studentId&courseId` | Teacher+/Student(self) | Get next content (auto-sequence or override) |

### Exercise Attempts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/exercises/:id/start` | Student | Start an attempt `{ sessionEnrollmentId? }` |
| PATCH | `/api/v1/attempts/:id/autosave` | Student | Auto-save answers `{ answers }` |
| POST | `/api/v1/attempts/:id/submit` | Student | Submit completed attempt `{ answers }` |
| GET | `/api/v1/attempts/:id` | Student(own)/Teacher+/Parent(own child) | Get attempt with answers and review |

### Homework

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/homework?studentId` | Student(self)/Teacher+/Parent(own child) | List homework assignments |
| POST | `/api/v1/homework` | Teacher+ | Assign homework `{ studentId, exerciseId, dueDate }` |
| PATCH | `/api/v1/homework/:id` | Teacher+ | Update homework (extend deadline, add notes) |

### Assessment

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/assessments/queue` | Assessor+ | Assessment review queue (filterable) |
| POST | `/api/v1/assessments` | Assessor+ | Create assessment `{ studentId, courseId, components, exercises }` |
| POST | `/api/v1/assessments/reviews` | Assessor+ | Submit review `{ scores, feedback, levelDecision }` |
| GET | `/api/v1/assessments/reviews/:id` | Student(own)/Teacher+/Parent(own child) | Get assessment review results |
| PATCH | `/api/v1/students/:id/academic-profile` | Assessor+ | Update assessed level `{ courseId, newLevel, reason }` |

### Physical Work & QR

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/physical-work/upload` | Teacher+ | Upload scan `{ studentId, exerciseId?, images[] }` |
| GET | `/api/v1/physical-work/scan/:qrCode` | Teacher+ | Lookup from QR code |
| POST | `/api/v1/physical-work/:id/annotate` | Teacher+ | Save annotations `{ annotations: JSON }` |
| POST | `/api/v1/qr/generate` | Admin+ | Generate QR codes `{ studentId, exerciseId, count }` |
| POST | `/api/v1/qr/generate/batch` | Admin+ | Batch generate for session `{ sessionId }` |

### Help Requests (Real-Time Session)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/sessions/:id/help-request` | Student | Raise hand `{ message? }` |
| PATCH | `/api/v1/help-requests/:id/acknowledge` | Teacher+ | Acknowledge request |
| PATCH | `/api/v1/help-requests/:id/resolve` | Teacher+ | Resolve request |
| DELETE | `/api/v1/help-requests/:id` | Student(own) | Cancel help request |

### Gamification

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/gamification/profile` | Student(self)/Parent(own child) | XP, level, badges, streaks |
| GET | `/api/v1/gamification/xp-ledger` | Student(self) | Detailed XP history (paginated) |
| GET | `/api/v1/gamification/leaderboard?period&scope` | Student(opt-in)/Teacher+ | Leaderboard rankings |
| GET | `/api/v1/gamification/badges` | Any authenticated | Available badges with criteria |
| POST | `/api/v1/gamification/streak/repair` | Student | Use streak repair `{ streakType }` |

### Finance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/finance/fee-plans` | Finance+ | List fee plans |
| POST | `/api/v1/finance/fee-plans` | Finance+ | Create fee plan |
| GET | `/api/v1/finance/invoices` | Finance+/Parent(own) | List invoices (filterable) |
| POST | `/api/v1/finance/invoices` | Finance+ | Create invoice |
| POST | `/api/v1/finance/invoices/batch` | Finance+ | Batch generate invoices |
| POST | `/api/v1/finance/payments` | Finance+ | Record payment |
| POST | `/api/v1/finance/refunds` | Finance+ | Request refund (enters approval workflow) |
| GET | `/api/v1/finance/reports/:type` | Finance+ | Financial reports (revenue, outstanding, etc.) |

### Tickets & Requests

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/tickets` | Any authenticated | List tickets (scoped by role) |
| POST | `/api/v1/tickets` | Any authenticated | Create ticket |
| PATCH | `/api/v1/tickets/:id` | Supervisor+ | Update ticket status/assignment |
| POST | `/api/v1/tickets/:id/comments` | Assigned/Creator | Add comment |
| POST | `/api/v1/tickets/:id/attachments` | Assigned/Creator | Upload attachment |

### Approvals

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/approvals` | Approver role | Pending approval requests |
| POST | `/api/v1/approvals/:id/approve` | Approver role | Approve with notes |
| POST | `/api/v1/approvals/:id/reject` | Approver role | Reject with reason |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/notifications` | Any authenticated | User's notifications (paginated) |
| PATCH | `/api/v1/notifications/:id/read` | Self | Mark as read |
| POST | `/api/v1/notifications/read-all` | Self | Mark all as read |
| GET | `/api/v1/notifications/preferences` | Self | Get notification preferences |
| PATCH | `/api/v1/notifications/preferences` | Self | Update preferences |
| GET | `/api/v1/notifications/stream` | Self | SSE stream for real-time notifications |

### Admin & Centre Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/centres` | Super Admin | List all centres |
| GET | `/api/v1/centres/:id` | Centre Admin+ | Centre details and config |
| PATCH | `/api/v1/centres/:id/config` | Centre Admin+ | Update centre configuration |
| GET | `/api/v1/centres/:id/analytics` | Centre Admin+ | Centre analytics dashboard data |
| GET | `/api/v1/admin/global-analytics` | Super Admin | Cross-centre analytics |
| GET | `/api/v1/admin/audit-log` | Super Admin/Centre Admin | Audit log (filterable) |

### Check-In/Check-Out (Reception)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/checkin/expected` | Receptionist+ | Students expected for current/next session |
| POST | `/api/v1/checkin` | Receptionist+ | Check in student `{ studentId }` |
| POST | `/api/v1/checkout` | Receptionist+ | Check out student `{ studentId }` |
| GET | `/api/v1/checkin/status` | Receptionist+ | Current check-in/out status for all students |

### Video Sessions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/sessions/:id/video-token` | Teacher+/Student(enrolled) | Get LiveKit room token |
| POST | `/api/v1/sessions/:id/video-room` | Teacher+ | Create video room for session |

---

## 3. Domain Event Catalogue

Every significant action publishes a domain event through the BullMQ event bus. These events trigger cross-module side effects.

### Event Schema

```typescript
interface DomainEvent {
  type: string;              // Dot-notation: "module.action"
  payload: Record<string, unknown>;
  metadata: {
    correlationId: string;   // UUID for tracing
    centreId: string;
    userId: string;          // Who triggered the event
    timestamp: string;       // ISO 8601
  };
}
```

### Complete Event Catalogue

**Academic Events:**

| Event | Payload | Triggered By | Consumers |
|-------|---------|-------------|-----------|
| `session.started` | `{ sessionId, tutorId }` | Tutor starts session | Notifications → parents |
| `session.ended` | `{ sessionId, summary }` | Tutor ends session | Analytics, Notifications |
| `attendance.recorded` | `{ studentId, sessionId, status }` | Tutor marks attendance | Gamification (XP), Notifications (parent), Analytics (risk) |
| `exercise.started` | `{ studentId, exerciseId, attemptId }` | Student starts exercise | Real-time dashboard |
| `exercise.submitted` | `{ studentId, attemptId, score? }` | Student submits | Gamification, Notifications |
| `exercise.graded` | `{ attemptId, score, assessorId }` | Tutor/assessor grades | Notifications (student + parent), Analytics |
| `content.assigned` | `{ studentId, exerciseId, assignedBy }` | Tutor assigns content | Real-time student view |
| `level.changed` | `{ studentId, courseId, oldLevel, newLevel }` | Assessor updates | Notifications (all), Gamification (Mastery XP), Content sequencing |

**Gamification Events:**

| Event | Payload | Triggered By | Consumers |
|-------|---------|-------------|-----------|
| `xp.awarded` | `{ studentId, amount, source, sourceId }` | Internal (gamification module) | Real-time dashboard, Leaderboard cache invalidation |
| `badge.earned` | `{ studentId, badgeType, badgeName }` | Badge rule engine | Notifications (celebration), Parent notification |
| `level.up` | `{ studentId, newLevel, title }` | Level calculation | Notifications (celebration) |
| `streak.broken` | `{ studentId, streakType, count }` | Streak checker | Notification (empathetic) |
| `streak.milestone` | `{ studentId, streakType, count }` | Streak checker | Notification (celebration), Badge check |

**Finance Events:**

| Event | Payload | Triggered By | Consumers |
|-------|---------|-------------|-----------|
| `invoice.created` | `{ invoiceId, parentId, amount }` | Finance admin | Notifications (email with PDF) |
| `payment.received` | `{ paymentId, invoiceId, amount }` | Finance admin | Notifications (receipt), Audit |
| `invoice.overdue` | `{ invoiceId, daysPastDue }` | Scheduled job (daily) | Notifications (reminder), Finance dashboard |
| `refund.approved` | `{ refundId, amount }` | Approval workflow | Notifications, Accounting sync |

**Operations Events:**

| Event | Payload | Triggered By | Consumers |
|-------|---------|-------------|-----------|
| `ticket.created` | `{ ticketId, category, createdBy }` | Any user | Notifications (assigned staff), SLA timer start |
| `ticket.escalated` | `{ ticketId, reason }` | SLA breach checker | Notifications (supervisor), Dashboard alert |
| `checkin.recorded` | `{ studentId, time }` | Reception | Parent notification, Attendance |
| `checkout.recorded` | `{ studentId, time }` | Reception | Parent notification |

**Homework Events:**

| Event | Payload | Triggered By | Consumers |
|-------|---------|-------------|-----------|
| `homework.assigned` | `{ studentId, exerciseId, dueDate }` | Tutor | Notifications (student + parent) |
| `homework.submitted` | `{ homeworkId, studentId }` | Student | Gamification (streak + XP), Notifications (tutor) |
| `homework.overdue` | `{ homeworkId, studentId, daysPastDue }` | Scheduled job | Notifications (student + parent), Risk scoring |

### Event Handler Registration

Each module registers its handlers at application startup:

```typescript
// modules/gamification/event-handlers.ts
import { onEvent } from '@/modules/shared/event-bus';

export function registerGamificationHandlers() {
  onEvent('attendance.recorded', async (event) => {
    if (event.payload.status === 'ATTENDING') {
      await xpService.award(event.payload.studentId, 10, 'ATTENDANCE', event.payload.sessionId);
      await streakService.recordActivity(event.payload.studentId, 'ATTENDANCE');
    }
  });

  onEvent('exercise.submitted', async (event) => {
    const xp = calculateExerciseXP(event.payload.difficulty, event.payload.score);
    await xpService.award(event.payload.studentId, xp, 'EXERCISE', event.payload.attemptId);
    await badgeService.checkBadgeCriteria(event.payload.studentId);
  });

  onEvent('homework.submitted', async (event) => {
    const isOnTime = event.payload.submittedAt <= event.payload.dueDate;
    await xpService.award(event.payload.studentId, isOnTime ? 20 : 10, 'HOMEWORK');
    await streakService.recordActivity(event.payload.studentId, 'HOMEWORK');
  });

  onEvent('level.changed', async (event) => {
    await xpService.award(event.payload.studentId, 100, 'LEVEL_ADVANCEMENT');
    await badgeService.checkMasteryBadge(event.payload.studentId, event.payload.courseId);
  });
}
```

---

## 4. Notification System Architecture

### Notification Pipeline

```
Domain Event → Notification Router → Template Engine → Channel Dispatcher
                                                      ├── In-App (DB + SSE)
                                                      ├── Email (SendGrid)
                                                      ├── Push (Web Push API)
                                                      └── SMS (Twilio) [FUTURE]
```

### Template Engine

```typescript
// modules/notifications/template-engine.ts
import Handlebars from 'handlebars';

const templates = {
  'attendance.absent': {
    inApp: { title: 'Absence recorded', body: '{{studentName}} was absent from {{sessionName}}' },
    email: {
      subject: '{{studentName}} - Absence notification',
      body: 'Dear {{parentName}}, {{studentName}} was absent from their {{sessionName}} session on {{date}}.',
    },
    push: { title: 'Absence', body: '{{studentName}} was absent today' },
  },
  'exercise.graded': {
    inApp: { title: 'Work marked', body: 'Your {{courseName}} exercise was marked: {{score}}%' },
    email: {
      subject: '{{studentName}} - Exercise feedback available',
      body: 'Dear {{parentName}}, {{studentName}}\'s {{exerciseName}} has been marked. Score: {{score}}/{{maxScore}}.',
    },
  },
  // ... 30+ templates
};

export function renderNotification(eventType: string, channel: string, data: Record<string, string>) {
  const template = templates[eventType]?.[channel];
  if (!template) return null;
  return {
    title: Handlebars.compile(template.title)(data),
    body: Handlebars.compile(template.body)(data),
    subject: template.subject ? Handlebars.compile(template.subject)(data) : undefined,
  };
}
```

### SSE Real-Time Notifications

```typescript
// app/api/v1/notifications/stream/route.ts
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const stream = new ReadableStream({
    start(controller) {
      const subscriber = (message: string) => {
        controller.enqueue(`data: ${message}\n\n`);
      };

      // Subscribe to Redis pub/sub for this user
      const channel = `notifications:${session.user.id}`;
      redisSubscriber.subscribe(channel, subscriber);

      // Send heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(': heartbeat\n\n');
      }, 30000);

      req.signal.addEventListener('abort', () => {
        redisSubscriber.unsubscribe(channel, subscriber);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Required for Nginx
    },
  });
}
```

---

## 5. External Integration Adapters

### Video Provider Adapter (Pluggable)

```typescript
// modules/integrations/video/adapter.ts
interface VideoProvider {
  createRoom(sessionId: string): Promise<{ roomId: string; joinUrl: string }>;
  generateToken(roomId: string, userId: string, role: 'host' | 'participant'): Promise<string>;
  endRoom(roomId: string): Promise<void>;
}

class LiveKitAdapter implements VideoProvider { /* ... */ }
class TeamsAdapter implements VideoProvider { /* ... */ }
class ZoomAdapter implements VideoProvider { /* ... */ }

// Factory
export function getVideoProvider(provider: string): VideoProvider {
  switch (provider) {
    case 'LIVEKIT': return new LiveKitAdapter();
    case 'TEAMS': return new TeamsAdapter();
    case 'ZOOM': return new ZoomAdapter();
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
```

### Payment Gateway Adapter

```typescript
// modules/integrations/payments/adapter.ts
interface PaymentGateway {
  createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>): Promise<{ clientSecret: string }>;
  confirmPayment(intentId: string): Promise<{ status: string }>;
  createRefund(paymentId: string, amount: number): Promise<{ refundId: string }>;
}

class StripeAdapter implements PaymentGateway { /* ... */ }
class PayPalAdapter implements PaymentGateway { /* ... */ }
```

### Accounting Integration Adapter

```typescript
// modules/integrations/accounting/adapter.ts
interface AccountingProvider {
  syncInvoice(invoice: Invoice): Promise<{ externalId: string }>;
  syncPayment(payment: Payment): Promise<{ externalId: string }>;
  getAccounts(): Promise<Account[]>;
}

class XeroAdapter implements AccountingProvider { /* ... */ }
class QuickBooksAdapter implements AccountingProvider { /* ... */ }
```

### Email Service

```typescript
// modules/integrations/email/sendgrid.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  await sgMail.send({
    to,
    from: { email: 'noreply@aetherlearn.com', name: 'AetherLearn' },
    subject,
    html,
    attachments,
  });
}
```

---

## 6. Scheduled Jobs (BullMQ Cron)

| Job | Schedule | Description |
|-----|----------|-------------|
| `homework.overdue-check` | Every hour | Flag overdue homework, send reminders |
| `streak.daily-check` | Daily at midnight | Check streak continuity, apply freezes |
| `leaderboard.recompute` | Hourly | Refresh Redis leaderboard sorted sets |
| `invoice.overdue-check` | Daily at 9 AM | Flag overdue invoices, send reminders |
| `sla.breach-check` | Every 15 min | Check ticket SLA compliance, escalate breaches |
| `session.reminder` | Every 30 min | Send session reminders 15 min before start |
| `backup.database` | Daily at 2 AM | PostgreSQL pg_dump to MinIO |
| `analytics.aggregate` | Daily at 3 AM | Pre-compute dashboard analytics |
| `risk.scoring` | Daily at 6 AM | Recompute student risk scores |

```typescript
// modules/shared/scheduled-jobs.ts
import { Queue } from 'bullmq';

const scheduledJobs = new Queue('scheduled-jobs', { connection: redis });

export async function registerScheduledJobs() {
  await scheduledJobs.add('homework.overdue-check', {}, {
    repeat: { pattern: '0 * * * *' }, // Every hour
  });
  await scheduledJobs.add('streak.daily-check', {}, {
    repeat: { pattern: '0 0 * * *' }, // Midnight
  });
  await scheduledJobs.add('leaderboard.recompute', {}, {
    repeat: { pattern: '0 * * * *' }, // Hourly
  });
  // ... register all jobs
}
```

---

## 7. WebSocket Event Protocol (Session Real-Time)

For live tutoring sessions, WebSocket communication follows this protocol via PartyKit rooms:

### Connection

```
wss://party.aetherlearn.com/session/{sessionId}?token={jwt}
```

### Message Format

```typescript
interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  senderId: string;
}
```

### Client → Server Messages

| Type | Payload | Sender |
|------|---------|--------|
| `student:heartbeat` | `{ isActive, currentExerciseId, progressPct }` | Student (every 10s) |
| `student:help_request` | `{ message? }` | Student |
| `student:help_cancel` | `{}` | Student |
| `student:exercise_progress` | `{ exerciseId, answeredCount, progressPct }` | Student |
| `student:exercise_submit` | `{ exerciseId, answers }` | Student |
| `tutor:assign_content` | `{ studentId, exerciseId }` | Tutor |
| `tutor:message` | `{ studentId, text }` | Tutor |
| `tutor:broadcast` | `{ text }` | Tutor (to all students) |
| `tutor:attendance` | `{ studentId, status }` | Tutor |
| `tutor:help_acknowledge` | `{ requestId }` | Tutor |
| `tutor:help_resolve` | `{ requestId }` | Tutor |
| `tutor:session_start` | `{}` | Tutor |
| `tutor:session_end` | `{}` | Tutor |

### Server → Client Messages

| Type | Payload | Recipient |
|------|---------|-----------|
| `session:sync` | `{ students: Record<id, StudentState> }` | Tutor (on connect) |
| `student:update` | `{ studentId, status, exerciseId, progressPct }` | Tutor |
| `student:joined` | `{ studentId, name, course, level }` | Tutor |
| `student:left` | `{ studentId }` | Tutor |
| `help:new` | `{ requestId, studentId, message }` | Tutor |
| `content:assigned` | `{ exerciseId, exerciseTitle }` | Specific student |
| `message:received` | `{ from, text }` | Specific student |
| `attendance:marked` | `{ status }` | Specific student |
| `session:started` | `{}` | All students |
| `session:ended` | `{ summary }` | All students |
