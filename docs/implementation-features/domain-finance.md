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
# 3) Finance Domain
## Scope
Money in/out + profitability per centre:
- Student billing, invoices, payments, credits/refunds
- Tutor payroll, payouts, deductions
- Reimbursements
- Centre P&L reporting

---
## 3.1 UX/UI
Finance Officer:
- Billing dashboard (overdue, failed payments)
- Refund approval queue
- Reimbursement approval queue
- P&L dashboard (month/term)

Payroll Officer:
- Payroll runs (draft → approve → export/paid)
- Exceptions (manual adjustments with approvals)

---
## 3.2 Data Model (Billing + Payroll)

```prisma
model FeePlan {
  id       String @id @default(uuid()) @db.Uuid
  centreId String @db.Uuid
  name     String
  cadence  String // WEEKLY, TERM, MONTHLY
  amountCents Int
  currency String @default("AUD")
  rules    Json?
  active   Boolean @default(true)
}

model StudentAccount {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  studentId String @unique @db.Uuid
  feePlanId String? @db.Uuid
  balanceCents Int @default(0)
  status    String @default("ACTIVE")
}

model Invoice {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  studentId String @db.Uuid
  issueDate DateTime
  dueDate   DateTime
  status    String @default("ISSUED")
  totalCents Int
  currency  String @default("AUD")
  ticketId  String? @db.Uuid
  lines     InvoiceLine[]
  createdAt DateTime @default(now())
}

model InvoiceLine {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  invoiceId String @db.Uuid
  kind      String // TUITION, MATERIALS, PENALTY, DISCOUNT, CREDIT
  description String
  amountCents Int
  metadata  Json?
}

model Payment {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  invoiceId String? @db.Uuid
  studentId String @db.Uuid
  provider  String // STRIPE, MANUAL, BANK
  providerRef String?
  amountCents Int
  currency  String @default("AUD")
  status    String // PENDING, SUCCEEDED, FAILED, REFUNDED
  receivedAt DateTime?
}

model Refund {
  id        String @id @default(uuid()) @db.Uuid
  centreId  String @db.Uuid
  paymentId String @db.Uuid
  ticketId  String? @db.Uuid
  amountCents Int
  status    String @default("REQUESTED")
  approvedBy String? @db.Uuid
  approvedAt DateTime?
}

model TutorRate {
  id       String @id @default(uuid()) @db.Uuid
  centreId String @db.Uuid
  tutorId  String @db.Uuid
  mode     String // PER_SESSION, HOURLY
  rateCents Int
  currency String @default("AUD")
  effectiveFrom DateTime
  effectiveTo DateTime?
}

model PayrollRun {
  id       String @id @default(uuid()) @db.Uuid
  centreId String @db.Uuid
  periodStart DateTime
  periodEnd   DateTime
  status   String @default("DRAFT") // DRAFT, APPROVED, PAID, EXPORTED
  createdAt DateTime @default(now())
  approvedBy String? @db.Uuid
  approvedAt DateTime?
  items    PayrollItem[]
}

model PayrollItem {
  id       String @id @default(uuid()) @db.Uuid
  centreId String @db.Uuid
  payrollRunId String @db.Uuid
  tutorId  String @db.Uuid
  sessionsCount Int @default(0)
  hours    Float @default(0)
  basePayCents Int
  bonusCents Int @default(0)
  deductionsCents Int @default(0)
  totalPayCents Int
  notes    String?
}

model Reimbursement {
  id       String @id @default(uuid()) @db.Uuid
  centreId String @db.Uuid
  requesterId String @db.Uuid
  ticketId String? @db.Uuid
  amountCents Int
  currency String @default("AUD")
  receiptUrl String?
  reason   String
  status   String @default("REQUESTED")
  approvedBy String? @db.Uuid
  approvedAt DateTime?
}
```

---
## 3.3 APIs
Billing:
- POST /api/finance/fee-plans
- POST /api/finance/invoices
- GET /api/finance/invoices?status=&centreId=
- POST /api/finance/payments/webhook
- POST /api/finance/refunds/request
- POST /api/finance/refunds/{id}/approve
- POST /api/finance/refunds/{id}/reject

Payroll:
- POST /api/finance/payroll-runs
- POST /api/finance/payroll-runs/{id}/recalculate
- POST /api/finance/payroll-runs/{id}/approve
- POST /api/finance/payroll-runs/{id}/mark-paid
- GET /api/finance/payroll-runs/{id}

Reimbursements:
- POST /api/finance/reimbursements
- POST /api/finance/reimbursements/{id}/approve
- POST /api/finance/reimbursements/{id}/reject

---
## 3.4 Rules
- Refunds and manual payroll edits require approvals (Governance)
- Payroll uses delivered sessions (Session.status=COMPLETED) as the source of truth
- P&L derived monthly: revenue - payroll - reimbursements - vendor costs
