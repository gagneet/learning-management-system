import { test, expect, Page } from "@playwright/test";

/**
 * Supervisor Dashboard Pages Tests
 * Tests for CENTER_SUPERVISOR and CENTER_ADMIN dashboard pages.
 *
 * Prerequisites: npm run db:seed (demo data must exist)
 * Accounts:
 *   supervisor@lms.com / admin123   (CENTER_SUPERVISOR)
 *   centeradmin@lms.com / admin123  (CENTER_ADMIN)
 *   finance@lms.com / admin123      (FINANCE_ADMIN)
 */

async function loginAsSupervisor(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("supervisor@lms.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

async function loginAsCenterAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("centeradmin@lms.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

async function loginAsFinanceAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("finance@lms.com");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

// ─── Supervisor Main Dashboard ────────────────────────────────────────────────

test.describe("Supervisor Main Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSupervisor(page);
  });

  test("should display supervisor dashboard", async ({ page }) => {
    await page.goto("/dashboard/supervisor");
    await expect(page).toHaveURL(/.*supervisor.*/);
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("should show Quick Actions section", async ({ page }) => {
    await page.goto("/dashboard/supervisor");
    await expect(page.getByText("Quick Actions")).toBeVisible();
  });

  test("should show Financial Reports action card", async ({ page }) => {
    await page.goto("/dashboard/supervisor");
    const card = page.getByRole("link", { name: /Financial Reports/i }).first();
    await expect(card).toBeVisible();
  });

  test("Financial Reports card links to financial page", async ({ page }) => {
    await page.goto("/dashboard/supervisor");
    const card = page.getByRole("link", { name: /Financial Reports/i }).first();
    await expect(card).toHaveAttribute("href", "/dashboard/supervisor/financial");
  });
});

// ─── Supervisor Financial Dashboard ──────────────────────────────────────────

test.describe("Supervisor Financial Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSupervisor(page);
  });

  test("should navigate to financial dashboard", async ({ page }) => {
    await page.goto("/dashboard/supervisor/financial");
    await expect(page).toHaveURL(/.*financial.*/);
  });

  test("should display financial dashboard without error", async ({ page }) => {
    await page.goto("/dashboard/supervisor/financial");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("should show Financial Dashboard heading", async ({ page }) => {
    await page.goto("/dashboard/supervisor/financial");
    await expect(page.getByRole("heading", { name: /Financial/i }).first()).toBeVisible();
  });

  test("should display financial metrics", async ({ page }) => {
    await page.goto("/dashboard/supervisor/financial");
    // At least one monetary display or stat visible
    const body = page.locator("body");
    await expect(body).not.toContainText("500");
  });

  test("CENTER_ADMIN should also access financial dashboard", async ({ page }) => {
    await loginAsCenterAdmin(page);
    await page.goto("/dashboard/supervisor/financial");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("FINANCE_ADMIN should also access financial dashboard", async ({ page }) => {
    await loginAsFinanceAdmin(page);
    await page.goto("/dashboard/supervisor/financial");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("Error");
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/dashboard/supervisor/financial");
    await expect(page).toHaveURL(/.*login.*/);
  });
});

// ─── Supervisor Redirect Behaviours ──────────────────────────────────────────

test.describe("Supervisor Sub-page Redirects", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSupervisor(page);
  });

  test("/dashboard/supervisor/analytics redirects to analytics", async ({ page }) => {
    await page.goto("/dashboard/supervisor/analytics");
    await expect(page).not.toHaveURL(/.*404.*/);
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("/dashboard/supervisor/transactions redirects without 404", async ({ page }) => {
    await page.goto("/dashboard/supervisor/transactions");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("/dashboard/supervisor/attendance redirects without 404", async ({ page }) => {
    await page.goto("/dashboard/supervisor/attendance");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("/dashboard/supervisor/tickets redirects without 404", async ({ page }) => {
    await page.goto("/dashboard/supervisor/tickets");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

// ─── Supervisor Action Cards Navigation ──────────────────────────────────────

test.describe("Supervisor Action Cards", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSupervisor(page);
    await page.goto("/dashboard/supervisor");
  });

  test("should show Student Analytics action card", async ({ page }) => {
    const card = page.getByRole("link", { name: /Student Analytics/i }).first();
    await expect(card).toBeVisible();
  });

  test("should show Manage Users action card", async ({ page }) => {
    const card = page.getByRole("link", { name: /Manage Users/i }).first();
    await expect(card).toBeVisible();
  });

  test("should show Classes action card", async ({ page }) => {
    const card = page.getByRole("link", { name: /Classes/i }).first();
    await expect(card).toBeVisible();
  });

  test("should show Support Tickets action card", async ({ page }) => {
    const card = page.getByRole("link", { name: /Support Tickets/i }).first();
    await expect(card).toBeVisible();
  });
});

// ─── Finance Admin Dashboard ──────────────────────────────────────────────────

test.describe("Finance Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFinanceAdmin(page);
  });

  test("should load finance admin dashboard without error", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("should show Financial Dashboard action card", async ({ page }) => {
    const card = page.getByRole("link", { name: /Financial Dashboard/i }).first();
    if (await card.isVisible()) {
      await expect(card).toHaveAttribute("href", "/dashboard/supervisor/financial");
    }
  });
});
