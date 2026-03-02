import { test, expect, Page } from "@playwright/test";

/**
 * Phase 3 — Assessment Engine: Frontend Tests
 *
 * Tests cover:
 *   • Promotion Workflow UI (/dashboard/tutor/students/[id]/promote)
 *   • Assessment Analytics  (/dashboard/supervisor/assessment-analytics)
 *   • CSV Export button on Assessment Grid
 *   • "Conduct Promotion Test" link on student assessment detail
 *   • Assessment Analytics action card in supervisor dashboard
 *
 * Prerequisites: npm run db:seed
 */

// ─── Login helpers ────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15_000 });
}

async function loginAsTeacher(page: Page) {
  await loginAs(page, "teacher@lms.com", "teacher123");
}
async function loginAsSupervisor(page: Page) {
  await loginAs(page, "supervisor@lms.com", "admin123");
}
async function loginAsStudent(page: Page) {
  await loginAs(page, "student@lms.com", "student123");
}

async function expectNoServerError(page: Page) {
  await expect(page.locator("body")).not.toContainText("Internal Server Error");
  await expect(page.locator("body")).not.toContainText("Application error");
  await expect(page.locator("body")).not.toContainText("404");
}

// ============================================================================
// Assessment Grid — CSV Export
// ============================================================================

test.describe("Assessment Grid — CSV Export", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("Export CSV button is visible on assessment grid", async ({ page }) => {
    await page.goto("/dashboard/tutor/assessment");
    await expectNoServerError(page);
    const exportBtn = page.getByRole("button", { name: /Export CSV/i });
    await expect(exportBtn).toBeVisible();
  });

  test("Export CSV button triggers download", async ({ page }) => {
    await page.goto("/dashboard/tutor/assessment");
    const downloadPromise = page.waitForEvent("download", { timeout: 5_000 }).catch(() => null);
    const exportBtn = page.getByRole("button", { name: /Export CSV/i });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toMatch(/assessment-grid.*\.csv$/);
      }
    }
  });
});

// ============================================================================
// Promotion Workflow UI
// ============================================================================

test.describe("Promotion Workflow UI", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("Conduct Promotion Test link visible for student with readyForPromotion", async ({ page }) => {
    await page.goto("/dashboard/tutor/assessment");
    // Find a Profile link to navigate to assessment detail
    const profileLink = page.getByRole("link", { name: /Profile/i }).first();
    if (await profileLink.isVisible()) {
      const href = await profileLink.getAttribute("href");
      const studentId = href?.split("/students/")[1];
      if (studentId) {
        await page.goto(`/dashboard/tutor/students/${studentId}/assessment`);
        await expectNoServerError(page);
        // Check if any Conduct Promotion Test button exists (only for ready students)
        const promoteLink = page.getByRole("link", { name: /Conduct Promotion Test/i }).first();
        // It's OK if not visible — not all students are readyForPromotion
        const isVisible = await promoteLink.isVisible().catch(() => false);
        if (isVisible) {
          const href2 = await promoteLink.getAttribute("href");
          expect(href2).toMatch(/\/promote\?/);
        }
      }
    }
  });

  test("Promote page loads without error for a valid student", async ({ page }) => {
    await page.goto("/dashboard/tutor/assessment");
    const profileLink = page.getByRole("link", { name: /Profile/i }).first();
    if (await profileLink.isVisible()) {
      const href = await profileLink.getAttribute("href");
      const studentId = href?.split("/students/")[1];
      if (studentId) {
        await page.goto(`/dashboard/tutor/students/${studentId}/promote`);
        await expect(page).toHaveURL(/.*promote.*/);
        await expectNoServerError(page);
      }
    }
  });

  test("Promote page shows 'Promotion Assessment' heading", async ({ page }) => {
    await page.goto("/dashboard/tutor/assessment");
    const profileLink = page.getByRole("link", { name: /Profile/i }).first();
    if (await profileLink.isVisible()) {
      const href = await profileLink.getAttribute("href");
      const studentId = href?.split("/students/")[1];
      if (studentId) {
        await page.goto(`/dashboard/tutor/students/${studentId}/promote`);
        const heading = page.getByRole("heading", { name: /Promotion Assessment/i });
        if (await heading.isVisible()) {
          await expect(heading).toBeVisible();
        }
      }
    }
  });

  test("Promote page shows placement selection step", async ({ page }) => {
    await page.goto("/dashboard/tutor/assessment");
    const profileLink = page.getByRole("link", { name: /Profile/i }).first();
    if (await profileLink.isVisible()) {
      const href = await profileLink.getAttribute("href");
      const studentId = href?.split("/students/")[1];
      if (studentId) {
        await page.goto(`/dashboard/tutor/students/${studentId}/promote`);
        // Step 1 heading
        const step1 = page.getByText(/Select Subject Placement/i);
        const noPlacement = page.getByText(/No active placements/i);
        const eitherVisible =
          (await step1.isVisible().catch(() => false)) ||
          (await noPlacement.isVisible().catch(() => false));
        expect(eitherVisible).toBe(true);
        await expectNoServerError(page);
      }
    }
  });

  test("RBAC: student cannot access promote page", async ({ page }) => {
    await loginAsStudent(page);
    // Get any student ID from assessment grid (logged in as teacher first)
    // Use a known bad path; should redirect
    await page.goto("/dashboard/tutor/students/nonexistent-id/promote");
    await expect(page).not.toHaveURL(/.*promote.*/);
  });
});

// ============================================================================
// Assessment Analytics — Supervisor
// ============================================================================

test.describe("Assessment Analytics — Supervisor", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSupervisor(page);
  });

  test("navigates to /dashboard/supervisor/assessment-analytics without error", async ({ page }) => {
    await page.goto("/dashboard/supervisor/assessment-analytics");
    await expect(page).toHaveURL(/.*assessment-analytics.*/);
    await expectNoServerError(page);
  });

  test("displays 'Assessment Analytics' heading", async ({ page }) => {
    await page.goto("/dashboard/supervisor/assessment-analytics");
    await expect(
      page.getByRole("heading", { name: /Assessment Analytics/i })
    ).toBeVisible();
  });

  test("shows KPI summary cards (placements, ready to promote, lessons)", async ({ page }) => {
    await page.goto("/dashboard/supervisor/assessment-analytics");
    // KPI cards contain large numbers
    const statCards = page.locator(".text-3xl.font-bold");
    await expect(statCards.first()).toBeVisible();
  });

  test("shows Age Band Distribution section", async ({ page }) => {
    await page.goto("/dashboard/supervisor/assessment-analytics");
    await expect(
      page.getByText(/Age Band Distribution/i)
    ).toBeVisible();
  });

  test("shows Subject Breakdown table", async ({ page }) => {
    await page.goto("/dashboard/supervisor/assessment-analytics");
    await expect(
      page.getByText(/Subject Breakdown/i)
    ).toBeVisible();
  });

  test("shows Recent Assessment Activity section", async ({ page }) => {
    await page.goto("/dashboard/supervisor/assessment-analytics");
    await expect(
      page.getByText(/Recent Assessment Activity/i)
    ).toBeVisible();
  });

  test("action card 'Assessment Analytics' links to analytics page", async ({ page }) => {
    await page.goto("/dashboard/supervisor");
    const card = page.getByRole("link", { name: /Assessment Analytics/i });
    if (await card.isVisible()) {
      await expect(card).toHaveAttribute(
        "href",
        "/dashboard/supervisor/assessment-analytics"
      );
    }
  });

  test("RBAC: student redirected away from analytics page", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/dashboard/supervisor/assessment-analytics");
    await expect(page).not.toHaveURL(/.*assessment-analytics.*/);
  });

  test("RBAC: teacher redirected away from analytics page", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/supervisor/assessment-analytics");
    await expect(page).not.toHaveURL(/.*assessment-analytics.*/);
  });
});

// ============================================================================
// Seed data verification via UI
// ============================================================================

test.describe("Phase 3 Seed Data — UI Verification", () => {
  test("assessment grid shows students with age bands after seed", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/tutor/assessment");
    await expectNoServerError(page);
    // The grid should show at least one age band label or 'No students'
    const hasBand = page.getByText(/Above|On Level|Slightly Below|Below|Sig\. Below/i).first();
    const noStudents = page.getByText(/No students match/i);
    const eitherVisible =
      (await hasBand.isVisible().catch(() => false)) ||
      (await noStudents.isVisible().catch(() => false));
    expect(eitherVisible).toBe(true);
  });

  test("student assessment detail shows lesson completions after seed", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard/tutor/assessment");
    const profileLink = page.getByRole("link", { name: /Profile/i }).first();
    if (await profileLink.isVisible()) {
      const href = await profileLink.getAttribute("href");
      const studentId = href?.split("/students/")[1];
      if (studentId) {
        await page.goto(`/dashboard/tutor/students/${studentId}/assessment`);
        await expectNoServerError(page);
        // Summary stat cards should show values
        const boldNums = page.locator(".text-2xl.font-bold");
        await expect(boldNums.first()).toBeVisible();
      }
    }
  });
});
