# Phase 1 API Implementation Guide

## Overview
This guide provides templates and patterns for implementing the remaining ~40 APIs for Phase 1 of the LMS. Each API follows strict security, multi-tenancy, and audit requirements.

## Core Principles

### 1. Security Requirements
✅ **ALWAYS enforce these security measures:**
- Authenticate via `await auth()` from `@/lib/auth`
- Check permissions via `hasPermission()` from `@/lib/rbac`
- Validate centre access via `validateCentreAccess()` or `getCentreIdForQuery()` from `@/lib/tenancy`
- Prevent centreId injection via `preventCentreIdInjection(body)` on POST/PUT requests
- Use audit logging via functions from `@/lib/audit` on all mutations

### 2. Error Handling
Return proper HTTP status codes:
- **401 Unauthorized**: No valid session
- **403 Forbidden**: Valid session but insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **400 Bad Request**: Invalid input data
- **500 Internal Server Error**: Unexpected errors

### 3. Response Format
```typescript
// Success Response
{
  "data": { ... },
  "message": "Optional success message"
}

// Error Response
{
  "error": "Error message"
}
```

## Standard API Template

### GET Endpoint (List Resources)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { getCentreIdForQuery } from "@/lib/tenancy";

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check permissions
    const canViewAll = hasPermission(session, Permissions.RESOURCE_VIEW_ALL);
    const canViewOwn = hasPermission(session, Permissions.RESOURCE_VIEW_OWN);

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Get query parameters
    const { searchParams } = new URL(request.url);
    const centreId = getCentreIdForQuery(session, searchParams.get("centreId") || undefined);

    // 4. Build where clause with multi-tenancy
    const where: any = { centreId };

    // Add additional filters
    if (searchParams.get("status")) {
      where.status = searchParams.get("status");
    }

    // 5. Apply role-based filtering
    if (canViewOwn && !canViewAll) {
      // Filter to user's own resources
      where.userId = session.user.id;
    }

    // 6. Query database
    const resources = await prisma.resource.findMany({
      where,
      include: {
        // Include relations as needed
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit results
    });

    return NextResponse.json({ resources });
  } catch (error: any) {
    console.error("Error fetching resources:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### POST Endpoint (Create Resource)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { preventCentreIdInjection } from "@/lib/tenancy";
import { auditCreate } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check permissions
    if (!hasPermission(session, Permissions.RESOURCE_CREATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse and validate input
    const body = await request.json();
    
    // SECURITY: Prevent centreId injection
    preventCentreIdInjection(body);

    // Validate required fields
    if (!body.requiredField1 || !body.requiredField2) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 4. Create resource with centreId from session
    const resource = await prisma.resource.create({
      data: {
        ...body,
        centreId: session.user.centreId, // Always from session!
        createdById: session.user.id,
      },
    });

    // 5. Audit log
    await auditCreate(
      session.user.id,
      session.user.name || session.user.email,
      session.user.role as Role,
      "Resource", // Model name
      resource.id,
      {
        // Relevant fields for audit
        field1: resource.field1,
        field2: resource.field2,
      },
      session.user.centreId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating resource:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### PUT Endpoint (Update Resource)
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";
import { validateCentreAccess, preventCentreIdInjection } from "@/lib/tenancy";
import { auditUpdate } from "@/lib/audit";
import { Role } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Authenticate
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check permissions
    if (!hasPermission(session, Permissions.RESOURCE_UPDATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse input
    const body = await request.json();
    preventCentreIdInjection(body);

    // 4. Fetch existing resource
    const existingResource = await prisma.resource.findUnique({
      where: { id: params.id },
    });

    if (!existingResource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // 5. Validate centre access
    validateCentreAccess(session, existingResource.centreId);

    // 6. Additional authorization checks (e.g., ownership)
    if (session.user.role === "TEACHER" && existingResource.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 7. Update resource
    const updatedResource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        // Only update provided fields
        ...(body.field1 !== undefined && { field1: body.field1 }),
        ...(body.field2 !== undefined && { field2: body.field2 }),
      },
    });

    // 8. Audit log
    await auditUpdate(
      session.user.id,
      session.user.name || session.user.email,
      session.user.role as Role,
      "Resource",
      updatedResource.id,
      existingResource,
      updatedResource,
      session.user.centreId,
      request.headers.get("x-forwarded-for") || undefined
    );

    return NextResponse.json({ resource: updatedResource });
  } catch (error: any) {
    console.error("Error updating resource:", error);
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN" || error.message.includes("SECURITY_VIOLATION")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "UNAUTHORIZED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Specific API Implementations

### Operations - Tickets API

#### POST /api/tickets (Create Ticket)
**Key Features:**
- Anyone can create a ticket (even students)
- Auto-calculate `slaDueAt` from SLAConfig
- Auto-assign to default support if available

**Implementation:**
```typescript
// 1. Get SLA config for ticket type and priority
const slaConfig = await prisma.sLAConfig.findFirst({
  where: {
    centreId: session.user.centreId,
    ticketType: body.type,
    priority: body.priority,
  },
});

// 2. Calculate SLA due date
const slaDueAt = slaConfig
  ? new Date(Date.now() + slaConfig.resolutionTimeMinutes * 60 * 1000)
  : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

// 3. Create ticket
const ticket = await prisma.ticket.create({
  data: {
    title: body.title,
    description: body.description,
    type: body.type,
    priority: body.priority,
    status: "OPEN",
    slaDueAt,
    centreId: session.user.centreId,
    createdById: session.user.id,
  },
});
```

#### POST /api/tickets/[id]/assign (Assign Ticket)
**Key Features:**
- Only SUPPORT, CENTER_ADMIN, CENTER_SUPERVISOR can assign
- Validate assignee is in same centre

#### POST /api/tickets/[id]/comments (Add Comment)
**Key Features:**
- Anyone involved can comment (creator, assignee, admins)
- Support `isInternal` flag for internal notes

### Finance - Invoices API

#### POST /api/fin/invoices (Create Invoice)
**Key Features:**
- Only FINANCE_ADMIN and CENTER_ADMIN can create
- Calculate totals from line items
- Link to StudentAccount

**Implementation:**
```typescript
// 1. Validate student belongs to centre
const student = await prisma.user.findUnique({
  where: { id: body.studentId },
  include: { studentAccount: true },
});

if (!student || student.centreId !== session.user.centreId) {
  return NextResponse.json({ error: "Student not found" }, { status: 404 });
}

// 2. Calculate totals
const subtotal = body.lines.reduce((sum: number, line: any) => sum + (line.amount * line.quantity), 0);
const total = subtotal - (body.discount || 0);

// 3. Create invoice with lines
const invoice = await prisma.invoice.create({
  data: {
    studentAccountId: student.studentAccount!.id,
    issueDate: new Date(body.issueDate),
    dueDate: new Date(body.dueDate),
    subtotal,
    discount: body.discount || 0,
    total,
    status: "PENDING",
    centreId: session.user.centreId,
    lines: {
      create: body.lines.map((line: any) => ({
        description: line.description,
        amount: line.amount,
        quantity: line.quantity || 1,
      })),
    },
  },
  include: {
    lines: true,
  },
});
```

#### POST /api/fin/refunds (Request Refund)
**Key Features:**
- Creates refund with status PENDING
- Creates ApprovalRequest for FINANCE_ADMIN approval

**Implementation:**
```typescript
// 1. Create refund
const refund = await prisma.refund.create({
  data: {
    paymentId: body.paymentId,
    amount: body.amount,
    reason: body.reason,
    status: "PENDING",
    requestedById: session.user.id,
  },
});

// 2. Create approval request
const approvalRequest = await prisma.approvalRequest.create({
  data: {
    type: "REFUND",
    resourceType: "Refund",
    resourceId: refund.id,
    requestedById: session.user.id,
    status: "PENDING",
    centreId: session.user.centreId,
    data: {
      refundAmount: body.amount,
      paymentId: body.paymentId,
      reason: body.reason,
    },
  },
});

// 3. Audit log
await auditCreate(...);
```

#### POST /api/fin/refunds/[id]/approve (Approve Refund)
**Key Features:**
- Only FINANCE_ADMIN can approve
- Updates refund status to APPROVED
- Updates approval request status
- Updates payment and invoice balances

### Governance - Approvals API

#### GET /api/governance/approvals (List Approvals)
**Key Features:**
- Filter by status (PENDING, APPROVED, REJECTED)
- Filter by type (REFUND, etc.)
- Show pending approvals first

#### POST /api/governance/approvals/[id]/approve (Approve Request)
**Key Features:**
- Check user has APPROVAL_APPROVE permission
- Execute the approved action (e.g., process refund)
- Update approval status
- Audit log

#### GET /api/governance/audit (View Audit Log)
**Key Features:**
- Only CENTER_ADMIN and SUPER_ADMIN can view
- Filter by user, date range, action, resource type
- Paginated results

**Implementation:**
```typescript
const { searchParams } = new URL(request.url);
const userId = searchParams.get("userId");
const action = searchParams.get("action");
const resourceType = searchParams.get("resourceType");
const startDate = searchParams.get("startDate");
const endDate = searchParams.get("endDate");
const page = parseInt(searchParams.get("page") || "1");
const perPage = parseInt(searchParams.get("perPage") || "50");

const where: any = {
  centreId: getCentreIdForQuery(session, searchParams.get("centreId") || undefined),
};

if (userId) where.userId = userId;
if (action) where.action = action;
if (resourceType) where.resourceType = resourceType;
if (startDate || endDate) {
  where.createdAt = {};
  if (startDate) where.createdAt.gte = new Date(startDate);
  if (endDate) where.createdAt.lte = new Date(endDate);
}

const [auditEvents, total] = await Promise.all([
  prisma.auditEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
  }),
  prisma.auditEvent.count({ where }),
]);

return NextResponse.json({
  auditEvents,
  pagination: {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  },
});
```

## Background Jobs

### Generate Catch-Ups Job
```typescript
// scripts/generateCatchups.ts
import { prisma } from "@/lib/prisma";

async function generateCatchups() {
  // Find attendance records marked ABSENT without catch-up
  const absentRecords = await prisma.attendanceRecord.findMany({
    where: {
      status: "ABSENT",
      catchUpPackage: null,
    },
    include: {
      session: {
        include: {
          lesson: {
            include: {
              contents: true,
            },
          },
          classCohort: true,
        },
      },
      student: true,
    },
  });

  for (const record of absentRecords) {
    await prisma.catchUpPackage.create({
      data: {
        studentId: record.studentId,
        attendanceRecordId: record.id,
        title: `Catch-up for ${record.session.title}`,
        description: record.session.description,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "PENDING",
        resources: record.session.lesson?.contents?.map((c) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          url: c.url,
        })) || [],
      },
    });
  }

  console.log(`Generated ${absentRecords.length} catch-up packages`);
}

generateCatchups().catch(console.error).finally(() => process.exit(0));
```

### Escalate Tickets Job
```typescript
// scripts/escalateTickets.ts
import { prisma } from "@/lib/prisma";

async function escalateTickets() {
  const now = new Date();

  // Find overdue tickets that aren't resolved
  const overdueTickets = await prisma.ticket.findMany({
    where: {
      slaDueAt: {
        lt: now,
      },
      status: {
        notIn: ["RESOLVED", "CLOSED"],
      },
    },
  });

  for (const ticket of overdueTickets) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "ESCALATED",
      },
    });

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        userId: "system",
        userName: "System",
        userRole: "SUPER_ADMIN",
        action: "ESCALATE",
        resourceType: "Ticket",
        resourceId: ticket.id,
        beforeState: { status: ticket.status },
        afterState: { status: "ESCALATED" },
        centreId: ticket.centreId,
      },
    });
  }

  console.log(`Escalated ${overdueTickets.length} tickets`);
}

escalateTickets().catch(console.error).finally(() => process.exit(0));
```

## Testing Checklist

For each API, ensure:
- [ ] Returns 401 without authentication
- [ ] Returns 403 with insufficient permissions
- [ ] Enforces multi-tenancy (no cross-centre data access)
- [ ] Validates required fields (returns 400)
- [ ] Creates audit log on mutations
- [ ] Handles errors gracefully (returns 500)
- [ ] Returns correct data structure
- [ ] Pagination works (if applicable)
- [ ] Filters work correctly

## Next Steps

1. **Pick an API to implement** from the checklist
2. **Copy the relevant template** from this guide
3. **Customize for your specific resource** and requirements
4. **Add proper TypeScript types** for request/response
5. **Test thoroughly** using the testing checklist
6. **Create corresponding UI** if needed
7. **Document in docs/api.md**

## Reference Files

- `lib/auth.ts` - Authentication
- `lib/rbac.ts` - Permissions (72+ permissions defined)
- `lib/tenancy.ts` - Multi-tenancy helpers
- `lib/audit.ts` - Audit logging
- `prisma/schema.prisma` - Database models

## Common Gotchas

❌ **DON'T:**
- Accept `centreId` from request body
- Skip permission checks
- Skip audit logging on mutations
- Return detailed errors to clients (hide implementation details)

✅ **DO:**
- Always get `centreId` from `session.user.centreId`
- Use `preventCentreIdInjection()` on POST/PUT
- Use `validateCentreAccess()` on resource fetches
- Log all mutations with audit helpers
- Return generic error messages to clients
