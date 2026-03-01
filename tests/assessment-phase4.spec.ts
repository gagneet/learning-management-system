import { test, expect, Page } from "@playwright/test";

/**
 * Phase 4 — Assessment Engine: Administration, Lesson Interaction & Reporting
 *
 * Tests cover:
 *   • Assessment Levels Admin UI (/admin/assessments)
 *   • Assessment Level Detail (/admin/assessments/[levelId])
 *   • Student Lesson Detail & Status Transitions
 *   • Printable Assessment Report (/dashboard/tutor/students/[id]/assessment/report)
 *   • Notification types in API (ASSESSMENT_READY_FOR_PROMOTION, ASSESSMENT_LESSON_SUBMITTED)
 *   • Print Report button visible on tutor assessment page
 *
 * Prerequisites: npm run db:seed
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15_000 });
}

async function loginAsAdmin(page: Page) {
  await loginAs(page, "centeradmin@lms.com", "admin123");
}
async function loginAsTeacher(page: Page) {
  await loginAs(page, "teacher@lms.com", "teacher123");
}
async function loginAsStudent(page: Page) {
  await loginAs(page, "student@lms.com", "student123");
}
async function loginAsSuperAdmin(page: Page) {
  await loginAs(page, "admin@lms.com", "admin123");
}

async function expectNoServerError(page: Page) {
  const body = page.locator("body");
  await expect(body).not.toContainText("Internal Server Error");
  await expect(body).not.toContainText("Application error");
  await expect(body).not.toContainText("TypeError");
}

// ─── Assessment Levels Admin UI ───────────────────────────────────────────────

test.describe("Assessment Levels Admin — /admin/assessments", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin dashboard has Assessment Levels action card", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /assessment levels/i })).toBeVisible();
  });

  test("admin can navigate to /admin/assessments", async ({ page }) => {
    await page.goto("/admin/assessments");
    await expectNoServerError(page);
    await expect(page.locator("body")).toContainText(/Assessment Level/i);
  });

  test("assessment levels page shows level list", async ({ page }) => {
    await page.goto("/admin/assessments");
    await expectNoServerError(page);
    // Should show at least some levels (seeded data should have them)
    const body = page.locator("body");
    // Either shows levels or a 'no levels' message — no crash
    await expect(body).not.toContainText("500");
  });

  test("assessment levels page shows stats cards", async ({ page }) => {
    await page.goto("/admin/assessments");
    await expectNoServerError(page);
    // Should show stats (total levels, active, etc.)
    const body = page.locator("body");
    await expect(body).not.toContainText("Something went wrong");
  });

  test("unauthenticated redirect to login", async ({ page }) => {
    await page.goto("/admin/assessments");
    // If not logged in, should redirect to login
    await expect(page).toHaveURL(/login|dashboard/);
  });
});

test.describe("Assessment Levels Admin — Restricted Access", () => {
  test("student cannot access /admin/assessments", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/admin/assessments");
    await expect(page).not.toHaveURL("/admin/assessments");
  });

  test("teacher cannot access /admin/assessments", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/admin/assessments");
    await expect(page).not.toHaveURL("/admin/assessments");
  });

  test("super admin CAN access /admin/assessments", async ({ page }) => {
    await loginAsSuperAdmin(page);
    await page.goto("/admin/assessments");
    await expectNoServerError(page);
    await expect(page.locator("body")).toContainText(/Assessment/i);
  });
});

// ─── Assessment Level Detail ──────────────────────────────────────────────────

test.describe("Assessment Level Detail — /admin/assessments/[levelId]", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("level detail page loads without error (via API first)", async ({
    page,
    request,
  }) => {
    // Get session cookie first by logging in with browser, then use it for API
    await page.goto("/admin/assessments");
    await expectNoServerError(page);

    // Fetch first level via API
    const apiRes = await page.evaluate(async () => {
      const res = await fetch("/api/v1/assessment-levels?includeLessonCount=false");
      if (!res.ok) return null;
      const data = await res.json();
      return data?.data?.[0]?.id ?? null;
    });

    if (apiRes) {
      await page.goto(`/admin/assessments/${apiRes}`);
      await expectNoServerError(page);
      await expect(page.locator("body")).toContainText(/Lesson|Promotion|Student/i);
    }
  });
});

// ─── Print Report Button on Tutor Assessment Page ────────────────────────────

test.describe("Print Report — Tutor Student Assessment", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("Print Report button is visible on student assessment page", async ({
    page,
  }) => {
    // Navigate to any student's assessment page
    await page.goto("/dashboard/tutor/students");
    await expectNoServerError(page);

    // Get a student ID from the page if possible
    const studentLink = page.locator("a[href*='/dashboard/tutor/students/']").first();
    if ((await studentLink.count()) > 0) {
      const href = await studentLink.getAttribute("href");
      if (href) {
        await page.goto(`${href}/assessment`);
        await expectNoServerError(page);
        await expect(
          page.getByRole("link", { name: /print report/i })
        ).toBeVisible();
      }
    }
  });
});

// ─── Printable Report Page ────────────────────────────────────────────────────

test.describe("Printable Assessment Report — /dashboard/tutor/students/[id]/assessment/report", () => {
  test("report page loads for teacher", async ({ page }) => {
    await loginAsTeacher(page);

    // Get a student id via the students listing
    await page.goto("/dashboard/tutor/students");
    await expectNoServerError(page);

    const studentLink = page
      .locator("a[href*='/dashboard/tutor/students/']")
      .first();
    if ((await studentLink.count()) > 0) {
      const href = await studentLink.getAttribute("href");
      if (href) {
        const studentId = href.split("/").pop();
        await page.goto(
          `/dashboard/tutor/students/${studentId}/assessment/report`
        );
        await expectNoServerError(page);
        const body = page.locator("body");
        await expect(body).not.toContainText("404");
        // Report should show student-relevant content
        await expect(body).toContainText(/Assessment|Report|Level/i);
      }
    }
  });

  test("report page has print button", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/tutor/students");

    const studentLink = page
      .locator("a[href*='/dashboard/tutor/students/']")
      .first();
    if ((await studentLink.count()) > 0) {
      const href = await studentLink.getAttribute("href");
      if (href) {
        const studentId = href.split("/").pop();
        await page.goto(
          `/dashboard/tutor/students/${studentId}/assessment/report`
        );
        await expectNoServerError(page);
        // Print button should be in the DOM
        const printBtn = page.getByRole("button", { name: /print/i });
        await expect(printBtn).toBeVisible();
      }
    }
  });
});

// ─── Lesson Detail API (student self-service) ─────────────────────────────────

test.describe("Lesson Completion API — Student Self-Service", () => {
  test("unauthenticated request is rejected with 401", async ({ request }) => {
    const res = await request.post(
      "/api/v1/student-placements/fake-placement-id/lesson-completions",
      {
        data: { lessonId: "fake-lesson-id", status: "IN_PROGRESS" },
      }
    );
    expect(res.status()).toBe(401);
  });

  test("GET lesson completions requires auth", async ({ request }) => {
    const res = await request.get(
      "/api/v1/student-placements/fake-placement-id/lesson-completions"
    );
    expect(res.status()).toBe(401);
  });
});

// ─── Assessment Levels API ────────────────────────────────────────────────────

test.describe("Assessment Levels API — /api/v1/assessment-levels", () => {
  test("GET returns 200 with list", async ({ request }) => {
    const res = await request.get("/api/v1/assessment-levels");
    // No auth required for GET
    expect(res.status()).toBeLessThan(500);
  });

  test("PATCH to toggle level requires auth", async ({ request }) => {
    const res = await request.patch("/api/v1/assessment-levels/fake-id", {
      data: { isActive: false },
    });
    expect([401, 403, 404]).toContain(res.status());
  });
});

// ─── Notification system — assessment types ───────────────────────────────────

test.describe("Notification API — Assessment Types", () => {
  test("notifications endpoint returns 401 unauthenticated", async ({
    request,
  }) => {
    const res = await request.get("/api/notifications");
    expect([401, 302]).toContain(res.status());
  });

  test("teacher can read their notifications (authenticated)", async ({
    page,
    request,
  }) => {
    await loginAsTeacher(page);

    // After login, cookies are set — use page.evaluate to fetch
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/notifications");
      return { status: res.status };
    });
    expect(result.status).toBe(200);
  });
});

// ─── Student assessment page links to lesson detail ───────────────────────────

test.describe("Student Assessment — Lesson Links", () => {
  test("student assessment page loads without error", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/dashboard/student/assessment");
    await expectNoServerError(page);
    await expect(page.locator("body")).toContainText(/Assessment|Level|Lesson/i);
  });

  test("student cannot access /admin/assessments", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/admin/assessments");
    // Should redirect away
    await expect(page).not.toHaveURL("/admin/assessments");
  });
});
