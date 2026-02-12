# Technical Program Manager — API Specification

## Document Purpose

This document provides the complete REST API specification for Phase 1 implementation. It includes endpoint definitions, request/response schemas, RBAC requirements, multi-tenancy enforcement, and error handling.

---

## 1. API Design Standards

### 1.1 Base URL
```
Production: https://lms.gagneet.com/api
Development: http://localhost:3000/api
```

### 1.2 Authentication
- All API endpoints require authentication (except `/api/auth/*`)
- Authentication via NextAuth.js session cookies
- Session must include: `userId`, `role`, `centreId`, `centerName`

### 1.3 Multi-Tenancy Enforcement
**CRITICAL SECURITY REQUIREMENT:**
- `centreId` MUST be extracted from authenticated session ONLY
- `centreId` MUST NEVER be accepted from request body or query parameters
- All queries MUST filter by `centreId` (except SUPER_ADMIN)
- Example enforcement pattern:
```typescript
const session = await auth();
if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

const centreId = session.user.role === "SUPER_ADMIN" 
  ? query.centreId  // SUPER_ADMIN can query across centres
  : session.user.centreId; // Others locked to their centre
```

### 1.4 HTTP Methods
- GET: Retrieve resources
- POST: Create resources
- PUT: Replace resources (full update)
- PATCH: Update resources (partial update)
- DELETE: Remove resources (soft delete preferred)

### 1.5 Standard Response Format

#### Success Response
```json
{
  "data": { /* resource or array */ },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

#### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### 1.6 Pagination
Standard query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (e.g., `createdAt`)
- `order`: Sort order (`asc` or `desc`)

---

## 2. Governance APIs

### 2.1 Audit Events

#### GET `/api/governance/audit`
**Description**: List audit events with filters  
**RBAC**: CENTER_ADMIN, CENTER_SUPERVISOR, FINANCE_ADMIN, SUPER_ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  userId?: string;          // Filter by user
  action?: string;          // CREATE, UPDATE, DELETE
  resourceType?: string;    // e.g., "Refund", "Invoice"
  startDate?: string;       // ISO 8601
  endDate?: string;         // ISO 8601
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "audit_123",
      "userId": "user_456",
      "userName": "John Doe",
      "action": "UPDATE",
      "resourceType": "Refund",
      "resourceId": "refund_789",
      "beforeState": { "status": "PENDING" },
      "afterState": { "status": "APPROVED" },
      "centreId": "centre_001",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-02-11T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

**Tenancy**: Scoped to session.centreId (except SUPER_ADMIN)

---

#### POST `/api/governance/audit` (Internal)
**Description**: Create audit event (called by audit middleware)  
**RBAC**: System only (not exposed to users)

**Request Body:**
```json
{
  "userId": "user_456",
  "action": "CREATE",
  "resourceType": "Refund",
  "resourceId": "refund_789",
  "beforeState": null,
  "afterState": { "amount": 100, "status": "PENDING" },
  "centreId": "centre_001",
  "ipAddress": "192.168.1.1"
}
```

---

### 2.2 Approval Requests

#### GET `/api/governance/approvals`
**Description**: List pending approval requests  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, SUPER_ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  type?: string;        // "REFUND", "TUTOR_OVERRIDE"
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "approval_123",
      "type": "REFUND",
      "requestedById": "user_456",
      "requestedByName": "Jane Finance",
      "status": "PENDING",
      "resourceType": "Refund",
      "resourceId": "refund_789",
      "metadata": {
        "refundAmount": 100,
        "reason": "Duplicate payment"
      },
      "createdAt": "2026-02-10T14:00:00Z",
      "centreId": "centre_001"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3 }
}
```

**Tenancy**: Scoped to session.centreId

---

#### POST `/api/governance/approvals/:id/approve`
**Description**: Approve a pending request  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN (depends on type)

**Request Body:**
```json
{
  "comment": "Approved - duplicate payment confirmed"
}
```

**Response:**
```json
{
  "data": {
    "id": "approval_123",
    "status": "APPROVED",
    "approvedById": "user_111",
    "approvedByName": "Admin User",
    "approvedAt": "2026-02-11T09:00:00Z",
    "comment": "Approved - duplicate payment confirmed"
  }
}
```

**Side Effects:**
- Updates linked resource (e.g., Refund status to APPROVED)
- Creates AuditEvent

**Validation:**
- Approver cannot be the requester
- Request must be PENDING status
- Approver must have permission for approval type

---

#### POST `/api/governance/approvals/:id/reject`
**Description**: Reject a pending request  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN

**Request Body:**
```json
{
  "comment": "Rejected - insufficient documentation"
}
```

**Response:** Similar to approve

---

## 3. Academic APIs

### 3.1 Classes (Cohorts)

#### GET `/api/academic/classes`
**Description**: List classes  
**RBAC**: All roles (scoped by role)

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
  teacherId?: string;   // Filter by teacher (SUPER_ADMIN/CENTER_ADMIN only)
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "class_123",
      "name": "Math Grade 5",
      "subject": "Mathematics",
      "startDate": "2026-01-15",
      "endDate": "2026-06-15",
      "maxCapacity": 20,
      "currentEnrollment": 15,
      "teacherId": "user_teacher_1",
      "teacherName": "Sarah Teacher",
      "status": "ACTIVE",
      "centreId": "centre_001",
      "createdAt": "2026-01-10T00:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 8 }
}
```

**Tenancy**: Scoped to session.centreId

**Role Filtering:**
- TEACHER: Only classes they teach
- STUDENT: Only classes they're enrolled in
- PARENT: Only classes their children are enrolled in
- ADMIN/SUPERVISOR: All classes in centre

---

#### POST `/api/academic/classes`
**Description**: Create a new class  
**RBAC**: CENTER_ADMIN, TEACHER, SUPER_ADMIN

**Request Body:**
```json
{
  "name": "Math Grade 5",
  "subject": "Mathematics",
  "startDate": "2026-01-15",
  "endDate": "2026-06-15",
  "maxCapacity": 20,
  "teacherId": "user_teacher_1",
  "description": "Advanced mathematics for Grade 5 students"
}
```

**Validation:**
- Teacher must exist in same centre
- startDate < endDate
- maxCapacity > 0

**Response:** Created class object (201 status)

**Side Effects:**
- Creates ClassCohort record
- Creates AuditEvent

---

#### GET `/api/academic/classes/:id`
**Description**: Get class details  
**RBAC**: All roles (filtered by access)

**Response:**
```json
{
  "data": {
    "id": "class_123",
    "name": "Math Grade 5",
    "subject": "Mathematics",
    "startDate": "2026-01-15",
    "endDate": "2026-06-15",
    "maxCapacity": 20,
    "status": "ACTIVE",
    "teacherId": "user_teacher_1",
    "teacherName": "Sarah Teacher",
    "centreId": "centre_001",
    "members": [
      {
        "id": "member_1",
        "studentId": "user_student_1",
        "studentName": "John Student",
        "joinedAt": "2026-01-16T00:00:00Z",
        "status": "ACTIVE"
      }
    ],
    "upcomingSessions": [
      {
        "id": "session_1",
        "title": "Introduction to Fractions",
        "startsAt": "2026-02-12T10:00:00Z",
        "endsAt": "2026-02-12T11:00:00Z"
      }
    ]
  }
}
```

---

#### POST `/api/academic/classes/:id/members`
**Description**: Add students to class  
**RBAC**: CENTER_ADMIN, TEACHER (own classes), SUPER_ADMIN

**Request Body:**
```json
{
  "studentIds": ["user_student_1", "user_student_2"]
}
```

**Validation:**
- Students must exist in same centre
- Cannot exceed maxCapacity
- Students cannot already be members

**Response:** Updated class with members (200 status)

**Side Effects:**
- Creates ClassMembership records
- Creates AuditEvent

---

#### DELETE `/api/academic/classes/:id/members/:studentId`
**Description**: Remove student from class  
**RBAC**: CENTER_ADMIN, TEACHER (own classes), SUPER_ADMIN

**Response:** 204 No Content

**Side Effects:**
- Soft deletes ClassMembership
- Creates AuditEvent

---

### 3.2 Sessions

#### POST `/api/academic/sessions`
**Description**: Schedule a new session  
**RBAC**: TEACHER (own classes), CENTER_ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "classId": "class_123",
  "title": "Introduction to Fractions",
  "description": "Learn basic fraction concepts",
  "startsAt": "2026-02-12T10:00:00Z",
  "endsAt": "2026-02-12T11:00:00Z",
  "provider": "TEAMS",
  "meetingUrl": "https://teams.microsoft.com/..."
}
```

**Validation:**
- Class must exist and be active
- startsAt < endsAt
- startsAt must be in future
- User must have permission for class

**Response:** Created session (201 status)

**Side Effects:**
- Creates Session record
- Creates AttendanceRecord for each class member (status: PENDING)
- Creates AuditEvent

---

#### PATCH `/api/academic/sessions/:id/cancel`
**Description**: Cancel a scheduled session  
**RBAC**: TEACHER (own classes), CENTER_ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "reason": "Teacher unavailable"
}
```

**Response:** Updated session with CANCELLED status

**Side Effects:**
- Updates Session status
- Updates AttendanceRecords to CANCELLED
- Creates AuditEvent
- (Future) Sends notifications

---

#### GET `/api/academic/sessions/:id`
**Description**: Get session details including attendance  
**RBAC**: TEACHER, CENTER_ADMIN, SUPERVISOR, SUPER_ADMIN

**Response:**
```json
{
  "data": {
    "id": "session_1",
    "classId": "class_123",
    "className": "Math Grade 5",
    "title": "Introduction to Fractions",
    "startsAt": "2026-02-12T10:00:00Z",
    "endsAt": "2026-02-12T11:00:00Z",
    "status": "COMPLETED",
    "attendance": [
      {
        "id": "attendance_1",
        "studentId": "user_student_1",
        "studentName": "John Student",
        "status": "PRESENT",
        "markedAt": "2026-02-12T10:05:00Z",
        "markedBy": "user_teacher_1"
      },
      {
        "id": "attendance_2",
        "studentId": "user_student_2",
        "studentName": "Jane Student",
        "status": "ABSENT",
        "markedAt": "2026-02-12T10:05:00Z",
        "markedBy": "user_teacher_1"
      }
    ]
  }
}
```

---

### 3.3 Attendance

#### POST `/api/academic/attendance/bulk`
**Description**: Mark attendance for multiple students  
**RBAC**: TEACHER (own sessions), CENTER_ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "sessionId": "session_1",
  "records": [
    {
      "studentId": "user_student_1",
      "status": "PRESENT",
      "notes": ""
    },
    {
      "studentId": "user_student_2",
      "status": "ABSENT",
      "notes": "Sick"
    },
    {
      "studentId": "user_student_3",
      "status": "LATE",
      "notes": "Arrived 15 minutes late"
    }
  ]
}
```

**Valid Status Values:** PENDING, PRESENT, ABSENT, LATE, EXCUSED

**Response:** Updated attendance records

**Side Effects:**
- Updates AttendanceRecord statuses
- Creates CatchUpPackage for each ABSENT status
- Creates AuditEvent
- Updates session status to COMPLETED (if all marked)

---

### 3.4 Catch-Up Packages

#### GET `/api/academic/catchups`
**Description**: List catch-up packages  
**RBAC**: TEACHER, CENTER_ADMIN, SUPER_ADMIN, STUDENT (own only)

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  studentId?: string;   // Filter by student
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "catchup_1",
      "studentId": "user_student_2",
      "studentName": "Jane Student",
      "sessionId": "session_1",
      "sessionTitle": "Introduction to Fractions",
      "missedDate": "2026-02-12T10:00:00Z",
      "dueDate": "2026-02-19T00:00:00Z",
      "status": "PENDING",
      "resources": [
        {
          "type": "VIDEO",
          "url": "https://...",
          "title": "Fractions Introduction"
        }
      ],
      "createdAt": "2026-02-12T10:05:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

**Tenancy**: Scoped to session.centreId

**Role Filtering:**
- STUDENT: Only own catch-ups
- TEACHER: Catch-ups for students in their classes
- ADMIN/SUPERVISOR: All catch-ups in centre

---

#### PATCH `/api/academic/catchups/:id`
**Description**: Update catch-up status  
**RBAC**: STUDENT (own only), TEACHER, CENTER_ADMIN

**Request Body:**
```json
{
  "status": "COMPLETED",
  "completedAt": "2026-02-15T14:30:00Z"
}
```

**Response:** Updated catch-up package

---

### 3.5 Tutor Dashboard

#### GET `/api/academic/tutor/my-day`
**Description**: Get today's sessions and pending tasks for teacher  
**RBAC**: TEACHER only

**Response:**
```json
{
  "data": {
    "date": "2026-02-12",
    "sessions": [
      {
        "id": "session_1",
        "classId": "class_123",
        "className": "Math Grade 5",
        "title": "Introduction to Fractions",
        "startsAt": "2026-02-12T10:00:00Z",
        "endsAt": "2026-02-12T11:00:00Z",
        "status": "SCHEDULED",
        "attendanceMarked": false,
        "studentCount": 15
      }
    ],
    "pendingAttendance": [
      {
        "sessionId": "session_100",
        "sessionTitle": "Algebra Basics",
        "date": "2026-02-11",
        "studentCount": 12
      }
    ],
    "pendingCatchups": 8
  }
}
```

**Tenancy**: Automatically scoped to teacher's classes in their centre

---

## 4. Operations APIs

### 4.1 Tickets

#### POST `/api/operations/tickets`
**Description**: Create a new support ticket  
**RBAC**: All authenticated users

**Request Body:**
```json
{
  "type": "IT" | "INVENTORY" | "COMPLAINT" | "MAINTENANCE" | "GENERAL",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "subject": "Laptop not booting",
  "description": "My assigned laptop shows black screen when powered on",
  "attachments": [
    {
      "filename": "error-photo.jpg",
      "url": "https://storage.../error-photo.jpg",
      "size": 1024000
    }
  ]
}
```

**Validation:**
- subject: 5-200 characters
- description: 10-2000 characters
- attachments: max 5 files, 10MB each

**Response:** Created ticket (201 status)

**Side Effects:**
- Creates Ticket record with status OPEN
- Calculates slaDueAt based on SLAConfig
- Creates AuditEvent
- (Future) Sends notification to assigned team

---

#### GET `/api/operations/tickets`
**Description**: List tickets  
**RBAC**: All authenticated users (filtered by role)

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "ESCALATED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  type?: string;
  assignedTo?: string;  // Filter by assigned staff
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "ticket_123",
      "ticketNumber": "TICK-2026-0001",
      "type": "IT",
      "priority": "HIGH",
      "subject": "Laptop not booting",
      "status": "OPEN",
      "createdById": "user_student_1",
      "createdByName": "John Student",
      "assignedToId": "user_support_1",
      "assignedToName": "Sarah Support",
      "slaDueAt": "2026-02-12T14:00:00Z",
      "isOverdue": false,
      "createdAt": "2026-02-12T10:00:00Z",
      "centreId": "centre_001"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```

**Tenancy**: Scoped to session.centreId

**Role Filtering:**
- STUDENT/PARENT/TEACHER: Only tickets they created
- SUPPORT_STAFF: Tickets assigned to them or unassigned
- ADMIN/SUPERVISOR: All tickets in centre

---

#### GET `/api/operations/tickets/:id`
**Description**: Get ticket details  
**RBAC**: Ticket creator, assigned staff, ADMIN, SUPERVISOR

**Response:**
```json
{
  "data": {
    "id": "ticket_123",
    "ticketNumber": "TICK-2026-0001",
    "type": "IT",
    "priority": "HIGH",
    "subject": "Laptop not booting",
    "description": "My assigned laptop shows black screen...",
    "status": "IN_PROGRESS",
    "createdById": "user_student_1",
    "createdByName": "John Student",
    "assignedToId": "user_support_1",
    "assignedToName": "Sarah Support",
    "slaDueAt": "2026-02-12T14:00:00Z",
    "isOverdue": false,
    "attachments": [...],
    "comments": [
      {
        "id": "comment_1",
        "userId": "user_support_1",
        "userName": "Sarah Support",
        "text": "I'll check this in 10 minutes",
        "createdAt": "2026-02-12T10:15:00Z"
      }
    ],
    "createdAt": "2026-02-12T10:00:00Z",
    "updatedAt": "2026-02-12T10:15:00Z"
  }
}
```

---

#### PATCH `/api/operations/tickets/:id/assign`
**Description**: Assign ticket to staff member  
**RBAC**: CENTER_ADMIN, CENTER_SUPERVISOR, SUPER_ADMIN

**Request Body:**
```json
{
  "assignedToId": "user_support_1"
}
```

**Validation:**
- Assigned user must exist in same centre
- Assigned user must have support role permissions

**Response:** Updated ticket

**Side Effects:**
- Updates Ticket assignedToId
- Creates AuditEvent
- (Future) Sends notification to assigned staff

---

#### POST `/api/operations/tickets/:id/comments`
**Description**: Add comment to ticket  
**RBAC**: Ticket creator, assigned staff, ADMIN, SUPERVISOR

**Request Body:**
```json
{
  "text": "I've identified the issue. The power adapter is faulty."
}
```

**Response:** Created comment (201 status)

**Side Effects:**
- Creates TicketComment record
- Updates ticket updatedAt
- (Future) Notifies ticket creator

---

#### PATCH `/api/operations/tickets/:id/status`
**Description**: Update ticket status  
**RBAC**: Assigned staff, ADMIN, SUPERVISOR

**Request Body:**
```json
{
  "status": "RESOLVED" | "CLOSED" | "IN_PROGRESS",
  "resolution": "Replaced power adapter"  // Required for RESOLVED/CLOSED
}
```

**Response:** Updated ticket

**Side Effects:**
- Updates Ticket status
- Creates AuditEvent
- Adds system comment with resolution
- (Future) Notifies ticket creator

---

### 4.2 SLA Configuration

#### GET `/api/operations/sla-configs`
**Description**: List SLA configurations  
**RBAC**: CENTER_ADMIN, CENTER_SUPERVISOR, SUPER_ADMIN

**Response:**
```json
{
  "data": [
    {
      "id": "sla_1",
      "ticketType": "IT",
      "priority": "HIGH",
      "responseTimeHours": 4,
      "resolutionTimeHours": 24,
      "centreId": "centre_001"
    }
  ]
}
```

---

#### POST `/api/operations/sla-configs`
**Description**: Create or update SLA config  
**RBAC**: CENTER_ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "ticketType": "IT",
  "priority": "URGENT",
  "responseTimeHours": 1,
  "resolutionTimeHours": 4
}
```

**Response:** Created/updated config

---

## 5. Finance APIs

### 5.1 Fee Plans

#### POST `/api/finance/fee-plans`
**Description**: Create a fee plan  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "name": "Monthly Tuition - Grade 5",
  "description": "Standard monthly tuition for Grade 5 students",
  "amount": 250.00,
  "currency": "USD",
  "frequency": "MONTHLY",
  "applicableCourses": ["course_123"],  // Optional
  "applicableClasses": ["class_123"]    // Optional
}
```

**Valid Frequencies:** ONE_TIME, WEEKLY, MONTHLY, TERM, ANNUAL

**Response:** Created fee plan (201 status)

**Side Effects:**
- Creates FeePlan record
- Creates AuditEvent

---

#### GET `/api/finance/fee-plans`
**Description**: List fee plans  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, TEACHER, SUPER_ADMIN

**Response:**
```json
{
  "data": [
    {
      "id": "feeplan_1",
      "name": "Monthly Tuition - Grade 5",
      "amount": 250.00,
      "currency": "USD",
      "frequency": "MONTHLY",
      "status": "ACTIVE",
      "centreId": "centre_001"
    }
  ]
}
```

---

### 5.2 Invoices

#### POST `/api/finance/invoices`
**Description**: Create an invoice for a student  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "studentId": "user_student_1",
  "feePlanId": "feeplan_1",
  "dueDate": "2026-03-15",
  "notes": "February 2026 tuition",
  "lineItems": [
    {
      "description": "Monthly Tuition",
      "quantity": 1,
      "unitPrice": 250.00,
      "amount": 250.00
    },
    {
      "description": "Materials Fee",
      "quantity": 1,
      "unitPrice": 25.00,
      "amount": 25.00
    }
  ]
}
```

**Validation:**
- Student must exist in same centre
- lineItems.amount must equal quantity * unitPrice
- Total amount must be > 0

**Response:** Created invoice (201 status)

**Side Effects:**
- Creates Invoice with status DRAFT
- Creates InvoiceLine records
- Creates/updates StudentAccount
- Creates AuditEvent

---

#### GET `/api/finance/invoices`
**Description**: List invoices  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, PARENT (children only), STUDENT (own only), SUPER_ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "DRAFT" | "SENT" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED";
  studentId?: string;
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "invoice_123",
      "invoiceNumber": "INV-2026-0001",
      "studentId": "user_student_1",
      "studentName": "John Student",
      "issueDate": "2026-02-01",
      "dueDate": "2026-03-01",
      "totalAmount": 275.00,
      "paidAmount": 0.00,
      "balanceAmount": 275.00,
      "status": "SENT",
      "centreId": "centre_001"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 28 }
}
```

**Tenancy**: Scoped to session.centreId

---

#### GET `/api/finance/invoices/:id`
**Description**: Get invoice details  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, invoice student, student's parent, SUPER_ADMIN

**Response:**
```json
{
  "data": {
    "id": "invoice_123",
    "invoiceNumber": "INV-2026-0001",
    "studentId": "user_student_1",
    "studentName": "John Student",
    "issueDate": "2026-02-01",
    "dueDate": "2026-03-01",
    "status": "SENT",
    "lineItems": [
      {
        "id": "line_1",
        "description": "Monthly Tuition",
        "quantity": 1,
        "unitPrice": 250.00,
        "amount": 250.00
      }
    ],
    "totalAmount": 275.00,
    "paidAmount": 0.00,
    "balanceAmount": 275.00,
    "payments": [],
    "notes": "February 2026 tuition",
    "centreId": "centre_001"
  }
}
```

---

#### PATCH `/api/finance/invoices/:id/send`
**Description**: Mark invoice as sent  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, SUPER_ADMIN

**Response:** Updated invoice with SENT status

**Side Effects:**
- Updates status to SENT
- Sets sentAt timestamp
- Creates AuditEvent
- (Future) Sends email notification

---

### 5.3 Payments

#### POST `/api/finance/payments`
**Description**: Record a manual payment  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "invoiceId": "invoice_123",
  "amount": 275.00,
  "method": "CASH" | "CHECK" | "BANK_TRANSFER" | "CARD",
  "paymentDate": "2026-02-15",
  "reference": "CHECK-12345",
  "notes": "Paid in full by check"
}
```

**Validation:**
- Invoice must exist in same centre
- Amount must be > 0
- Amount cannot exceed invoice balance
- Payment date cannot be in future

**Response:** Created payment (201 status)

**Side Effects:**
- Creates Payment record
- Updates Invoice paidAmount and balanceAmount
- Updates Invoice status (PAID if fully paid, PARTIAL otherwise)
- Creates AuditEvent

---

#### GET `/api/finance/payments`
**Description**: List payments  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, SUPER_ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  invoiceId?: string;
  studentId?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "payment_1",
      "invoiceId": "invoice_123",
      "invoiceNumber": "INV-2026-0001",
      "amount": 275.00,
      "method": "CASH",
      "paymentDate": "2026-02-15",
      "reference": "CASH-RECEIPT-001",
      "recordedById": "user_finance_1",
      "recordedByName": "Finance Admin",
      "centreId": "centre_001",
      "createdAt": "2026-02-15T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 156 }
}
```

---

### 5.4 Refunds

#### POST `/api/finance/refunds`
**Description**: Request a refund  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "paymentId": "payment_1",
  "amount": 100.00,
  "reason": "Duplicate payment - customer paid twice",
  "refundMethod": "ORIGINAL_METHOD" | "BANK_TRANSFER"
}
```

**Validation:**
- Payment must exist in same centre
- Amount must be > 0
- Amount cannot exceed original payment amount
- Cannot refund already refunded payment

**Response:** Created refund (201 status)

**Side Effects:**
- Creates Refund record with status PENDING
- Creates ApprovalRequest with type REFUND
- Creates AuditEvent
- (Future) Notifies approvers

---

#### GET `/api/finance/refunds`
**Description**: List refund requests  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, SUPER_ADMIN

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "refund_1",
      "paymentId": "payment_1",
      "invoiceNumber": "INV-2026-0001",
      "studentName": "John Student",
      "amount": 100.00,
      "reason": "Duplicate payment",
      "status": "PENDING",
      "requestedById": "user_finance_1",
      "requestedByName": "Finance Admin",
      "approvalRequestId": "approval_123",
      "createdAt": "2026-02-15T14:00:00Z",
      "centreId": "centre_001"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5 }
}
```

---

#### PATCH `/api/finance/refunds/:id/process`
**Description**: Mark an approved refund as processed  
**RBAC**: CENTER_ADMIN, FINANCE_ADMIN, SUPER_ADMIN

**Request Body:**
```json
{
  "processedDate": "2026-02-16",
  "reference": "REFUND-TXN-12345",
  "notes": "Refund processed via bank transfer"
}
```

**Validation:**
- Refund must be in APPROVED status
- Refund cannot already be PROCESSED

**Response:** Updated refund with PROCESSED status

**Side Effects:**
- Updates Refund status to PROCESSED
- Creates AuditEvent

---

## 6. RBAC Matrix

| Endpoint | SUPER_ADMIN | CENTER_ADMIN | CENTER_SUPERVISOR | FINANCE_ADMIN | TEACHER | PARENT | STUDENT |
|----------|-------------|--------------|-------------------|---------------|---------|--------|---------|
| **Governance** |
| GET /audit | All Centres | Own Centre | Own Centre | Own Centre | ❌ | ❌ | ❌ |
| GET /approvals | All | Own Centre | Own Centre | Own Centre | ❌ | ❌ | ❌ |
| POST /approvals/:id/approve | ✅ | ✅ | ✅ | ✅ (finance only) | ❌ | ❌ | ❌ |
| **Academic** |
| GET /classes | All | Own Centre | Own Centre | ❌ | Own Classes | Children | Own |
| POST /classes | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| POST /classes/:id/members | ✅ | ✅ | ❌ | ❌ | Own Classes | ❌ | ❌ |
| POST /sessions | ✅ | ✅ | ❌ | ❌ | Own Classes | ❌ | ❌ |
| POST /attendance/bulk | ✅ | ✅ | ❌ | ❌ | Own Sessions | ❌ | ❌ |
| GET /catchups | All | Own Centre | Own Centre | ❌ | Own Students | Children | Own |
| GET /tutor/my-day | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Operations** |
| POST /tickets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /tickets | All | Own Centre | Own Centre | ❌ | Own | Own | Own |
| PATCH /tickets/:id/assign | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /tickets/:id/comments | ✅ | ✅ | ✅ | ❌ | If Creator | If Creator | If Creator |
| **Finance** |
| POST /fee-plans | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| POST /invoices | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| GET /invoices | All | Own Centre | ❌ | Own Centre | ❌ | Children | Own |
| POST /payments | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| POST /refunds | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 7. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | No valid session |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| DUPLICATE_ENTRY | 409 | Resource already exists |
| CAPACITY_EXCEEDED | 422 | Class at max capacity |
| INVALID_STATE | 422 | Action not allowed in current state |
| CENTRE_MISMATCH | 403 | Resource not in user's centre |
| SERVER_ERROR | 500 | Internal server error |

---

## 8. Implementation Notes

### 8.1 Audit Middleware Pattern
```typescript
// Create reusable audit helper
async function createAuditLog(params: {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  resourceType: string;
  resourceId: string;
  beforeState?: any;
  afterState?: any;
  centreId: string;
}) {
  return await prisma.auditEvent.create({ data: params });
}

// Use in API handlers
await createAuditLog({
  userId: session.user.id,
  action: "UPDATE",
  resourceType: "Refund",
  resourceId: refund.id,
  beforeState: { status: "PENDING" },
  afterState: { status: "APPROVED" },
  centreId: session.user.centreId
});
```

### 8.2 Centre Guard Pattern
```typescript
// Reusable helper
function getCentreIdForQuery(session: Session, requestedCentreId?: string) {
  if (session.user.role === "SUPER_ADMIN" && requestedCentreId) {
    return requestedCentreId;
  }
  return session.user.centreId;
}

// Use in queries
const centreId = getCentreIdForQuery(session);
const classes = await prisma.classCohort.findMany({
  where: { centreId }
});
```

### 8.3 RBAC Check Pattern
```typescript
// Reusable helper
function hasPermission(session: Session, requiredRoles: Role[]) {
  return requiredRoles.includes(session.user.role);
}

// Use in handlers
if (!hasPermission(session, ["CENTER_ADMIN", "TEACHER", "SUPER_ADMIN"])) {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | Technical PM | Initial version |

---
