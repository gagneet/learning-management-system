# Database Administrator — Database Plan & Schema Changes

## Document Purpose

This document defines all database schema changes required for Phase 1 implementation, including new models, indexes, migrations, and rollback procedures.

---

## 1. Schema Change Overview

### New Models (10)
1. **AuditEvent** - Audit logging for governance
2. **ApprovalRequest** - Approval workflow management
3. **ClassCohort** - Academic class/cohort management
4. **ClassMembership** - Student enrollment in classes
5. **AttendanceRecord** - Session attendance tracking (replaces SessionAttendance)
6. **CatchUpPackage** - Auto-generated catch-up work
7. **Ticket** - Support ticket management
8. **TicketComment** - Ticket conversation threads
9. **TicketAttachment** - Ticket file attachments
10. **SLAConfig** - Service level agreement configuration
11. **FeePlan** - Fee structure templates
12. **StudentAccount** - Student financial account summary
13. **Invoice** - Student invoices
14. **InvoiceLine** - Invoice line items
15. **Payment** - Payment records
16. **Refund** - Refund requests and processing

---

## 2. Detailed Schema Definitions

### 2.1 Governance Domain

#### AuditEvent
```prisma
model AuditEvent {
  id            String   @id @default(cuid())
  userId        String   // Actor who performed the action
  userName      String   // Denormalized for reporting
  userRole      Role     // Role at time of action
  
  action        AuditAction
  resourceType  String   // e.g., "Refund", "Invoice", "Ticket"
  resourceId    String   // ID of the affected resource
  
  beforeState   Json?    // State before the action (UPDATE/DELETE)
  afterState    Json?    // State after the action (CREATE/UPDATE)
  
  centreId      String   // Multi-tenancy
  centre        Center   @relation(fields: [centreId], references: [id])
  
  ipAddress     String?  // Client IP address
  metadata      Json?    // Additional context
  
  createdAt     DateTime @default(now())
  
  @@index([centreId])
  @@index([userId])
  @@index([resourceType, resourceId])
  @@index([action])
  @@index([createdAt])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  APPROVE
  REJECT
  ESCALATE
}
```

**Rationale:**
- Immutable audit trail for compliance
- Denormalized userName for performance (user may be deleted)
- JSONB for flexible before/after state storage
- Composite index on (resourceType, resourceId) for fast lookups

---

#### ApprovalRequest
```prisma
model ApprovalRequest {
  id              String   @id @default(cuid())
  type            ApprovalType
  
  requestedById   String
  requestedBy     User     @relation("RequestedApprovals", fields: [requestedById], references: [id])
  requestedByName String   // Denormalized
  
  status          ApprovalStatus @default(PENDING)
  
  approvedById    String?
  approvedBy      User?    @relation("ApprovedApprovals", fields: [approvedById], references: [id])
  approvedByName  String?  // Denormalized
  approvedAt      DateTime?
  
  resourceType    String   // e.g., "Refund"
  resourceId      String   // e.g., refund_123
  
  metadata        Json     // Type-specific data (amount, reason, etc.)
  comment         String?  // Approver's comment
  
  centreId        String
  centre          Center   @relation(fields: [centreId], references: [id])
  
  expiresAt       DateTime // Auto-reject if not actioned
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([centreId, status])
  @@index([requestedById])
  @@index([approvedById])
  @@index([type])
  @@index([expiresAt])
}

enum ApprovalType {
  REFUND
  TUTOR_OVERRIDE
  PAYROLL_EXCEPTION
  FEE_WAIVER
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}
```

**Rationale:**
- Generic approval workflow for multiple resource types
- Metadata JSON for type-specific fields
- Expiration mechanism for SLA compliance
- Prevents self-approval via separate requester/approver

---

### 2.2 Academic Domain

#### ClassCohort
```prisma
model ClassCohort {
  id              String   @id @default(cuid())
  name            String   // "Math Grade 5 - Spring 2026"
  subject         String   // "Mathematics"
  description     String?
  
  startDate       DateTime
  endDate         DateTime
  
  maxCapacity     Int      @default(20)
  currentEnrollment Int    @default(0)
  
  status          ClassStatus @default(ACTIVE)
  
  teacherId       String
  teacher         User     @relation(fields: [teacherId], references: [id])
  
  centreId        String
  centre          Center   @relation(fields: [centreId], references: [id])
  
  members         ClassMembership[]
  sessions        ClassSession[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([centreId])
  @@index([teacherId])
  @@index([status])
  @@index([startDate, endDate])
}

enum ClassStatus {
  ACTIVE
  COMPLETED
  CANCELLED
}
```

---

#### ClassMembership
```prisma
model ClassMembership {
  id          String   @id @default(cuid())
  
  classId     String
  class       ClassCohort @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  studentId   String
  student     User     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  status      MembershipStatus @default(ACTIVE)
  joinedAt    DateTime @default(now())
  leftAt      DateTime?
  
  centreId    String   // Denormalized for efficient queries
  
  @@unique([classId, studentId])
  @@index([classId])
  @@index([studentId])
  @@index([centreId, status])
}

enum MembershipStatus {
  ACTIVE
  DROPPED
  COMPLETED
}
```

---

#### ClassSession (extends existing Session)
```prisma
// Update existing Session model
model Session {
  // ... existing fields ...
  
  classId         String?  // NEW: Link to ClassCohort
  class           ClassCohort? @relation(fields: [classId], references: [id])
  
  // Replace attendance with new model reference
  attendanceRecords AttendanceRecord[]
  
  @@index([classId])
}
```

---

#### AttendanceRecord (replaces SessionAttendance)
```prisma
model AttendanceRecord {
  id          String   @id @default(cuid())
  
  sessionId   String
  session     Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  studentId   String
  student     User     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  status      AttendanceStatus @default(PENDING)
  
  markedAt    DateTime?
  markedById  String?
  markedBy    User?    @relation("MarkedAttendance", fields: [markedById], references: [id])
  
  notes       String?
  
  centreId    String   // Denormalized
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([sessionId, studentId])
  @@index([sessionId])
  @@index([studentId])
  @@index([centreId, sessionId])
  @@index([status])
}

enum AttendanceStatus {
  PENDING
  PRESENT
  ABSENT
  LATE
  EXCUSED
  CANCELLED
}
```

**Migration Note:** Migrate data from SessionAttendance to AttendanceRecord

---

#### CatchUpPackage
```prisma
model CatchUpPackage {
  id          String   @id @default(cuid())
  
  studentId   String
  student     User     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  sessionId   String
  session     Session  @relation(fields: [sessionId], references: [id])
  
  attendanceId String  @unique
  attendance  AttendanceRecord @relation(fields: [attendanceId], references: [id])
  
  status      CatchUpStatus @default(PENDING)
  
  dueDate     DateTime // Auto-calculated: missedDate + 7 days
  completedAt DateTime?
  
  resources   Json     // Array of { type, url, title, duration }
  notes       String?
  
  centreId    String
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([studentId, status])
  @@index([centreId])
  @@index([dueDate])
}

enum CatchUpStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  OVERDUE
}
```

**Auto-generation Trigger:** When AttendanceRecord.status = ABSENT

---

### 2.3 Operations Domain

#### Ticket
```prisma
model Ticket {
  id            String   @id @default(cuid())
  ticketNumber  String   @unique // TICK-2026-0001
  
  type          TicketType
  priority      TicketPriority
  status        TicketStatus @default(OPEN)
  
  subject       String   // 5-200 chars
  description   String   // 10-2000 chars
  
  createdById   String
  createdBy     User     @relation("CreatedTickets", fields: [createdById], references: [id])
  
  assignedToId  String?
  assignedTo    User?    @relation("AssignedTickets", fields: [assignedToId], references: [id])
  
  resolution    String?  // Filled when RESOLVED/CLOSED
  
  slaDueAt      DateTime // Auto-calculated from SLAConfig
  isOverdue     Boolean  @default(false)
  
  centreId      String
  centre        Center   @relation(fields: [centreId], references: [id])
  
  comments      TicketComment[]
  attachments   TicketAttachment[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([centreId, status])
  @@index([createdById])
  @@index([assignedToId])
  @@index([ticketNumber])
  @@index([slaDueAt])
  @@index([centreId, status, slaDueAt]) // Composite for escalation job
}

enum TicketType {
  IT
  INVENTORY
  COMPLAINT
  MAINTENANCE
  GENERAL
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
  ESCALATED
}
```

---

#### TicketComment
```prisma
model TicketComment {
  id          String   @id @default(cuid())
  
  ticketId    String
  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  userName    String   // Denormalized
  
  text        String
  isInternal  Boolean  @default(false) // Internal notes vs public comments
  isSystem    Boolean  @default(false) // System-generated (e.g., status change)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([ticketId])
  @@index([userId])
}
```

---

#### TicketAttachment
```prisma
model TicketAttachment {
  id          String   @id @default(cuid())
  
  ticketId    String
  ticket      Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  
  filename    String
  url         String   // Cloud storage URL
  mimeType    String
  size        Int      // Bytes
  
  uploadedById String
  uploadedBy  User     @relation(fields: [uploadedById], references: [id])
  
  createdAt   DateTime @default(now())
  
  @@index([ticketId])
}
```

---

#### SLAConfig
```prisma
model SLAConfig {
  id          String   @id @default(cuid())
  
  ticketType  TicketType
  priority    TicketPriority
  
  responseTimeHours   Int  // Time to first response
  resolutionTimeHours Int  // Time to resolution
  
  centreId    String
  centre      Center   @relation(fields: [centreId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([centreId, ticketType, priority])
  @@index([centreId])
}
```

**Default SLA Matrix:**
| Priority | Response | Resolution |
|----------|----------|------------|
| URGENT   | 1h       | 4h         |
| HIGH     | 4h       | 24h        |
| MEDIUM   | 24h      | 72h        |
| LOW      | 48h      | 168h       |

---

### 2.4 Finance Domain

#### FeePlan
```prisma
model FeePlan {
  id          String   @id @default(cuid())
  name        String
  description String?
  
  amount      Decimal  @db.Decimal(10, 2)
  currency    String   @default("USD")
  
  frequency   BillingFrequency
  
  // Optional filters
  applicableCourses Json? // Array of course IDs
  applicableClasses Json? // Array of class IDs
  
  status      FeePlanStatus @default(ACTIVE)
  
  centreId    String
  centre      Center   @relation(fields: [centreId], references: [id])
  
  invoices    Invoice[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([centreId, status])
}

enum BillingFrequency {
  ONE_TIME
  WEEKLY
  MONTHLY
  TERM
  ANNUAL
}

enum FeePlanStatus {
  ACTIVE
  ARCHIVED
}
```

---

#### StudentAccount
```prisma
model StudentAccount {
  id          String   @id @default(cuid())
  
  studentId   String   @unique
  student     User     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  totalBilled    Decimal @db.Decimal(10, 2) @default(0)
  totalPaid      Decimal @db.Decimal(10, 2) @default(0)
  totalRefunded  Decimal @db.Decimal(10, 2) @default(0)
  balance        Decimal @db.Decimal(10, 2) @default(0) // Calculated
  
  centreId    String
  centre      Center   @relation(fields: [centreId], references: [id])
  
  invoices    Invoice[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([centreId])
  @@index([studentId])
}
```

---

#### Invoice
```prisma
model Invoice {
  id            String   @id @default(cuid())
  invoiceNumber String   @unique // INV-2026-0001
  
  studentAccountId String
  studentAccount StudentAccount @relation(fields: [studentAccountId], references: [id])
  
  studentId     String   // Denormalized for queries
  
  feePlanId     String?
  feePlan       FeePlan? @relation(fields: [feePlanId], references: [id])
  
  issueDate     DateTime @default(now())
  dueDate       DateTime
  sentAt        DateTime?
  
  status        InvoiceStatus @default(DRAFT)
  
  subtotal      Decimal  @db.Decimal(10, 2)
  tax           Decimal  @db.Decimal(10, 2) @default(0)
  total         Decimal  @db.Decimal(10, 2)
  
  paidAmount    Decimal  @db.Decimal(10, 2) @default(0)
  balance       Decimal  @db.Decimal(10, 2) // Calculated: total - paidAmount
  
  notes         String?
  
  centreId      String
  centre        Center   @relation(fields: [centreId], references: [id])
  
  lineItems     InvoiceLine[]
  payments      Payment[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([centreId, status])
  @@index([studentId])
  @@index([invoiceNumber])
  @@index([dueDate])
  @@index([centreId, status, dueDate]) // For overdue queries
}

enum InvoiceStatus {
  DRAFT
  SENT
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}
```

---

#### InvoiceLine
```prisma
model InvoiceLine {
  id          String   @id @default(cuid())
  
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  description String
  quantity    Int      @default(1)
  unitPrice   Decimal  @db.Decimal(10, 2)
  amount      Decimal  @db.Decimal(10, 2) // quantity * unitPrice
  
  order       Int      @default(0) // Display order
  
  createdAt   DateTime @default(now())
  
  @@index([invoiceId])
}
```

---

#### Payment
```prisma
model Payment {
  id          String   @id @default(cuid())
  
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
  
  amount      Decimal  @db.Decimal(10, 2)
  
  method      PaymentMethod
  paymentDate DateTime
  reference   String?  // Check number, transaction ID, etc.
  
  notes       String?
  
  recordedById String
  recordedBy  User     @relation(fields: [recordedById], references: [id])
  
  centreId    String
  
  refunds     Refund[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([invoiceId])
  @@index([centreId])
  @@index([paymentDate])
}

enum PaymentMethod {
  CASH
  CHECK
  BANK_TRANSFER
  CARD
  OTHER
}
```

---

#### Refund
```prisma
model Refund {
  id          String   @id @default(cuid())
  refundNumber String  @unique // REF-2026-0001
  
  paymentId   String
  payment     Payment  @relation(fields: [paymentId], references: [id])
  
  amount      Decimal  @db.Decimal(10, 2)
  reason      String
  
  status      RefundStatus @default(PENDING)
  
  refundMethod String?  // ORIGINAL_METHOD, BANK_TRANSFER, etc.
  
  processedDate DateTime?
  processedReference String?
  
  requestedById String
  requestedBy User     @relation("RequestedRefunds", fields: [requestedById], references: [id])
  
  approvedById String?
  approvedBy  User?    @relation("ApprovedRefunds", fields: [approvedById], references: [id])
  approvedAt  DateTime?
  
  approvalRequestId String? @unique
  approvalRequest ApprovalRequest? @relation(fields: [approvalRequestId], references: [id])
  
  centreId    String
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([centreId, status])
  @@index([paymentId])
  @@index([refundNumber])
}

enum RefundStatus {
  PENDING
  APPROVED
  REJECTED
  PROCESSED
}
```

---

## 3. Index Strategy

### 3.1 Multi-Tenancy Indexes
All models with `centreId` get:
```prisma
@@index([centreId])
```

### 3.2 Performance-Critical Composite Indexes

```prisma
// Ticket escalation query
@@index([centreId, status, slaDueAt]) on Ticket

// Invoice overdue query
@@index([centreId, status, dueDate]) on Invoice

// Attendance by session
@@index([centreId, sessionId]) on AttendanceRecord

// Active class memberships
@@index([centreId, status]) on ClassMembership

// Pending approvals
@@index([centreId, status]) on ApprovalRequest

// Audit log search
@@index([centreId, userId]) on AuditEvent
@@index([centreId, resourceType, resourceId]) on AuditEvent
@@index([centreId, createdAt]) on AuditEvent
```

---

## 4. Data Migration Plan

### 4.1 SessionAttendance → AttendanceRecord
```sql
-- Migration (Prisma will generate)
INSERT INTO "AttendanceRecord" (
  id, sessionId, studentId, status, markedAt, centreId, createdAt, updatedAt
)
SELECT 
  id,
  sessionId,
  userId as studentId,
  CASE 
    WHEN attended = true THEN 'PRESENT'::AttendanceStatus
    ELSE 'ABSENT'::AttendanceStatus
  END as status,
  CASE WHEN attended = true THEN joinedAt ELSE NULL END as markedAt,
  -- Derive centreId from session -> lesson -> module -> course -> centre
  (SELECT c.centreId FROM "Course" c 
   INNER JOIN "Module" m ON c.id = m.courseId
   INNER JOIN "Lesson" l ON m.id = l.moduleId
   INNER JOIN "Session" s ON l.id = s.lessonId
   WHERE s.id = "SessionAttendance".sessionId
   LIMIT 1) as centreId,
  NOW() as createdAt,
  NOW() as updatedAt
FROM "SessionAttendance";

-- Verify count matches
SELECT COUNT(*) FROM "SessionAttendance";
SELECT COUNT(*) FROM "AttendanceRecord";

-- Drop old table (after verification)
DROP TABLE "SessionAttendance";
```

### 4.2 Default SLA Configuration
```sql
-- Seed default SLA configs for each centre
INSERT INTO "SLAConfig" (id, ticketType, priority, responseTimeHours, resolutionTimeHours, centreId, createdAt, updatedAt)
SELECT 
  gen_random_uuid(),
  type::TicketType,
  priority::TicketPriority,
  responseHours,
  resolutionHours,
  c.id as centreId,
  NOW(),
  NOW()
FROM "Center" c
CROSS JOIN (
  VALUES 
    ('URGENT', 1, 4),
    ('HIGH', 4, 24),
    ('MEDIUM', 24, 72),
    ('LOW', 48, 168)
) AS sla(priority, responseHours, resolutionHours)
CROSS JOIN (
  VALUES ('IT'), ('INVENTORY'), ('COMPLAINT'), ('MAINTENANCE'), ('GENERAL')
) AS types(type);
```

---

## 5. Rollback Procedures

### 5.1 Complete Rollback
```bash
# Revert Prisma migrations
npx prisma migrate resolve --rolled-back <migration_name>

# Or reset to previous state (DESTRUCTIVE)
npx prisma migrate reset
npx prisma migrate deploy
```

### 5.2 Partial Rollback (Drop New Tables)
```sql
-- Drop in reverse dependency order
DROP TABLE IF EXISTS "InvoiceLine" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Refund" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "StudentAccount" CASCADE;
DROP TABLE IF EXISTS "FeePlan" CASCADE;

DROP TABLE IF EXISTS "TicketAttachment" CASCADE;
DROP TABLE IF EXISTS "TicketComment" CASCADE;
DROP TABLE IF EXISTS "SLAConfig" CASCADE;
DROP TABLE IF EXISTS "Ticket" CASCADE;

DROP TABLE IF EXISTS "CatchUpPackage" CASCADE;
DROP TABLE IF EXISTS "AttendanceRecord" CASCADE;
DROP TABLE IF EXISTS "ClassMembership" CASCADE;
DROP TABLE IF EXISTS "ClassCohort" CASCADE;

DROP TABLE IF EXISTS "ApprovalRequest" CASCADE;
DROP TABLE IF EXISTS "AuditEvent" CASCADE;

-- Restore SessionAttendance if backed up
-- RESTORE TABLE "SessionAttendance" FROM BACKUP;
```

---

## 6. Testing Strategy

### 6.1 Multi-Tenancy Isolation Tests
```typescript
describe("Multi-tenancy", () => {
  it("should not return data from other centres", async () => {
    const centre1Data = await prisma.ticket.findMany({
      where: { centreId: "centre_1" }
    });
    
    const centre2Data = await prisma.ticket.findMany({
      where: { centreId: "centre_2" }
    });
    
    expect(centre1Data.every(t => t.centreId === "centre_1")).toBe(true);
    expect(centre2Data.every(t => t.centreId === "centre_2")).toBe(true);
    expect(centre1Data.some(t => t.centreId === "centre_2")).toBe(false);
  });
});
```

### 6.2 Index Performance Tests
```sql
-- Verify index usage
EXPLAIN ANALYZE 
SELECT * FROM "Ticket" 
WHERE centreId = 'centre_1' AND status = 'OPEN' AND slaDueAt < NOW();

-- Should show "Index Scan using Ticket_centreId_status_slaDueAt_idx"
```

---

## 7. Data Volume Estimates (Per Centre, 1 Year)

| Model | Estimated Rows | Growth Rate |
|-------|----------------|-------------|
| AuditEvent | 100,000 | High |
| ApprovalRequest | 500 | Low |
| ClassCohort | 50 | Low |
| ClassMembership | 1,000 | Medium |
| AttendanceRecord | 10,000 | High |
| CatchUpPackage | 2,000 | Medium |
| Ticket | 5,000 | Medium |
| TicketComment | 20,000 | High |
| Invoice | 1,200 | Low |
| Payment | 1,500 | Low |
| Refund | 50 | Very Low |

**Storage Estimate:** ~500MB per centre per year (excluding attachments)

---

## 8. Backup Strategy

### 8.1 Critical Tables (Daily Backups)
- Invoice
- Payment
- Refund
- StudentAccount
- AuditEvent

### 8.2 Archive Strategy
- AuditEvent: Archive records > 2 years to cold storage
- Ticket: Archive CLOSED tickets > 1 year
- AttendanceRecord: Keep all (small volume)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | Database Administrator | Initial version |

---
