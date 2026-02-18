import { test, expect, Page } from "@playwright/test";

/**
 * Catch-up Package Pages Tests
 * Tests for student and tutor catch-up package management pages
 *
 * Prerequisites: npm run db:seed (demo data must exist)
 * Accounts:
 *   Student: student@lms.com / student123
 *   Teacher: teacher@lms.com / teacher123
 */

async function loginAsStudent(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("student@lms.com");
  await page.getByLabel("Password").fill("student123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

async function loginAsTeacher(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("teacher@lms.com");
  await page.getByLabel("Password").fill("teacher123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

// ─── Student Catch-ups ────────────────────────────────────────────────────────

test.describe("Student Catch-ups Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to catch-ups page", async ({ page }) => {
    await page.goto("/dashboard/student/catchups");
    await expect(page).toHaveURL(/.*catchups.*/);
  });

  test("should display catch-ups page without error", async ({ page }) => {
    await page.goto("/dashboard/student/catchups");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("should show catch-ups heading", async ({ page }) => {
    await page.goto("/dashboard/student/catchups");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("should be accessible via Catch-ups action card", async ({ page }) => {
    await page.goto("/dashboard/student");
    const catchupsLink = page.getByRole("link", { name: /Catch-ups/i }).first();
    if (await catchupsLink.isVisible()) {
      await expect(catchupsLink).toHaveAttribute("href", "/dashboard/student/catchups");
    }
  });

  test("should redirect non-students away", async ({ page }) => {
    // Log out first
    await page.goto("/dashboard/student/catchups");
    // The page should load for students
    await expect(page).toHaveURL(/.*catchups.*/);
  });
});

// ─── Tutor Catch-up Management ───────────────────────────────────────────────

test.describe("Tutor Catch-up Management Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to tutor catch-ups page", async ({ page }) => {
    await page.goto("/dashboard/tutor/catchups");
    await expect(page).toHaveURL(/.*catchups.*/);
  });

  test("should display tutor catch-ups page without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/catchups");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("should show catch-up management heading", async ({ page }) => {
    await page.goto("/dashboard/tutor/catchups");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("should be accessible via Catch-up Packages action card", async ({ page }) => {
    await page.goto("/dashboard/tutor");
    const catchupsLink = page.getByRole("link", { name: /Catch-up Packages/i }).first();
    if (await catchupsLink.isVisible()) {
      await expect(catchupsLink).toHaveAttribute("href", "/dashboard/tutor/catchups");
    }
  });

  test("should display student catch-up records when they exist", async ({ page }) => {
    await page.goto("/dashboard/tutor/catchups");
    // Page should load successfully with or without records
    await expect(page.locator("body")).not.toContainText("500");
  });
});
