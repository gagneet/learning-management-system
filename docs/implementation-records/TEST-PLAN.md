# Quality Assurance — Test Plan

## Document Purpose

This document defines the testing strategy, test cases, and acceptance criteria for Phase 1 implementation.

---

## 1. Testing Approach

### 1.1 Test Types
- **Unit Tests**: Individual functions and helpers (Jest)
- **Integration Tests**: API endpoints and database operations (Jest + Supertest)
- **E2E Tests**: Complete user flows (Playwright)
- **Security Tests**: Multi-tenancy isolation, RBAC enforcement

### 1.2 Coverage Goals
- **Critical Paths**: 80% minimum
- **Business Logic**: 70% minimum
- **Overall**: 60% minimum

### 1.3 Testing Tools
- Jest: Unit and integration tests
- Playwright: E2E browser tests
- Supertest: API endpoint testing

---

## 2. Multi-Tenancy Isolation Tests (CRITICAL)

### 2.1 Test: Cross-Centre Data Isolation

**Purpose:** Verify users cannot access data from other centres

```typescript
describe("Multi-Tenancy Isolation", () => {
  let centre1User: User;
  let centre2User: User;
  let centre1Class: ClassCohort;
  let centre2Class: ClassCohort;

  beforeAll(async () => {
    // Setup: Create 2 centres with users and data
    centre1User = await createUser({ centreId: "centre_1", role: "TEACHER" });
    centre2User = await createUser({ centreId: "centre_2", role: "TEACHER" });
    
    centre1Class = await createClass({ centreId: "centre_1", teacherId: centre1User.id });
    centre2Class = await createClass({ centreId: "centre_2", teacherId: centre2User.id });
  });

  test("should not allow centre1 user to access centre2 class", async () => {
    const session = await mockSession(centre1User);
    
    const response = await request(app)
      .get(`/api/academic/classes/${centre2Class.id}`)
      .set("Cookie", session);
    
    expect(response.status).toBe(404); // Not found (not 403, to avoid enumeration)
  });

  test("should not return centre2 classes in centre1 list query", async () => {
    const session = await mockSession(centre1User);
    
    const response = await request(app)
      .get("/api/academic/classes")
      .set("Cookie", session);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(centre1Class.id);
    expect(response.body.data[0].centreId).toBe("centre_1");
  });

  test("should enforce centreId in database queries", async () => {
    // Direct database query test
    const classes = await prisma.classCohort.findMany({
      where: { centreId: "centre_1" }
    });
    
    expect(classes.every(c => c.centreId === "centre_1")).toBe(true);
  });
});
```

**Expected Result:** All tests pass - zero data leakage between centres

---

### 2.2 Test: SUPER_ADMIN Cross-Centre Access

```typescript
test("SUPER_ADMIN can query across centres", async () => {
  const superAdmin = await createUser({ role: "SUPER_ADMIN" });
  const session = await mockSession(superAdmin);
  
  const response = await request(app)
    .get("/api/academic/classes")
    .query({ centreId: "centre_2" }) // Explicit centre query
    .set("Cookie", session);
  
  expect(response.status).toBe(200);
  // Should return centre_2 classes even though user is from different centre
});
```

---

## 3. RBAC (Role-Based Access Control) Tests

### 3.1 Test: Unauthorized Access Denied

```typescript
describe("RBAC Enforcement", () => {
  test("STUDENT cannot access admin approvals", async () => {
    const student = await createUser({ role: "STUDENT" });
    const session = await mockSession(student);
    
    const response = await request(app)
      .get("/api/governance/approvals")
      .set("Cookie", session);
    
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  test("TEACHER can only mark attendance for own classes", async () => {
    const teacher1 = await createUser({ role: "TEACHER" });
    const teacher2 = await createUser({ role: "TEACHER" });
    
    const class1 = await createClass({ teacherId: teacher1.id });
    const session1 = await createSession({ classId: class1.id });
    
    const session = await mockSession(teacher2);
    
    const response = await request(app)
      .post("/api/academic/attendance/bulk")
      .set("Cookie", session)
      .send({
        sessionId: session1.id,
        records: [{ studentId: "student_1", status: "PRESENT" }]
      });
    
    expect(response.status).toBe(403);
  });

  test("PARENT can only view their children's data", async () => {
    const parent = await createUser({ role: "PARENT" });
    const child1 = await createUser({ role: "STUDENT", parentId: parent.id });
    const child2 = await createUser({ role: "STUDENT" }); // Different parent
    
    const invoice1 = await createInvoice({ studentId: child1.id });
    const invoice2 = await createInvoice({ studentId: child2.id });
    
    const session = await mockSession(parent);
    
    const response = await request(app)
      .get("/api/finance/invoices")
      .set("Cookie", session);
    
    expect(response.status).toBe(200);
    expect(response.body.data.map(inv => inv.id)).toContain(invoice1.id);
    expect(response.body.data.map(inv => inv.id)).not.toContain(invoice2.id);
  });
});
```

**Expected Result:** All unauthorized access attempts return 403 Forbidden

---

### 3.2 Test: RBAC Matrix Compliance

```typescript
const rbacMatrix = {
  "/api/governance/approvals": {
    allowed: ["SUPER_ADMIN", "CENTER_ADMIN", "FINANCE_ADMIN"],
    denied: ["TEACHER", "STUDENT", "PARENT"]
  },
  "/api/academic/classes (POST)": {
    allowed: ["SUPER_ADMIN", "CENTER_ADMIN", "TEACHER"],
    denied: ["STUDENT", "PARENT", "FINANCE_ADMIN"]
  },
  "/api/finance/refunds (POST)": {
    allowed: ["SUPER_ADMIN", "CENTER_ADMIN", "FINANCE_ADMIN"],
    denied: ["TEACHER", "STUDENT", "PARENT"]
  }
};

describe("RBAC Matrix Compliance", () => {
  Object.entries(rbacMatrix).forEach(([endpoint, rules]) => {
    rules.allowed.forEach(role => {
      test(`${role} can access ${endpoint}`, async () => {
        const user = await createUser({ role });
        const session = await mockSession(user);
        const response = await testEndpoint(endpoint, session);
        expect(response.status).not.toBe(403);
      });
    });

    rules.denied.forEach(role => {
      test(`${role} cannot access ${endpoint}`, async () => {
        const user = await createUser({ role });
        const session = await mockSession(user);
        const response = await testEndpoint(endpoint, session);
        expect(response.status).toBe(403);
      });
    });
  });
});
```

---

## 4. Finance Correctness Tests

### 4.1 Test: Invoice Calculations

```typescript
describe("Finance Calculations", () => {
  test("invoice total equals sum of line items", async () => {
    const lineItems = [
      { description: "Tuition", quantity: 1, unitPrice: 250.00 },
      { description: "Materials", quantity: 2, unitPrice: 25.00 }
    ];
    
    const invoice = await createInvoice({ lineItems });
    
    const expectedTotal = lineItems.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );
    
    expect(invoice.total).toBe(expectedTotal);
    expect(invoice.balance).toBe(expectedTotal); // No payments yet
  });

  test("invoice balance updates correctly after payment", async () => {
    const invoice = await createInvoice({ total: 275.00 });
    
    await createPayment({ invoiceId: invoice.id, amount: 100.00 });
    
    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    
    expect(updated.paidAmount).toBe(100.00);
    expect(updated.balance).toBe(175.00);
    expect(updated.status).toBe("PARTIAL");
  });

  test("invoice status changes to PAID when fully paid", async () => {
    const invoice = await createInvoice({ total: 275.00 });
    
    await createPayment({ invoiceId: invoice.id, amount: 275.00 });
    
    const updated = await prisma.invoice.findUnique({ where: { id: invoice.id } });
    
    expect(updated.paidAmount).toBe(275.00);
    expect(updated.balance).toBe(0);
    expect(updated.status).toBe("PAID");
  });

  test("cannot record payment exceeding invoice balance", async () => {
    const invoice = await createInvoice({ total: 275.00 });
    
    const result = await createPayment({ 
      invoiceId: invoice.id, 
      amount: 300.00 
    });
    
    expect(result.error).toBeDefined();
    expect(result.error.code).toBe("VALIDATION_ERROR");
  });
});
```

---

### 4.2 Test: Refund Validation

```typescript
describe("Refund Validation", () => {
  test("cannot refund more than original payment", async () => {
    const payment = await createPayment({ amount: 100.00 });
    
    const result = await createRefund({
      paymentId: payment.id,
      amount: 150.00,
      reason: "Test"
    });
    
    expect(result.error).toBeDefined();
  });

  test("refund requires approval before processing", async () => {
    const payment = await createPayment({ amount: 100.00 });
    
    const refund = await createRefund({
      paymentId: payment.id,
      amount: 50.00,
      reason: "Duplicate payment"
    });
    
    expect(refund.status).toBe("PENDING");
    expect(refund.approvalRequestId).toBeDefined();
    
    // Cannot mark as processed while pending
    const processResult = await processRefund(refund.id);
    expect(processResult.error.code).toBe("INVALID_STATE");
  });

  test("approved refund can be processed", async () => {
    const payment = await createPayment({ amount: 100.00 });
    const refund = await createRefund({ paymentId: payment.id, amount: 50.00 });
    
    // Approve via approval workflow
    await approveRequest(refund.approvalRequestId);
    
    // Now can process
    const processed = await processRefund(refund.id);
    expect(processed.status).toBe("PROCESSED");
  });
});
```

---

## 5. Operations & SLA Tests

### 5.1 Test: SLA Calculation

```typescript
describe("SLA Calculation", () => {
  beforeAll(async () => {
    // Seed SLA config
    await prisma.sLAConfig.create({
      data: {
        ticketType: "IT",
        priority: "URGENT",
        responseTimeHours: 1,
        resolutionTimeHours: 4,
        centreId: "centre_1"
      }
    });
  });

  test("slaDueAt calculated correctly on ticket creation", async () => {
    const createdAt = new Date("2026-02-12T10:00:00Z");
    
    const ticket = await createTicket({
      type: "IT",
      priority: "URGENT",
      createdAt
    });
    
    const expectedDueAt = new Date("2026-02-12T14:00:00Z"); // +4 hours
    
    expect(ticket.slaDueAt).toEqual(expectedDueAt);
  });

  test("ticket marked as overdue when past slaDueAt", async () => {
    const ticket = await createTicket({
      type: "IT",
      priority: "HIGH",
      slaDueAt: new Date(Date.now() - 3600000) // 1 hour ago
    });
    
    // Run escalation job
    await escalateOverdueTickets();
    
    const updated = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    
    expect(updated.isOverdue).toBe(true);
    expect(updated.status).toBe("ESCALATED");
  });
});
```

---

### 5.2 Test: Ticket Escalation Job

```typescript
describe("Ticket Escalation Job", () => {
  test("escalates overdue tickets", async () => {
    const openTicket = await createTicket({
      status: "OPEN",
      slaDueAt: new Date(Date.now() - 1000) // Past due
    });
    
    const onTimeTicket = await createTicket({
      status: "OPEN",
      slaDueAt: new Date(Date.now() + 3600000) // Future
    });
    
    await escalateOverdueTickets();
    
    const escalated = await prisma.ticket.findUnique({ where: { id: openTicket.id } });
    const notEscalated = await prisma.ticket.findUnique({ where: { id: onTimeTicket.id } });
    
    expect(escalated.status).toBe("ESCALATED");
    expect(notEscalated.status).toBe("OPEN");
  });

  test("does not escalate already resolved tickets", async () => {
    const resolvedTicket = await createTicket({
      status: "RESOLVED",
      slaDueAt: new Date(Date.now() - 1000)
    });
    
    await escalateOverdueTickets();
    
    const ticket = await prisma.ticket.findUnique({ where: { id: resolvedTicket.id } });
    expect(ticket.status).toBe("RESOLVED"); // Still resolved
  });
});
```

---

## 6. Academic Features Tests

### 6.1 Test: Catch-Up Auto-Generation

```typescript
describe("Catch-Up Auto-Generation", () => {
  test("catch-up created when attendance marked ABSENT", async () => {
    const session = await createSession();
    const student = await createUser({ role: "STUDENT" });
    
    await markAttendance({
      sessionId: session.id,
      studentId: student.id,
      status: "ABSENT"
    });
    
    const catchUps = await prisma.catchUpPackage.findMany({
      where: { studentId: student.id, sessionId: session.id }
    });
    
    expect(catchUps).toHaveLength(1);
    expect(catchUps[0].status).toBe("PENDING");
    expect(catchUps[0].dueDate).toBeDefined();
  });

  test("catch-up NOT created when attendance marked PRESENT", async () => {
    const session = await createSession();
    const student = await createUser({ role: "STUDENT" });
    
    await markAttendance({
      sessionId: session.id,
      studentId: student.id,
      status: "PRESENT"
    });
    
    const catchUps = await prisma.catchUpPackage.findMany({
      where: { studentId: student.id, sessionId: session.id }
    });
    
    expect(catchUps).toHaveLength(0);
  });

  test("catch-up due date is 7 days from session date", async () => {
    const sessionDate = new Date("2026-02-12T10:00:00Z");
    const session = await createSession({ startsAt: sessionDate });
    const student = await createUser({ role: "STUDENT" });
    
    await markAttendance({
      sessionId: session.id,
      studentId: student.id,
      status: "ABSENT"
    });
    
    const catchUp = await prisma.catchUpPackage.findFirst({
      where: { studentId: student.id, sessionId: session.id }
    });
    
    const expectedDueDate = new Date("2026-02-19T10:00:00Z");
    expect(catchUp.dueDate).toEqual(expectedDueDate);
  });
});
```

---

### 6.2 Test: Class Capacity Validation

```typescript
describe("Class Capacity", () => {
  test("cannot add students exceeding maxCapacity", async () => {
    const classData = await createClass({ maxCapacity: 2 });
    const student1 = await createUser({ role: "STUDENT" });
    const student2 = await createUser({ role: "STUDENT" });
    const student3 = await createUser({ role: "STUDENT" });
    
    await addStudentToClass(classData.id, student1.id); // OK
    await addStudentToClass(classData.id, student2.id); // OK
    
    const result = await addStudentToClass(classData.id, student3.id);
    expect(result.error.code).toBe("CAPACITY_EXCEEDED");
  });

  test("currentEnrollment updates correctly", async () => {
    const classData = await createClass({ maxCapacity: 5 });
    const student1 = await createUser({ role: "STUDENT" });
    const student2 = await createUser({ role: "STUDENT" });
    
    await addStudentToClass(classData.id, student1.id);
    let updated = await prisma.classCohort.findUnique({ where: { id: classData.id } });
    expect(updated.currentEnrollment).toBe(1);
    
    await addStudentToClass(classData.id, student2.id);
    updated = await prisma.classCohort.findUnique({ where: { id: classData.id } });
    expect(updated.currentEnrollment).toBe(2);
  });
});
```

---

## 7. Audit Logging Tests

### 7.1 Test: Audit Events Created

```typescript
describe("Audit Logging", () => {
  test("audit event created on invoice creation", async () => {
    const user = await createUser({ role: "FINANCE_ADMIN" });
    const invoice = await createInvoice({ createdById: user.id });
    
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        action: "CREATE",
        resourceType: "Invoice",
        resourceId: invoice.id
      }
    });
    
    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0].userId).toBe(user.id);
    expect(auditEvents[0].afterState).toMatchObject({
      total: invoice.total,
      status: invoice.status
    });
  });

  test("audit event captures before/after state on update", async () => {
    const refund = await createRefund({ status: "PENDING" });
    
    await approveRefund(refund.id);
    
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        action: "UPDATE",
        resourceType: "Refund",
        resourceId: refund.id
      }
    });
    
    expect(auditEvents.length).toBeGreaterThan(0);
    expect(auditEvents[0].beforeState).toMatchObject({ status: "PENDING" });
    expect(auditEvents[0].afterState).toMatchObject({ status: "APPROVED" });
  });
});
```

---

## 8. E2E User Flow Tests (Playwright)

### 8.1 Test: Teacher Attendance Flow

```typescript
test("Teacher can mark attendance for their class", async ({ page }) => {
  // Login as teacher
  await page.goto("/login");
  await page.fill('input[name="email"]', "teacher@lms.com");
  await page.fill('input[name="password"]', "teacher123");
  await page.click('button[type="submit"]');
  
  // Navigate to My Day
  await page.click('text=My Day');
  await expect(page).toHaveURL(/\/tutor\/my-day/);
  
  // Click on session to mark attendance
  await page.click('text=Mark Attendance');
  await expect(page).toHaveURL(/\/tutor\/attendance\//);
  
  // Mark first student as present
  await page.click('[data-testid="attendance-present-0"]');
  
  // Mark second student as absent
  await page.click('[data-testid="attendance-absent-1"]');
  await page.fill('[data-testid="attendance-notes-1"]', "Sick");
  
  // Save attendance
  await page.click('button:has-text("Save Attendance")');
  
  // Verify success message
  await expect(page.locator('text=Attendance saved successfully')).toBeVisible();
  
  // Verify catch-up notification
  await expect(page.locator('text=Catch-up package generated')).toBeVisible();
});
```

---

### 8.2 Test: Finance Admin Refund Approval Flow

```typescript
test("Finance Admin can approve refund request", async ({ page }) => {
  // Login as finance admin
  await page.goto("/login");
  await page.fill('input[name="email"]', "finance@lms.com");
  await page.fill('input[name="password"]', "finance123");
  await page.click('button[type="submit"]');
  
  // Navigate to Approvals
  await page.click('text=Approvals');
  await expect(page).toHaveURL(/\/admin\/approvals/);
  
  // Verify pending refund is visible
  await expect(page.locator('text=REFUND')).toBeVisible();
  
  // Click View Details
  await page.click('button:has-text("View Details")');
  
  // Approve the refund
  await page.fill('textarea[name="comment"]', "Approved - duplicate payment confirmed");
  await page.click('button:has-text("Approve")');
  
  // Verify success
  await expect(page.locator('text=Refund approved successfully')).toBeVisible();
  
  // Verify audit log entry
  await page.click('text=Audit Logs');
  await expect(page.locator('text=APPROVE')).toBeVisible();
  await expect(page.locator('text=Refund')).toBeVisible();
});
```

---

## 9. Performance Tests

### 9.1 Test: Query Performance

```typescript
describe("Query Performance", () => {
  test("ticket list query under 500ms", async () => {
    // Create test data
    await createManyTickets(1000);
    
    const start = Date.now();
    const tickets = await prisma.ticket.findMany({
      where: { centreId: "centre_1", status: "OPEN" },
      take: 20
    });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(500);
    expect(tickets).toHaveLength(20);
  });

  test("invoice list with complex filters under 500ms", async () => {
    await createManyInvoices(2000);
    
    const start = Date.now();
    const invoices = await prisma.invoice.findMany({
      where: {
        centreId: "centre_1",
        status: "OVERDUE",
        dueDate: { lt: new Date() }
      },
      include: {
        lineItems: true,
        payments: true
      },
      take: 20
    });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(500);
  });
});
```

---

## 10. Test Execution Plan

### 10.1 Pre-Commit Tests
```bash
npm test -- --coverage --testPathPattern="(multi-tenancy|rbac|finance)"
```

### 10.2 Pre-Merge Tests
```bash
npm test -- --coverage
npx playwright test
```

### 10.3 CI Pipeline Tests
```yaml
- name: Run Unit & Integration Tests
  run: npm test -- --coverage --ci
  
- name: Run E2E Tests
  run: npx playwright test --project=chromium
  
- name: Check Coverage
  run: npm run test:coverage-check
```

---

## 11. Success Criteria

### 11.1 Functional
- ✅ All multi-tenancy tests pass
- ✅ All RBAC tests pass
- ✅ All finance calculation tests pass
- ✅ All SLA calculation tests pass
- ✅ All catch-up generation tests pass
- ✅ All E2E critical path tests pass

### 11.2 Coverage
- ✅ Overall coverage ≥ 60%
- ✅ Critical path coverage ≥ 80%
- ✅ Business logic coverage ≥ 70%

### 11.3 Performance
- ✅ 95th percentile response time < 500ms
- ✅ No N+1 query issues
- ✅ All indexes being used

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | QA Lead | Initial version |

---
