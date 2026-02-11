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
# 5) Governance Domain
## Scope
Security, compliance, approvals, auditing, privacy:
- RBAC enforcement and access reviews
- Tenant isolation policies
- Audit logging (immutable events)
- Approvals workflow (refunds, overrides, payroll exceptions)
- Complaints/incidents
- Retention policies (recordings/transcripts)

---
## 5.1 UX/UI
Admin/Compliance:
- Audit search & export (approval-gated)
- Approval queue
- Complaints/incidents case management
- Retention policy configuration
- Access review (privileged roles)

---
## 5.2 Data Model

```prisma
model AuditEvent {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String? @db.Uuid
  actorId   String? @db.Uuid
  actorRole String?
  action    String
  entityType String
  entityId  String?
  before    Json?
  after     Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}

model ApprovalRequest {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  type      String // REFUND, PAYROLL_EXCEPTION, TUTOR_OVERRIDE, DATA_EXPORT
  status    String @default("PENDING") // PENDING, APPROVED, REJECTED, CANCELLED
  requestedBy String @db.Uuid
  approverRole String
  approverId String? @db.Uuid
  reason    String
  payload   Json
  decidedAt DateTime?
  createdAt DateTime @default(now())
}

model Complaint {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  raisedBy  String @db.Uuid
  againstUserId String? @db.Uuid
  ticketId  String? @db.Uuid
  category  String
  description String
  status    String @default("OPEN") // OPEN, INVESTIGATING, RESOLVED, CLOSED
  outcome   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Incident {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  severity  String // LOW, MEDIUM, HIGH
  studentId String? @db.Uuid
  sessionId String? @db.Uuid
  description String
  status    String @default("OPEN")
  actions   Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---
## 5.3 APIs
Audit:
- GET /api/governance/audit?centreId=&actorId=&action=&from=&to=
- POST /api/governance/audit/export (approval required)

Approvals:
- POST /api/governance/approvals
- POST /api/governance/approvals/{id}/approve
- POST /api/governance/approvals/{id}/reject
- GET /api/governance/approvals?status=&type=

Complaints/incidents:
- POST /api/governance/complaints
- GET /api/governance/complaints?status=
- POST /api/governance/incidents
- GET /api/governance/incidents?status=

---
## 5.4 Policies
- Every privileged mutation writes AuditEvent
- Cross-centre access blocked by default; centreId comes from auth context
- Overrides require ApprovalRequest or at least a justification note
- Retention config per centre: recordings/transcripts X days with scheduled purge job
