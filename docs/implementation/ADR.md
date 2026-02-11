# Architecture Decision Records (ADR)

## Document Purpose

This document captures key architectural and design decisions made during Phase 1 implementation, along with rationale and alternatives considered.

---

## ADR-001: Multi-Tenancy Implementation Strategy

**Date:** 2026-02-11  
**Status:** Accepted  
**Decision Makers:** Technical PM, DBA, Engineering Lead

### Context
The LMS must support multiple centres (tenants) with strict data isolation. We need to choose between:
1. Separate databases per centre
2. Shared database with centre_id column (row-level isolation)
3. Separate schemas per centre

### Decision
**Chosen: Shared database with centreId column** (Option 2)

### Rationale
- **Cost-effective**: Single database instance for all centres
- **Operational simplicity**: One set of migrations, backups, monitoring
- **Performance**: Modern PostgreSQL RLS handles millions of rows efficiently
- **Scalability**: Can shard by centreId later if needed
- **Cross-centre analytics**: SUPER_ADMIN can query across centres

### Implementation
- Every model (except Center itself) has `centreId` foreign key
- Prisma queries MUST filter by `centreId` (except SUPER_ADMIN)
- `centreId` sourced ONLY from session, never from request
- Composite indexes: `@@index([centreId, ...])`

### Alternatives Considered
- **Separate DBs**: Rejected due to operational complexity, cost
- **Separate schemas**: Rejected due to migration complexity

### Consequences
- Must enforce centreId in ALL queries (risk of leakage if missed)
- Requires comprehensive testing of multi-tenancy isolation
- Index bloat requires monitoring as data grows

---

## ADR-002: Approval Workflow Design

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Multiple actions require approval (refunds, tutor overrides, etc.). We need a flexible approval system that can support:
- Different approval types
- Single-level approval (Phase 1)
- Multi-level approval (future)
- Expiration and escalation

### Decision
**Generic ApprovalRequest model with metadata JSONB**

### Rationale
- **Flexibility**: metadata JSON stores type-specific data
- **Single table**: Easier to query "all pending approvals"
- **Extensible**: Can add approval levels, workflows in future
- **Audit-friendly**: Links to audit log for full history

### Implementation
```prisma
model ApprovalRequest {
  type: ApprovalType  // REFUND, TUTOR_OVERRIDE, etc.
  resourceType: String  // "Refund", "Enrollment"
  resourceId: String
  metadata: Json  // { amount, reason, etc. }
  status: PENDING | APPROVED | REJECTED | EXPIRED
  expiresAt: DateTime
}
```

### Alternatives Considered
- **Separate tables per type**: Rejected (too many tables, hard to query)
- **Workflow engine**: Overkill for Phase 1

### Consequences
- Type safety on metadata requires runtime validation
- Cannot use database foreign keys for resourceId
- Requires application logic to handle approvals

---

## ADR-003: Audit Logging Strategy

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Compliance and troubleshooting require comprehensive audit logging of privileged actions.

### Decision
**Dedicated AuditEvent model with before/after JSONB state**

### Rationale
- **Immutable**: Write-only, never update/delete
- **Complete**: Captures full before/after state
- **Queryable**: Can search by user, action, resource, date
- **Compliant**: Meets SOC2, GDPR audit requirements

### Implementation
- Audit helper function called by all privileged mutations
- Before/after state captured as JSON
- Sensitive data (passwords) excluded
- IP address logged when available

### Alternatives Considered
- **Event sourcing**: Too complex for Phase 1
- **Application logs only**: Not queryable, not compliant

### Consequences
- Table grows quickly (~100K rows/centre/year)
- Requires archival strategy (>2 years to cold storage)
- JSON querying less performant than structured data

---

## ADR-004: Session-Attendance-CatchUp Relationship

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Need to track attendance and auto-generate catch-up work for absent students.

### Decision
**Replace SessionAttendance with AttendanceRecord, link CatchUpPackage**

### Rationale
- **Richer data**: Status enum (PRESENT, ABSENT, LATE, EXCUSED) vs boolean
- **Audit trail**: markedBy, markedAt fields
- **Automation**: Trigger catch-up on ABSENT status
- **Future-proof**: Can add TARDY, MEDICAL, etc.

### Implementation
```
Session 1:N AttendanceRecord
AttendanceRecord 1:1 CatchUpPackage (if ABSENT)
```

### Migration
Data migrated from SessionAttendance:
- `attended = true` → `status = PRESENT`
- `attended = false` → `status = ABSENT`

### Consequences
- Breaking change from existing schema
- Requires data migration script
- Catch-up generation adds processing time to attendance marking

---

## ADR-005: Financial Data Model

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Need to track student billing, payments, and refunds with audit trail.

### Decision
**Separate models: StudentAccount, Invoice, InvoiceLine, Payment, Refund**

### Rationale
- **Normalized**: Separate concerns (billing, payment, refund)
- **Flexible**: Support multiple line items, partial payments
- **Audit-friendly**: Each entity has full history
- **Future-proof**: Can add tax, discounts, subscriptions

### Implementation
```
StudentAccount (summary)
├── Invoice (billing document)
│   └── InvoiceLine (line items)
└── Payment (money received)
    └── Refund (money returned)
```

### Alternatives Considered
- **Single FinancialTransaction**: Rejected (too generic, hard to query)
- **Stripe-only**: Rejected (need manual payment support)

### Consequences
- Multiple tables increases complexity
- Requires careful balance calculations
- Need to handle race conditions on concurrent payments

---

## ADR-006: Ticket SLA Implementation

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Support tickets need SLA tracking and escalation.

### Decision
**Pre-calculated slaDueAt field + periodic escalation job**

### Rationale
- **Performance**: No real-time SLA calculation on every query
- **Simple**: Standard datetime comparison
- **Flexible**: SLAConfig table allows per-centre customization

### Implementation
- `slaDueAt = createdAt + SLAConfig.resolutionTimeHours`
- Background job (hourly): Find tickets where `slaDueAt < NOW() AND status = OPEN`
- Update status to ESCALATED, notify

### Alternatives Considered
- **Real-time calculation**: Too slow for large datasets
- **Materialized view**: Overkill, adds complexity

### Consequences
- Clock skew can affect accuracy (use UTC everywhere)
- Hourly job means ~1 hour delay in escalation
- Need cron/scheduler setup (Node-cron or external)

---

## ADR-007: RBAC Enforcement Pattern

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Every API endpoint must enforce role-based permissions.

### Decision
**Centralized RBAC helper functions, deny by default**

### Rationale
- **Consistent**: Single source of truth for permissions
- **Testable**: Can unit test permission logic
- **Maintainable**: Change permissions in one place
- **Secure**: Explicit allow list, not block list

### Implementation
```typescript
// lib/rbac.ts
function hasPermission(session: Session, action: string): boolean {
  const permissions = {
    "academic:class:create": ["SUPER_ADMIN", "CENTER_ADMIN", "TEACHER"],
    "finance:refund:approve": ["SUPER_ADMIN", "CENTER_ADMIN", "FINANCE_ADMIN"]
  };
  return permissions[action]?.includes(session.user.role) || false;
}

// In API handler
if (!hasPermission(session, "academic:class:create")) {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
```

### Alternatives Considered
- **Decorator pattern**: TypeScript decorators experimental
- **Middleware**: Hard to parameterize per-endpoint
- **CASL/Casbin**: Overkill for Phase 1

### Consequences
- Need to define all permissions upfront
- String-based keys prone to typos (use constants)
- Performance impact negligible

---

## ADR-008: API Response Format

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Need consistent API response structure for success and errors.

### Decision
**Envelope pattern with data/meta for success, error object for failures**

### Rationale
- **Consistent**: All responses follow same structure
- **Informative**: Meta includes pagination, totals
- **Client-friendly**: Easy to parse, type-safe
- **Standards-aligned**: Similar to JSON:API

### Implementation
```typescript
// Success
{ data: {}, meta: { page: 1, total: 100 } }

// Error
{ error: { code: "VALIDATION_ERROR", message: "...", details: {} } }
```

### Alternatives Considered
- **Bare responses**: Rejected (inconsistent, hard to add metadata)
- **JSON:API**: Too verbose for our needs

---

## ADR-009: Background Job Strategy

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Need to run periodic tasks (ticket escalation, catch-up reminders, etc.).

### Decision
**Node-cron for Phase 1, migrate to BullMQ for Phase 2**

### Rationale
- **Simple**: Node-cron built-in, no infrastructure needed
- **Sufficient**: Hourly jobs adequate for Phase 1
- **Future-proof**: Can migrate to BullMQ when scaling

### Implementation
```typescript
// lib/jobs/escalation.ts
import cron from 'node-cron';

cron.schedule('0 * * * *', async () => {  // Every hour
  await escalateOverdueTickets();
});
```

### Alternatives Considered
- **BullMQ**: Better but requires Redis, overkill for Phase 1
- **Cloud scheduler**: Adds external dependency

### Consequences
- Jobs run in app process (no isolation)
- If app crashes, jobs don't run
- Not horizontally scalable (multiple instances run duplicates)

**Migration Plan (Phase 2):**
- Add Redis
- Migrate to BullMQ
- Add job queue UI (Bull Board)

---

## ADR-010: Test Strategy

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Need comprehensive testing without slowing development.

### Decision
**Layered testing: Unit (Jest) + Integration (Supertest) + E2E (Playwright)**

### Rationale
- **Fast feedback**: Unit tests run in < 10s
- **Confidence**: E2E tests cover critical paths
- **Balance**: 60% coverage minimum, focus on critical paths

### Implementation
- Unit: Pure functions, helpers, calculations
- Integration: API endpoints, database operations
- E2E: Complete user flows (login → action → verify)

### Coverage Goals
- Critical paths (multi-tenancy, RBAC, finance): 80%
- Business logic: 70%
- Overall: 60%

### Alternatives Considered
- **100% coverage**: Diminishing returns, slows development
- **E2E only**: Too slow, brittle
- **No tests**: Unacceptable risk

---

## ADR-011: UI Framework Choice

**Date:** 2026-02-11  
**Status:** Accepted (Inherited)

### Context
UI must be built with existing Next.js 16 + React 19 stack.

### Decision
**Keep existing stack: Next.js 16, React 19, TypeScript, Tailwind CSS v3**

### Rationale
- **Already in place**: No migration needed
- **Modern**: Latest stable versions
- **Type-safe**: TypeScript strict mode
- **Styling**: Tailwind CSS utility-first approach

### Note on Tailwind
**Do NOT upgrade to Tailwind v4** - known issues with Next.js 16. Stay on v3.

### Consequences
- Must follow existing patterns
- Must maintain consistency with existing pages
- Must reuse existing components where possible

---

## ADR-012: Database Migration Strategy

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Need to apply schema changes to production database.

### Decision
**Prisma push for Phase 1, migrate to Prisma Migrate for Phase 2**

### Rationale
- **Speed**: `prisma db push` faster for rapid iteration
- **Safety**: Review generated SQL before production
- **Rollback**: Manual rollback scripts documented

### Implementation
```bash
# Development
npm run db:push

# Production (manual)
1. Review schema changes
2. Backup database
3. Run db:push
4. Verify with health checks
5. Rollback if issues
```

### Future (Phase 2)
- Adopt Prisma Migrate
- Version-controlled migrations
- Automated rollback procedures

---

## ADR-013: Error Handling Pattern

**Date:** 2026-02-11  
**Status:** Accepted

### Context
Need consistent error handling across all APIs.

### Decision
**Try-catch with typed error codes, HTTP status codes**

### Implementation
```typescript
try {
  // Business logic
} catch (error) {
  if (error instanceof ValidationError) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: error.message } },
      { status: 400 }
    );
  }
  // ... other error types
  return Response.json(
    { error: { code: "SERVER_ERROR", message: "Internal error" } },
    { status: 500 }
  );
}
```

### Error Code Standards
- 400: Validation errors (client's fault)
- 401: Authentication required
- 403: Authorization denied
- 404: Resource not found
- 409: Conflict (duplicate, race condition)
- 422: Unprocessable entity (business logic violation)
- 500: Server error (our fault)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | Architecture Team | Initial decisions |

---

## Future ADRs

As implementation progresses, additional ADRs will be added for:
- ADR-014: Notification system architecture
- ADR-015: File upload and storage strategy
- ADR-016: Real-time features (WebSocket vs polling)
- ADR-017: Analytics and reporting approach
- ADR-018: Performance monitoring strategy
