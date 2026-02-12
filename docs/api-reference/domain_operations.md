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
# 2) Operations Domain
## Scope
Centre operations that keep classes running:
- Reception/front desk workflows (reschedules, inbound calls)
- Support centre triage (complaints, issues)
- Ticketing/request portal (repairs, facilities, supplies)
- SLAs, escalations, operational reporting
- Vendor interactions (optional)

---
## 2.1 UX/UI

### Reception Dashboard
- Today’s timetable (classes + rooms + tutor)
- Reschedule queue (parent calls → propose options)
- Ticket creation (broken chair, laptop issue)
- Centre notices (closure, delays)

### Support Centre Dashboard
- Ticket list with filters by category, SLA, centre
- Escalation inbox (breaching SLA)
- Bulk notifications

### Vendor Portal (Optional)
- Work orders assigned
- Upload completion proof + invoice reference
- No student access

---
## 2.2 Data Model (Ticketing + SLA)

```prisma
model Ticket {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  category  String // ACADEMIC, OPS, ADMIN, FINANCE, HR
  subCategory String
  priority  String @default("MEDIUM")
  status    String @default("OPEN") // OPEN, IN_PROGRESS, WAITING, ESCALATED, CLOSED
  title     String
  description String
  raisedBy  String @db.Uuid
  assignedToUserId String? @db.Uuid
  assignedToRole String?
  linkedStudentId String? @db.Uuid
  linkedClassId   String? @db.Uuid
  linkedSessionId String? @db.Uuid
  slaDueAt  DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  comments  TicketComment[]
  attachments TicketAttachment[]
}

model TicketComment {
  id       String @id @default(uuid()) @db.Uuid
  centreId String @db.Uuid
  ticketId String @db.Uuid
  authorId String @db.Uuid
  body     String
  createdAt DateTime @default(now())
}

model TicketAttachment {
  id       String @id @default(uuid()) @db.Uuid
  centreId String @db.Uuid
  ticketId String @db.Uuid
  fileUrl  String
  fileName String
  createdAt DateTime @default(now())
}

model SLAConfig {
  id       String @id @default(uuid()) @db.Uuid
  centreId String @db.Uuid
  category String
  subCategory String?
  priority String
  minutesToDue Int
}
```

---
## 2.3 APIs
Ticketing:
- POST /api/tickets
- GET /api/tickets?centreId=&status=&category=&assignedTo=
- POST /api/tickets/{id}/assign
- POST /api/tickets/{id}/comment
- POST /api/tickets/{id}/close

Rescheduling (ops wrapper):
- POST /api/reschedules
- POST /api/reschedules/{id}/propose-slots
- POST /api/reschedules/{id}/confirm
- POST /api/reschedules/{id}/cancel

Centre notices:
- POST /api/notices
- GET /api/notices?centreId=

---
## 2.4 Escalation Rules
Worker every 5 minutes:
- if now > slaDueAt and status not CLOSED → status=ESCALATED + notify

---
## 2.5 Integration Points
- Notifications (email/SMS/push)
- Assets/stock links (Infrastructure)
- Refund/reimbursement links (Finance)
