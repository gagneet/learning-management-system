import { test, expect, Page } from "@playwright/test";

/**
 * Navigation Redirects Tests
 * Verifies that all navigation action card links resolve to valid pages
 * (no 404s) - either the target page or a valid redirect destination.
 *
 * Prerequisites: npm run db:seed
 */

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

test.describe("Supervisor Navigation Redirects", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "centeradmin@lms.com", "admin123");
  });

  const supervisorLinks = [
    { name: "Financial Reports", path: "/dashboard/supervisor/financial" },
    { name: "Student Analytics", path: "/dashboard/supervisor/analytics" },
    { name: "Attendance", path: "/dashboard/supervisor/attendance" },
    { name: "Tutor Performance", path: "/dashboard/supervisor/tutors" },
    { name: "Transactions", path: "/dashboard/supervisor/transactions" },
  ];

  for (const link of supervisorLinks) {
    test(`${link.name} link should resolve without 404`, async ({ page }) => {
      await page.goto(link.path);
      // Should redirect to a valid page (supervisor dashboard or admin analytics)
      await expect(page.locator("body")).not.toContainText("404");
      await expect(page.locator("body")).not.toContainText("This page could not be found");
      await expect(page.locator("body")).not.toContainText("500");
    });
  }

  test("Manage Users link should work directly", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("500");
  });
});

test.describe("Finance Admin Navigation Redirects", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "finance@lms.com", "admin123");
  });

  const financeLinks = [
    "/dashboard/supervisor/financial",
    "/dashboard/supervisor/transactions",
    "/dashboard/supervisor/reports",
    "/dashboard/supervisor/fees",
    "/dashboard/supervisor/tutor-payments",
    "/dashboard/supervisor/budget",
  ];

  for (const path of financeLinks) {
    test(`${path} should resolve without 404`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("404");
      await expect(page.locator("body")).not.toContainText("500");
    });
  }
});

test.describe("Parent Navigation Redirects", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "parent1@lms.com", "admin123");
  });

  const parentLinks = [
    "/dashboard/parent/progress",
    "/dashboard/parent/sessions",
    "/dashboard/parent/homework",
    "/dashboard/parent/achievements",
    "/dashboard/parent/payments",
    "/dashboard/parent/messages",
  ];

  for (const path of parentLinks) {
    test(`${path} should redirect to parent dashboard`, async ({ page }) => {
      await page.goto(path);
      // Should redirect to parent dashboard
      await expect(page.url()).toContain("/dashboard/parent");
      await expect(page.locator("body")).not.toContainText("404");
      await expect(page.locator("body")).not.toContainText("500");
    });
  }
});

test.describe("Super Admin Navigation Redirects", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@lms.com", "admin123");
  });

  test("/admin/centers should redirect to /admin/users", async ({ page }) => {
    await page.goto("/admin/centers");
    await expect(page.url()).toContain("/admin/users");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("/admin/settings should redirect to settings page", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.url()).toContain("/settings");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("/admin/awards should redirect to analytics", async ({ page }) => {
    await page.goto("/admin/awards");
    await expect(page.url()).toContain("/admin/analytics");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("/admin/users should work directly", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("/admin/courses should work directly", async ({ page }) => {
    await page.goto("/admin/courses");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("/admin/analytics should work directly", async ({ page }) => {
    await page.goto("/admin/analytics");
    await expect(page.locator("body")).not.toContainText("404");
    await expect(page.locator("body")).not.toContainText("500");
  });
});
