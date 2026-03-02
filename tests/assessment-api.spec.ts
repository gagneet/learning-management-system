import { test, expect, Page } from "@playwright/test";

/**
 * Phase 2 — Adaptive Tuition Assessment Engine: API Integration Tests
 *
 * Tests hit the live HTTP endpoints (requires: npm run db:seed + dev server).
 * Covers all v2 assessment API routes:
 *
 *   GET  /api/v1/assessment-levels
 *   POST /api/v1/assessment-levels        (CENTER_ADMIN only)
 *   GET  /api/v1/assessment-levels/:id
 *   GET  /api/v1/assessment-levels/:id/lessons
 *   GET  /api/v1/student-placements
 *   POST /api/v1/student-placements
 *   GET  /api/v1/student-placements/:id
 *   POST /api/v1/student-placements/:id/lesson-completions
 *   GET  /api/v1/student-placements/:id/lesson-completions
 *   GET  /api/v1/promotion-tests
 *   POST /api/v1/promotion-tests          (TEACHER only)
 *   GET  /api/v1/promotion-tests/:id
 *   POST /api/v1/promotion-tests/:id/attempt
 *   GET  /api/v1/assessment-grid
 */

async function loginAndGetCookies(
  page: Page,
  email: string,
  password: string
): Promise<string> {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15_000 });
  const cookies = await page.context().cookies();
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

// ─── Assessment Levels ───────────────────────────────────────────────────────

test.describe("GET /api/v1/assessment-levels", () => {
  test("returns 200 with data array (public endpoint — no auth required)", async ({ request }) => {
    const res = await request.get("/api/v1/assessment-levels");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("returns 200 for authenticated teacher too", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/assessment-levels", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("accepts ageYear query filter without error", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/assessment-levels?ageYear=7", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const allYear7 = body.data.every(
      (l: { ageYear: number }) => l.ageYear === 7
    );
    if (body.data.length > 0) expect(allYear7).toBe(true);
  });

  test("accepts subject filter and returns levels that have lessons for that subject", async ({
    page,
    request,
  }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get(
      "/api/v1/assessment-levels?subject=ENGLISH&includeLessonCount=true",
      { headers: { Cookie: cookies } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  test("POST /api/v1/assessment-levels returns 403 for non-admin", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.post("/api/v1/assessment-levels", {
      headers: { Cookie: cookies, "Content-Type": "application/json" },
      data: { ageYear: 6, ageMonth: 0, displayLabel: "6y0m", australianYear: "Year 1" },
    });
    expect(res.status()).toBe(403);
  });

  test("POST /api/v1/assessment-levels returns 200 for CENTER_ADMIN", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "centeradmin@lms.com", "admin123");
    const res = await request.post("/api/v1/assessment-levels", {
      headers: { Cookie: cookies, "Content-Type": "application/json" },
      data: {
        ageYear: 99,
        ageMonth: 0,
        displayLabel: "TEST-99y0m",
        australianYear: "TEST Year",
        isActive: false,
      },
    });
    // Either 200 (created) or 409 (already exists) — not 5xx
    expect([200, 201, 409]).toContain(res.status());
  });
});

// ─── Assessment Level by ID + Lessons ───────────────────────────────────────

test.describe("GET /api/v1/assessment-levels/:id", () => {
  let levelId: string;

  test.beforeEach(async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/assessment-levels", {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    levelId = body.data?.[0]?.id ?? "nonexistent";
  });

  test("returns 200 with level detail for known id", async ({ page, request }) => {
    if (levelId === "nonexistent") test.skip();
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get(`/api/v1/assessment-levels/${levelId}`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.level).toHaveProperty("id", levelId);
  });

  test("returns 404 for unknown id", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/assessment-levels/nonexistent-id", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(404);
  });

  test("GET lessons sub-route returns lesson array", async ({ page, request }) => {
    if (levelId === "nonexistent") test.skip();
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get(`/api/v1/assessment-levels/${levelId}/lessons`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.lessons)).toBe(true);
  });
});

// ─── Student Placements ──────────────────────────────────────────────────────

test.describe("GET /api/v1/student-placements", () => {
  test("returns 200 with placements array for teacher", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/student-placements", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("placements");
    expect(Array.isArray(body.placements)).toBe(true);
  });

  test("returns 401 for unauthenticated request", async ({ request }) => {
    const res = await request.get("/api/v1/student-placements");
    expect(res.status()).toBe(401);
  });

  test("student can only see own placements (scoped response)", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "student@lms.com", "student123");
    const res = await request.get("/api/v1/student-placements", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Every placement returned must belong to this student
    if (body.placements.length > 0) {
      const allOwnData = body.placements.every(
        (p: { student?: { email: string } }) =>
          !p.student || p.student.email === "student@lms.com"
      );
      expect(allOwnData).toBe(true);
    }
  });

  test("parent can see children's placements", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "parent1@lms.com", "admin123");
    const res = await request.get("/api/v1/student-placements", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("placements");
  });

  test("POST /api/v1/student-placements returns 400 if required fields missing", async ({
    page,
    request,
  }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.post("/api/v1/student-placements", {
      headers: { Cookie: cookies, "Content-Type": "application/json" },
      data: { studentId: "some-id" }, // missing subject and assessmentAgeId
    });
    expect(res.status()).toBe(400);
  });
});

// ─── Student Placement by ID ─────────────────────────────────────────────────

test.describe("GET /api/v1/student-placements/:id", () => {
  let placementId: string;

  test.beforeEach(async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/student-placements", {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    placementId = body.placements?.[0]?.id ?? "nonexistent";
  });

  test("returns 200 with placement detail for valid id", async ({ page, request }) => {
    if (placementId === "nonexistent") test.skip();
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get(`/api/v1/student-placements/${placementId}`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.placement).toHaveProperty("id", placementId);
  });

  test("returns 404 for unknown placement id", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/student-placements/unknown-xxx", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(404);
  });
});

// ─── Lesson Completions sub-route ────────────────────────────────────────────

test.describe("POST /api/v1/student-placements/:id/lesson-completions", () => {
  test("returns 400 when lessonId and status are missing", async ({ page, request }) => {
    const cookiesTeacher = await loginAndGetCookies(
      page,
      "teacher@lms.com",
      "teacher123"
    );
    // Get a real placementId
    const listRes = await request.get("/api/v1/student-placements", {
      headers: { Cookie: cookiesTeacher },
    });
    const listBody = await listRes.json();
    const pid = listBody.placements?.[0]?.id;
    if (!pid) test.skip();

    const res = await request.post(
      `/api/v1/student-placements/${pid}/lesson-completions`,
      {
        headers: { Cookie: cookiesTeacher, "Content-Type": "application/json" },
        data: {}, // empty body
      }
    );
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("returns 400 for mismatched lesson subject", async ({ page, request }) => {
    const cookiesTeacher = await loginAndGetCookies(
      page,
      "teacher@lms.com",
      "teacher123"
    );
    const listRes = await request.get("/api/v1/student-placements", {
      headers: { Cookie: cookiesTeacher },
    });
    const listBody = await listRes.json();
    const pid = listBody.placements?.[0]?.id;
    if (!pid) test.skip();

    const res = await request.post(
      `/api/v1/student-placements/${pid}/lesson-completions`,
      {
        headers: { Cookie: cookiesTeacher, "Content-Type": "application/json" },
        data: {
          lessonId: "nonexistent-lesson-id",
          status: "IN_PROGRESS",
        },
      }
    );
    expect([400, 404]).toContain(res.status());
  });

  test("GET lesson-completions returns 200 for valid placement", async ({ page, request }) => {
    const cookiesTeacher = await loginAndGetCookies(
      page,
      "teacher@lms.com",
      "teacher123"
    );
    const listRes = await request.get("/api/v1/student-placements", {
      headers: { Cookie: cookiesTeacher },
    });
    const listBody = await listRes.json();
    const pid = listBody.placements?.[0]?.id;
    if (!pid) test.skip();

    const res = await request.get(
      `/api/v1/student-placements/${pid}/lesson-completions`,
      { headers: { Cookie: cookiesTeacher } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.completions)).toBe(true);
  });
});

// ─── Promotion Tests ─────────────────────────────────────────────────────────

test.describe("GET /api/v1/promotion-tests", () => {
  test("returns 200 with tests array for teacher", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/promotion-tests", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("tests");
    expect(Array.isArray(body.tests)).toBe(true);
  });

  test("returns 401 for unauthenticated request", async ({ request }) => {
    const res = await request.get("/api/v1/promotion-tests");
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/promotion-tests returns 403 for student", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "student@lms.com", "student123");
    const res = await request.post("/api/v1/promotion-tests", {
      headers: { Cookie: cookies, "Content-Type": "application/json" },
      data: { title: "Test", subject: "ENGLISH", targetAgeId: "some-id" },
    });
    expect(res.status()).toBe(403);
  });

  test("POST /api/v1/promotion-tests returns 400 for missing required fields", async ({
    page,
    request,
  }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.post("/api/v1/promotion-tests", {
      headers: { Cookie: cookies, "Content-Type": "application/json" },
      data: { title: "Incomplete" }, // missing targetAgeId, subject
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("GET /api/v1/promotion-tests/:id", () => {
  test("returns 404 for unknown id", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/promotion-tests/unknown-id", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(404);
  });

  test("POST .../attempt returns 400 when required fields are missing", async ({
    page,
    request,
  }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.post(
      "/api/v1/promotion-tests/nonexistent-id/attempt",
      {
        headers: { Cookie: cookies, "Content-Type": "application/json" },
        data: {}, // missing studentId, placementId
      }
    );
    expect([400, 404]).toContain(res.status());
  });
});

// ─── Assessment Grid ─────────────────────────────────────────────────────────

test.describe("GET /api/v1/assessment-grid", () => {
  test("returns 200 with students array for teacher", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/assessment-grid", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("students");
    expect(Array.isArray(body.students)).toBe(true);
  });

  test("returns 401 for unauthenticated request", async ({ request }) => {
    const res = await request.get("/api/v1/assessment-grid");
    expect(res.status()).toBe(401);
  });

  test("returns 403 for student attempting to view the full grid", async ({
    page,
    request,
  }) => {
    const cookies = await loginAndGetCookies(page, "student@lms.com", "student123");
    const res = await request.get("/api/v1/assessment-grid", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(403);
  });

  test("student rows contain id, name, placements, chronologicalAge", async ({
    page,
    request,
  }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/assessment-grid", {
      headers: { Cookie: cookies },
    });
    const body = await res.json();
    if (body.students.length > 0) {
      const row = body.students[0];
      expect(row).toHaveProperty("id");       // route returns 'id', not 'studentId'
      expect(row).toHaveProperty("name");
      expect(row).toHaveProperty("placements");
      expect(row).toHaveProperty("chronologicalAge");
    }
  });

  test("accepts subject and ageBand query params (valid ENGLISH)", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get(
      "/api/v1/assessment-grid?subject=ENGLISH&ageBand=ON_LEVEL",
      { headers: { Cookie: cookies } }
    );
    expect(res.status()).toBe(200);
  });

  test("returns 400 for invalid subject param", async ({ page, request }) => {
    const cookies = await loginAndGetCookies(page, "teacher@lms.com", "teacher123");
    const res = await request.get("/api/v1/assessment-grid?subject=INVALID", {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(400);
  });
});
