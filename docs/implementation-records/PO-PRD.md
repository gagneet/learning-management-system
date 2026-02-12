# Product Requirements Document (PRD) — Phase 1 Implementation

## Executive Summary

This PRD defines the requirements for Phase 1 of the Learning Management System (LMS) implementation, focusing on foundational governance features, academic operations, operations ticketing, and basic finance management. All features must adhere to multi-tenancy (centre-based isolation) and role-based access control (RBAC).

---

## 1. Core Principles

### 1.1 Multi-Tenancy (MANDATORY)
- **All data must be scoped by `centreId`**
- `centreId` MUST come from authenticated session context ONLY
- `centreId` MUST NEVER be accepted from request body or query parameters
- All database queries MUST filter by `centreId` (except SUPER_ADMIN)
- Cross-centre data access is FORBIDDEN (except SUPER_ADMIN)

### 1.2 Role-Based Access Control (RBAC)
- Enforce permissions at API layer
- Deny by default approach
- UI routes must be role-guarded
- Existing roles: SUPER_ADMIN, CENTER_ADMIN, CENTER_SUPERVISOR, FINANCE_ADMIN, TEACHER, PARENT, STUDENT

### 1.3 Audit & Governance
- Every privileged mutation MUST write an AuditEvent
- Actions requiring approval MUST use ApprovalRequest workflow
- Audit logs must capture before/after state where applicable

---

## 2. Domain: Governance

### 2.1 User Story: Audit Logging

**As a** Centre Admin or Compliance Officer  
**I want** all privileged actions to be automatically logged  
**So that** I can track changes, investigate issues, and maintain compliance

#### Acceptance Criteria
- **Given** a user performs a privileged action (create/update/delete critical data)
- **When** the action is executed
- **Then** an AuditEvent record is created with:
  - User ID and role
  - Action type (CREATE, UPDATE, DELETE)
  - Resource type and ID
  - Before/after state (JSON)
  - Timestamp
  - Centre ID
  - IP address (optional)

#### Priority: **P0** (MUST HAVE)

#### Edge Cases
- System-initiated actions (background jobs) should log with system user
- Failed actions should also be logged
- Sensitive data (passwords) must be excluded from logs

---

### 2.2 User Story: Approval Workflow

**As a** Finance Admin  
**I want** refund requests to require approval  
**So that** we maintain financial control and prevent unauthorized refunds

#### Acceptance Criteria
- **Given** a refund is requested
- **When** the request is created
- **Then** an ApprovalRequest is generated with status PENDING
- **And** authorized approvers are notified
- **When** an approver reviews the request
- **Then** they can APPROVE or REJECT with optional comment
- **When** approved
- **Then** the refund status changes to APPROVED
- **And** the finance team can process the refund

#### Priority: **P0** (MUST HAVE)

#### Edge Cases
- Expired approval requests (>7 days) should auto-escalate
- Approver cannot approve their own requests
- Multiple approval levels (future enhancement)

---

### 2.3 User Story: Approvals Queue UI

**As a** Centre Admin or Finance Admin  
**I want** a centralized approvals queue  
**So that** I can review and action all pending approvals efficiently

#### Acceptance Criteria
- **Given** I am logged in as an approver
- **When** I navigate to the Approvals Queue
- **Then** I see all pending approval requests for my centre
- **And** I can filter by type (refund, tutor override, etc.)
- **And** I can sort by date, priority
- **When** I click on a request
- **Then** I see full details and can approve/reject
- **And** my action is logged in AuditEvent

#### Priority: **P1** (SHOULD HAVE)

---

### 2.4 User Story: Audit Log Search

**As a** Centre Admin  
**I want** to search and filter audit logs  
**So that** I can investigate specific incidents or track user activity

#### Acceptance Criteria
- **Given** I am logged in as Centre Admin or SUPER_ADMIN
- **When** I access the Audit Log page
- **Then** I see recent audit events for my centre (scoped by centreId)
- **And** I can filter by:
  - User
  - Action type
  - Resource type
  - Date range
- **And** I can export filtered results (CSV)

#### Priority: **P1** (SHOULD HAVE)

---

## 3. Domain: Academic

### 3.1 User Story: Class/Cohort Management

**As a** Centre Admin or Teacher  
**I want** to create and manage classes (cohorts)  
**So that** I can organize students into learning groups

#### Acceptance Criteria
- **Given** I am logged in as Centre Admin or Teacher
- **When** I create a new class
- **Then** I provide:
  - Class name
  - Subject/course
  - Start and end dates
  - Maximum capacity
  - Assigned teacher(s)
- **And** the class is scoped to my centre
- **When** I add students to the class
- **Then** ClassMembership records are created
- **And** students can see the class in their dashboard

#### Priority: **P0** (MUST HAVE)

#### Edge Cases
- Cannot exceed maximum capacity
- Cannot add student from different centre
- Cannot add student already in class

---

### 3.2 User Story: Session Scheduling

**As a** Teacher  
**I want** to schedule live sessions for my classes  
**So that** students know when to attend

#### Acceptance Criteria
- **Given** I have a class
- **When** I schedule a session
- **Then** I provide:
  - Title
  - Start time
  - Duration
  - Meeting provider (Teams/Zoom/Chime)
  - Optional description
- **And** all class members are automatically enrolled in attendance tracking
- **And** students receive notification (future)

#### Priority: **P0** (MUST HAVE)

---

### 3.3 User Story: Attendance Marking

**As a** Teacher  
**I want** to mark attendance for my sessions  
**So that** I can track student participation

#### Acceptance Criteria
- **Given** I have conducted a session
- **When** I access the attendance page
- **Then** I see all enrolled students
- **And** I can mark each as PRESENT, ABSENT, LATE, or EXCUSED
- **When** I mark a student as ABSENT
- **Then** a catch-up package is automatically generated (if enabled)
- **And** the student sees it in their catch-up queue

#### Priority: **P0** (MUST HAVE)

#### Edge Cases
- Cannot mark attendance for future sessions
- Bulk actions for marking all present/absent
- Late arrival tracking (joined after 10 minutes)

---

### 3.4 User Story: Catch-Up Auto-Generation

**As a** System  
**I want** to automatically generate catch-up packages when students miss sessions  
**So that** they can stay on track with learning

#### Acceptance Criteria (Technical)
- **Given** attendance is marked as ABSENT for a student
- **When** the attendance record is saved
- **Then** a CatchUpPackage is created with:
  - Student ID
  - Session ID
  - Status: PENDING
  - Recommended completion date (within 7 days)
  - Linked resources from the session
- **And** the package appears in the student's catch-up queue

#### Priority: **P0** (MUST HAVE)

#### Implementation Note
- Background job preferred but synchronous acceptable with TODO marker

---

### 3.5 User Story: Tutor "My Day" Dashboard

**As a** Teacher  
**I want** a daily dashboard showing my sessions and pending tasks  
**So that** I can quickly see what needs my attention

#### Acceptance Criteria
- **Given** I am logged in as Teacher
- **When** I access "My Day" page
- **Then** I see:
  - Today's scheduled sessions (chronological)
  - Sessions requiring attendance marking
  - Number of pending catch-ups for my students
  - Quick links to mark attendance
- **And** data is scoped to my centre

#### Priority: **P0** (MUST HAVE)

---

### 3.6 User Story: Student Catch-Up Queue

**As a** Student  
**I want** to see my catch-up work  
**So that** I can complete missed lessons

#### Acceptance Criteria
- **Given** I am logged in as Student
- **When** I access my dashboard
- **Then** I see all pending catch-up packages
- **And** I can see:
  - Session title
  - Date missed
  - Due date
  - Status (PENDING, IN_PROGRESS, COMPLETED)
  - Linked resources
- **When** I complete a catch-up
- **Then** the status updates to COMPLETED
- **And** my progress is tracked

#### Priority: **P0** (MUST HAVE)

---

## 4. Domain: Operations

### 4.1 User Story: Ticket Creation

**As a** Student, Parent, Teacher, or Staff member  
**I want** to create support tickets  
**So that** I can request help or report issues

#### Acceptance Criteria
- **Given** I am logged in
- **When** I create a ticket
- **Then** I provide:
  - Ticket type (IT, Inventory, Complaint, Maintenance, General)
  - Priority (LOW, MEDIUM, HIGH, URGENT)
  - Subject
  - Description
  - Optional attachments
- **And** the ticket is assigned to my centre
- **And** an SLA due date is automatically calculated
- **And** the ticket starts in OPEN status

#### Priority: **P0** (MUST HAVE)

#### Edge Cases
- URGENT priority sends immediate notification
- File upload size limits (10MB per file)
- Maximum 5 attachments per ticket

---

### 4.2 User Story: SLA Management

**As a** Support Manager  
**I want** tickets to have SLA due dates  
**So that** we can meet service commitments

#### Acceptance Criteria
- **Given** an SLAConfig exists for ticket type and priority
- **When** a ticket is created
- **Then** `slaDueAt` is calculated: createdAt + SLA hours
- **When** current time exceeds slaDueAt
- **Then** the ticket is marked as OVERDUE
- **And** escalation workflow is triggered

#### Priority: **P0** (MUST HAVE)

#### SLA Matrix (Default)
| Priority | Response SLA | Resolution SLA |
|----------|--------------|----------------|
| URGENT   | 1 hour       | 4 hours        |
| HIGH     | 4 hours      | 24 hours       |
| MEDIUM   | 24 hours     | 72 hours       |
| LOW      | 48 hours     | 7 days         |

---

### 4.3 User Story: Ticket Escalation

**As a** System  
**I want** to automatically escalate overdue tickets  
**So that** they receive appropriate attention

#### Acceptance Criteria (Technical)
- **Given** a background job runs every hour (configurable)
- **When** it finds tickets with status OPEN and slaDueAt < now
- **Then** the ticket status is updated to ESCALATED
- **And** assigned staff and their supervisor are notified
- **And** an AuditEvent is logged

#### Priority: **P0** (MUST HAVE)

#### Implementation Note
- Placeholder notification (console.log) acceptable initially
- Architecture must be notification-ready

---

### 4.4 User Story: Ticket Management UI

**As a** Support Staff or Reception  
**I want** to view and manage tickets  
**So that** I can respond to user requests efficiently

#### Acceptance Criteria
- **Given** I am logged in as Support Staff
- **When** I access the Tickets page
- **Then** I see tickets for my centre
- **And** I can filter by status, priority, type, assigned user
- **When** I click a ticket
- **Then** I see full details, comments, attachments
- **And** I can:
  - Assign to staff member
  - Add comments
  - Change status
  - Close ticket
- **And** all actions are audit-logged

#### Priority: **P0** (MUST HAVE)

---

## 5. Domain: Finance

### 5.1 User Story: Fee Plans

**As a** Finance Admin  
**I want** to create fee plans  
**So that** students can be billed correctly

#### Acceptance Criteria
- **Given** I am logged in as Finance Admin
- **When** I create a fee plan
- **Then** I provide:
  - Plan name
  - Description
  - Amount
  - Currency (default USD)
  - Billing frequency (ONE_TIME, WEEKLY, MONTHLY, TERM, ANNUAL)
  - Applicable courses/classes (optional)
- **And** the plan is scoped to my centre

#### Priority: **P0** (MUST HAVE)

---

### 5.2 User Story: Invoice Generation

**As a** Finance Admin  
**I want** to generate invoices for students  
**So that** we can bill for services

#### Acceptance Criteria
- **Given** I select a student and fee plan
- **When** I generate an invoice
- **Then** an Invoice record is created with:
  - Student account reference
  - Issue date
  - Due date (default: +30 days)
  - Status: DRAFT
  - Line items from fee plan
  - Total amount
- **When** I finalize the invoice
- **Then** status changes to SENT
- **And** the student/parent is notified (future)

#### Priority: **P0** (MUST HAVE)

#### Edge Cases
- Multiple line items support
- Tax calculation (future)
- Discounts (future)

---

### 5.3 User Story: Manual Payment Recording

**As a** Finance Admin  
**I want** to record manual payments  
**So that** we can track cash/check/transfer payments

#### Acceptance Criteria
- **Given** I receive a payment outside the system
- **When** I record the payment
- **Then** I provide:
  - Invoice reference
  - Amount paid
  - Payment method (CASH, CHECK, BANK_TRANSFER, CARD)
  - Payment date
  - Reference/transaction number
- **And** a Payment record is created
- **And** the invoice status updates based on amount paid
- **And** the action is audit-logged

#### Priority: **P0** (MUST HAVE)

---

### 5.4 User Story: Refund Requests (with Approval)

**As a** Finance Admin  
**I want** to process refund requests  
**So that** we can handle customer service issues

#### Acceptance Criteria
- **Given** a refund is needed
- **When** I create a refund request
- **Then** I provide:
  - Student account
  - Original payment reference
  - Refund amount
  - Reason
- **And** a Refund record is created with status PENDING
- **And** an ApprovalRequest is created
- **When** the refund is approved
- **Then** status changes to APPROVED
- **And** the finance team can process it externally
- **And** status can be marked as PROCESSED when complete
- **And** all state changes are audit-logged

#### Priority: **P0** (MUST HAVE)

#### Edge Cases
- Cannot refund more than original payment
- Partial refunds supported
- Refund must reference valid payment

---

### 5.5 User Story: Finance Dashboard

**As a** Finance Admin  
**I want** a finance dashboard  
**So that** I can monitor revenue and outstanding invoices

#### Acceptance Criteria
- **Given** I am logged in as Finance Admin
- **When** I access the Finance page
- **Then** I see:
  - Total outstanding invoices (amount and count)
  - Total collected this month
  - Pending refund requests
  - Recent transactions
- **And** all data is scoped to my centre

#### Priority: **P1** (SHOULD HAVE)

---

## 6. Cross-Cutting Requirements

### 6.1 Multi-Tenancy Validation
- Every API endpoint MUST validate `centreId` from session
- Prisma queries MUST include centreId filter (except SUPER_ADMIN)
- Unit tests MUST verify cross-centre isolation

### 6.2 RBAC Matrix

| Feature | SUPER_ADMIN | CENTER_ADMIN | CENTER_SUPERVISOR | FINANCE_ADMIN | TEACHER | PARENT | STUDENT |
|---------|-------------|--------------|-------------------|---------------|---------|--------|---------|
| Audit Logs | All Centres | Own Centre | Own Centre | Own Centre | No | No | No |
| Approvals | All | Own Centre | Own Centre | Own Centre | No | No | No |
| Classes (Create) | Yes | Yes | No | No | Yes | No | No |
| Classes (View) | All | Own Centre | Own Centre | No | Own Only | Children | Own Only |
| Attendance | All | Own Centre | Own Centre | No | Own Classes | Children | Own Only |
| Tickets (Create) | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Tickets (Assign) | Yes | Yes | Yes | No | No | No | No |
| Fee Plans | Yes | Yes | No | Yes | No | No | No |
| Invoices | All | Own Centre | No | Own Centre | No | Children | Own Only |
| Refunds | Yes | No | No | Yes (request only) | No | No | No |

### 6.3 Error Handling
- Consistent JSON error format
- HTTP status codes: 400 (validation), 401 (auth), 403 (authorization), 404 (not found), 500 (server error)
- User-friendly error messages
- Technical details in logs only

### 6.4 Performance Requirements
- API response time: < 500ms (p95)
- Database queries optimized with appropriate indexes
- Pagination for list endpoints (default: 20 items, max: 100)

---

## 7. Out of Scope for Phase 1

- Email/SMS notifications (placeholders acceptable)
- Payment gateway integration (manual recording only)
- Multi-level approval workflows (single level only)
- Asset/inventory management (if time permits)
- Advanced analytics and reporting
- Mobile app
- Offline mode

---

## 8. Success Criteria

### 8.1 Functional
- All P0 user stories implemented and tested
- Multi-tenancy isolation verified
- RBAC enforced on all endpoints
- Audit logging operational
- Approval workflow functional for refunds

### 8.2 Technical
- Build passes without errors
- Type safety enforced (TypeScript strict mode)
- Database migrations successful
- Test coverage: minimum 60% for core business logic
- No critical security vulnerabilities (CodeQL scan)

### 8.3 User Experience
- UI pages load in < 2 seconds
- Empty states, loading states, error states implemented
- Role-appropriate navigation
- Responsive design (desktop and tablet)

---

## 9. Dependencies & Assumptions

### Dependencies
- PostgreSQL database accessible
- Next.js 16 + React 19 environment
- Prisma ORM functional
- NextAuth.js for authentication

### Assumptions
- Users are already created via existing seed/admin tools
- Network connectivity for live sessions (existing)
- Single approval level sufficient for Phase 1
- Manual financial reconciliation acceptable initially

---

## 10. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database performance degradation | High | Medium | Add composite indexes, query optimization |
| RBAC misconfiguration exposing data | Critical | Low | Comprehensive testing, code review |
| Audit log volume growth | Medium | High | Implement log rotation, archiving strategy |
| SLA calculation errors | Medium | Low | Unit tests, validation logic |
| Approval bottlenecks | Low | Medium | Escalation mechanism, multiple approvers (Phase 2) |

---

## 11. Future Enhancements (Post Phase 1)

- Multi-level approval workflows
- Email/SMS notification system
- Automated invoice generation from fee plans
- Payment gateway integration (Stripe, PayPal)
- Advanced analytics dashboards
- Inventory and asset management
- Stock tracking
- Maintenance scheduling
- Parent portal enhancements
- Mobile applications

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | Product Owner | Initial version |

---

## Appendix: Glossary

- **Centre**: A physical or virtual tutoring location (tenant in multi-tenant system)
- **Cohort**: A group of students learning together (ClassCohort in database)
- **SLA**: Service Level Agreement - committed response/resolution time
- **Catch-Up Package**: Automatically generated work for students who miss sessions
- **Approval Request**: Workflow item requiring authorization before execution
- **Audit Event**: Immutable log record of a system action

---
