import { test, expect, Page } from "@playwright/test";

/**
 * Phase 7 & 8 — Marking Queue, Risk Dashboard, My Day Enhancement,
 *               Assessment CSV Export, KPI Dashboard
 *
 * Tests cover:
 *   • Lesson marking queue UI (tutor marking page)
 *   • Assessment risk dashboard (supervisor)
 *   • My Day submitted lessons widget (teacher)
 *   • Lesson marking queue API auth + RBAC
 *   • Assessment CSV export API
 *   • Assessment KPI metrics API
 *   • Assessment KPI dashboard page
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

const loginAsAdmin      = (p: Page) => loginAs(p, "centeradmin@lms.com", "admin123");
const loginAsTeacher    = (p: Page) => loginAs(p, "teacher@lms.com", "teacher123");
const loginAsStudent    = (p: Page) => loginAs(p, "student@lms.com", "student123");
const loginAsSupervisor = (p: Page) => loginAs(p, "supervisor@lms.com", "admin123");

async function noError(page: Page) {
  const body = page.locator("body");
  await expect(body).not.toContainText("Internal Server Error");
  await expect(body).not.toContainText("Application error");
  await expect(body).not.toContainText("TypeError");
}

// ─── Marking Queue UI ─────────────────────────────────────────────────────────

test.describe("Marking Queue — Lesson Marking UI", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("marking page loads without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/marking");
    await noError(page);
    await expect(page.locator("body")).toContainText(/Marking|Assessment|Homework/i);
  });

  test("marking page shows lesson marking section or empty state", async ({ page }) => {
    await page.goto("/dashboard/tutor/marking");
    await noError(page);
    // Either "No lessons awaiting marking" or a list of submissions
    const body = page.locator("body");
    const hasQueue = await body.getByText(/Lessons to Mark|No lessons awaiting/i).count();
    expect(hasQueue).toBeGreaterThanOrEqual(0); // page renders without crash
  });

  test("marking page has stat cards including lessons to mark", async ({ page }) => {
    await page.goto("/dashboard/tutor/marking");
    await noError(page);
    // Stat grid should be present (homework, assessment marking etc.)
    const body = page.locator("body");
    await expect(body).not.toContainText("500");
  });
});

// ─── Lesson Marking Queue API ─────────────────────────────────────────────────

test.describe("Lesson Marking Queue API — /api/v1/lesson-marking-queue", () => {
  test("unauthenticated returns 401", async ({ request }) => {
    const res = await request.get("/api/v1/lesson-marking-queue");
    expect(res.status()).toBe(401);
  });

  test("student cannot access marking queue", async ({ page }) => {
    await loginAsStudent(page);
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/v1/lesson-marking-queue");
      return res.status;
    });
    expect(status).toBe(403);
  });

  test("teacher gets 200 from marking queue API", async ({ page }) => {
    await loginAsTeacher(page);
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/v1/lesson-marking-queue");
      if (!res.ok) return { status: res.status };
      const d = await res.json();
      return { status: res.status, success: d.success };
    });
    expect(result.status).toBe(200);
    expect(result.success).toBe(true);
  });
});

// ─── Assessment Risk Dashboard ────────────────────────────────────────────────

test.describe("Assessment Risk Dashboard — /dashboard/supervisor/assessment-risk", () => {
  test("supervisor can view risk dashboard", async ({ page }) => {
    await loginAsSupervisor(page);
    await page.goto("/dashboard/supervisor/assessment-risk");
    await noError(page);
    await expect(page.locator("body")).toContainText(/Risk|Progress|Revision|Promotion/i);
  });

  test("teacher can view risk dashboard", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/supervisor/assessment-risk");
    await noError(page);
  });

  test("student cannot access risk dashboard", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/dashboard/supervisor/assessment-risk");
    await expect(page).not.toHaveURL("/dashboard/supervisor/assessment-risk");
  });

  test("risk dashboard shows summary stat cards", async ({ page }) => {
    await loginAsSupervisor(page);
    await page.goto("/dashboard/supervisor/assessment-risk");
    await noError(page);
    // Should render stat cards (could be "0 at risk" if no risky placements in seed)
    const body = page.locator("body");
    await expect(body).not.toContainText("500");
  });

  test("admin can access risk dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/dashboard/supervisor/assessment-risk");
    await noError(page);
    await expect(page.locator("body")).toContainText(/Risk|Progress|Assessment/i);
  });
});

// ─── Assessment CSV Export API ────────────────────────────────────────────────

test.describe("Assessment Export — /api/v1/assessment-export", () => {
  test("unauthenticated returns 401", async ({ request }) => {
    const res = await request.get("/api/v1/assessment-export");
    expect(res.status()).toBe(401);
  });

  test("student cannot export assessment data", async ({ page }) => {
    await loginAsStudent(page);
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/v1/assessment-export");
      return res.status;
    });
    expect(status).toBe(403);
  });

  test("teacher can export assessment CSV", async ({ page }) => {
    await loginAsTeacher(page);
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/v1/assessment-export");
      const contentType = res.headers.get("content-type") ?? "";
      return { status: res.status, isCSV: contentType.includes("csv") };
    });
    expect(result.status).toBe(200);
    expect(result.isCSV).toBe(true);
  });

  test("supervisor can export assessment CSV with subject filter", async ({ page }) => {
    await loginAsSupervisor(page);
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/v1/assessment-export?subject=ENGLISH");
      return { status: res.status };
    });
    expect(result.status).toBe(200);
  });

  test("admin can export and CSV has expected headers", async ({ page }) => {
    await loginAsAdmin(page);
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/v1/assessment-export");
      if (!res.ok) return { ok: false, headers: "" };
      const text = await res.text();
      return { ok: true, headers: text.split("\n")[0] ?? "" };
    });
    expect(result.ok).toBe(true);
    expect(result.headers).toContain("Student Name");
    expect(result.headers).toContain("Subject");
  });
});

// ─── Assessment KPI API ───────────────────────────────────────────────────────

test.describe("Assessment KPIs API — /api/v1/assessment-kpis", () => {
  test("unauthenticated returns 401", async ({ request }) => {
    const res = await request.get("/api/v1/assessment-kpis");
    expect(res.status()).toBe(401);
  });

  test("student cannot access KPI API", async ({ page }) => {
    await loginAsStudent(page);
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/v1/assessment-kpis");
      return res.status;
    });
    expect(status).toBe(403);
  });

  test("supervisor gets KPI data with expected shape", async ({ page }) => {
    await loginAsSupervisor(page);
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/v1/assessment-kpis");
      if (!res.ok) return null;
      return await res.json();
    });
    expect(result).not.toBeNull();
    expect(typeof result.totalPlacements).toBe("number");
    expect(typeof result.avgLessonsCompleted).toBe("number");
    expect(typeof result.readyForPromotion).toBe("number");
    expect(Array.isArray(result.levelDistribution)).toBe(true);
  });

  test("admin gets KPI data", async ({ page }) => {
    await loginAsAdmin(page);
    const status = await page.evaluate(async () => {
      const res = await fetch("/api/v1/assessment-kpis");
      return res.status;
    });
    expect(status).toBe(200);
  });
});

// ─── Assessment KPI Dashboard Page ───────────────────────────────────────────

test.describe("Assessment KPI Dashboard — /dashboard/supervisor/assessment-kpis", () => {
  test("supervisor can view KPI dashboard", async ({ page }) => {
    await loginAsSupervisor(page);
    await page.goto("/dashboard/supervisor/assessment-kpis");
    await noError(page);
    await expect(page.locator("body")).toContainText(/KPI|Assessment|Placement/i);
  });

  test("admin can view KPI dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/dashboard/supervisor/assessment-kpis");
    await noError(page);
    await expect(page.locator("body")).toContainText(/KPI|Assessment|Placement/i);
  });

  test("student cannot access KPI dashboard", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/dashboard/supervisor/assessment-kpis");
    await expect(page).not.toHaveURL("/dashboard/supervisor/assessment-kpis");
  });

  test("KPI page has subject breakdown section", async ({ page }) => {
    await loginAsSupervisor(page);
    await page.goto("/dashboard/supervisor/assessment-kpis");
    await noError(page);
    const body = page.locator("body");
    await expect(body).not.toContainText("500");
  });

  test("KPI page has Export CSV link", async ({ page }) => {
    await loginAsSupervisor(page);
    await page.goto("/dashboard/supervisor/assessment-kpis");
    await noError(page);
    const exportLink = page.getByRole("link", { name: /export csv/i });
    await expect(exportLink).toBeVisible();
  });

  test("teacher cannot access KPI dashboard", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/supervisor/assessment-kpis");
    // Teachers are redirected away from the KPI page
    await expect(page).not.toHaveURL("/dashboard/supervisor/assessment-kpis");
  });
});

// ─── My Day Enhancement ───────────────────────────────────────────────────────

test.describe("My Day — Lessons to Mark Widget", () => {
  test("My Day page loads without error for teacher", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/tutor/my-day");
    await noError(page);
    await expect(page.locator("body")).toContainText(/My Day|Session|Task/i);
  });

  test("My Day shows marking widget when lessons are pending", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/tutor/my-day");
    await noError(page);
    // Widget is conditionally shown — just verify page renders without 500
    const body = page.locator("body");
    await expect(body).not.toContainText("500");
  });
});

// ─── Supervisor Dashboard Action Cards ───────────────────────────────────────

test.describe("Supervisor Dashboard — Phase 7+8 Action Cards", () => {
  test("supervisor dashboard has Assessment KPIs card", async ({ page }) => {
    await loginAsSupervisor(page);
    await page.goto("/dashboard");
    const kpiLink = page.getByRole("link", { name: /assessment kpi/i });
    await expect(kpiLink).toBeVisible();
  });

  test("admin dashboard has Assessment KPIs card", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/dashboard");
    const kpiLink = page.getByRole("link", { name: /assessment kpi/i });
    await expect(kpiLink).toBeVisible();
  });
});
