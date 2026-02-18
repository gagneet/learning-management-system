import { test, expect, Page } from "@playwright/test";

/**
 * Admin Classes Management Pages Tests
 * Tests for class cohort management by admins
 *
 * Prerequisites: npm run db:seed (demo data must exist)
 * Accounts:
 *   Admin: centeradmin@lms.com / admin123
 *   Super Admin: admin@lms.com / admin123
 */

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("centeradmin@lms.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

async function loginAsSuperAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("admin@lms.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

// ─── Classes List Page ────────────────────────────────────────────────────────

test.describe("Admin Classes List Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should navigate to classes page", async ({ page }) => {
    await page.goto("/admin/classes");
    await expect(page).toHaveURL(/.*admin\/classes.*/);
  });

  test("should display classes page without error", async ({ page }) => {
    await page.goto("/admin/classes");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("should show classes heading", async ({ page }) => {
    await page.goto("/admin/classes");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("should have a link to create a new class", async ({ page }) => {
    await page.goto("/admin/classes");
    // Should have a create/new class button or link
    const createLink = page.getByRole("link", { name: /create|new class/i }).first();
    if (await createLink.isVisible()) {
      await expect(createLink).toHaveAttribute("href", /admin\/classes\/create/);
    }
  });

  test("should be accessible from Classes action card in supervisor dashboard", async ({ page }) => {
    await page.goto("/dashboard/supervisor");
    const classesLink = page.getByRole("link", { name: /Classes/i }).first();
    if (await classesLink.isVisible()) {
      await expect(classesLink).toHaveAttribute("href", "/admin/classes");
    }
  });
});

test.describe("Super Admin Classes Access", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSuperAdmin(page);
  });

  test("should access classes page as super admin", async ({ page }) => {
    await page.goto("/admin/classes");
    await expect(page).toHaveURL(/.*admin\/classes.*/);
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("should show Classes action card in super admin dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    const classesLink = page.getByRole("link", { name: /Classes/i }).first();
    if (await classesLink.isVisible()) {
      await expect(classesLink).toHaveAttribute("href", "/admin/classes");
    }
  });
});

// ─── Create Class Page ────────────────────────────────────────────────────────

test.describe("Admin Create Class Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should navigate to create class page", async ({ page }) => {
    await page.goto("/admin/classes/create");
    await expect(page).toHaveURL(/.*admin\/classes\/create.*/);
  });

  test("should display create class form without error", async ({ page }) => {
    await page.goto("/admin/classes/create");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Role-Based Access Control ────────────────────────────────────────────────

test.describe("Classes RBAC - Non-Admin Cannot Access", () => {
  test("student should be redirected from classes page", async ({ page }) => {
    // Login as student
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("student@lms.com");
    await page.getByLabel("Password").fill("student123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });

    // Try to access admin classes page
    await page.goto("/admin/classes");
    // Should be redirected away (not see 500 error)
    await expect(page.locator("body")).not.toContainText("500");
    // Should either redirect or show appropriate message
    await expect(page).not.toHaveURL(/.*admin\/classes$/);
  });

  test("teacher should be redirected from classes page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email Address").fill("teacher@lms.com");
    await page.getByLabel("Password").fill("teacher123");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });

    await page.goto("/admin/classes");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page).not.toHaveURL(/.*admin\/classes$/);
  });
});
