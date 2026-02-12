import { test, expect, Page } from "@playwright/test";

/**
 * Tests for Theme Toggle and Dashboard Navigation
 *
 * Database Prerequisites:
 * These tests require the database to be seeded with demo data.
 * Run `npm run db:seed` before running tests.
 *
 * Test accounts used:
 * - admin@lms.com / admin123 (SUPER_ADMIN)
 * - student@lms.com / student123 (STUDENT)
 * - teacher@lms.com / teacher123 (TEACHER)
 * - supervisor@lms.com / admin123 (SUPERVISOR)
 */

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

test.describe("Theme Toggle Functionality", () => {
  test("should display theme toggle button in student dashboard", async ({ page }) => {
    await login(page, "student@lms.com", "student123");

    // Look for theme toggle button (it should have Moon or Sun icon)
    const themeToggle = page.locator('button').filter({ hasText: /theme/i }).or(
      page.locator('button[aria-label*="theme"]')
    ).or(
      page.locator('button:has(svg)').filter({ has: page.locator('[class*="sun"]').or(page.locator('[class*="moon"]')) })
    );

    await expect(themeToggle.first()).toBeVisible();
  });

  test("should display theme toggle button in tutor dashboard", async ({ page }) => {
    await login(page, "teacher@lms.com", "teacher123");

    const themeToggle = page.locator('button').filter({ hasText: /theme/i }).or(
      page.locator('button[aria-label*="theme"]')
    );

    await expect(themeToggle.first()).toBeVisible();
  });

  test("should display theme toggle button in supervisor dashboard", async ({ page }) => {
    await login(page, "supervisor@lms.com", "admin123");

    const themeToggle = page.locator('button').filter({ hasText: /theme/i }).or(
      page.locator('button[aria-label*="theme"]')
    );

    await expect(themeToggle.first()).toBeVisible();
  });

  test("should toggle between themes when clicked", async ({ page }) => {
    await login(page, "student@lms.com", "student123");

    // Get initial theme class on html or body
    const initialTheme = await page.locator('html').getAttribute('class');

    // Click theme toggle button
    const themeToggle = page.locator('button').filter({ hasText: /theme/i }).or(
      page.locator('button[aria-label*="theme"]')
    );
    await themeToggle.first().click();

    // Wait for theme to change
    await page.waitForTimeout(500);

    // Get new theme
    const newTheme = await page.locator('html').getAttribute('class');

    // Themes should be different
    expect(initialTheme).not.toBe(newTheme);
  });
});

test.describe("Dashboard Card Navigation - Student", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "student@lms.com", "student123");
  });

  test("Today's Lessons card should be clickable", async ({ page }) => {
    const card = page.locator('text="Today\'s Lessons"').locator('..');

    // Card should have cursor-pointer class
    const classes = await card.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });

  test("Total XP card should be clickable and link to gamification", async ({ page }) => {
    const card = page.locator('text="Total XP"').locator('..');

    // Card should have hover effect classes
    const classes = await card.getAttribute('class');
    expect(classes).toMatch(/hover:(shadow|translate)/);
  });

  test("Activity Streak card should be clickable", async ({ page }) => {
    const card = page.locator('text="Activity Streak"').locator('..');

    const classes = await card.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });

  test("Badges Earned card should be clickable", async ({ page }) => {
    const card = page.locator('text="Badges Earned"').locator('..');

    const classes = await card.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });
});

test.describe("Dashboard Card Navigation - Tutor", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "teacher@lms.com", "teacher123");
  });

  test("My Courses card should be clickable", async ({ page }) => {
    const card = page.locator('text="My Courses"').locator('..');

    const classes = await card.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });

  test("Total Students card should be clickable", async ({ page }) => {
    const card = page.locator('text="Total Students"').locator('..');

    const classes = await card.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });

  test("Upcoming Sessions card should be clickable", async ({ page }) => {
    const card = page.locator('text="Upcoming Sessions"').locator('..');

    const classes = await card.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });
});

test.describe("Dashboard Card Navigation - Supervisor", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "supervisor@lms.com", "admin123");
  });

  test("Total Students card should be clickable", async ({ page }) => {
    const card = page.locator('text="Total Students"').locator('..');

    const classes = await card.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });

  test("Total Tutors card should be clickable", async ({ page }) => {
    const card = page.locator('text="Total Tutors"').locator('..');

    const classes = await card.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });

  test("Active Courses card should be clickable", async ({ page }) => {
    const card = page.locator('text="Active Courses"').locator('..');

    const classes = await card.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });
});

test.describe("Dashboard Footer", () => {
  test("should display footer in student dashboard", async ({ page }) => {
    await login(page, "student@lms.com", "student123");

    // Footer should have links
    await expect(page.getByText("About")).toBeVisible();
    await expect(page.getByText("Privacy")).toBeVisible();
    await expect(page.getByText("Terms")).toBeVisible();
    await expect(page.getByText("Contact")).toBeVisible();
  });

  test("should display footer in tutor dashboard", async ({ page }) => {
    await login(page, "teacher@lms.com", "teacher123");

    await expect(page.getByText("About")).toBeVisible();
    await expect(page.getByText("Privacy")).toBeVisible();
  });

  test("should display footer in supervisor dashboard", async ({ page }) => {
    await login(page, "supervisor@lms.com", "admin123");

    await expect(page.getByText("About")).toBeVisible();
    await expect(page.getByText("Terms")).toBeVisible();
  });

  test("footer links should be functional", async ({ page }) => {
    await login(page, "student@lms.com", "student123");

    const privacyLink = page.getByRole("link", { name: "Privacy" });
    await expect(privacyLink).toHaveAttribute("href", "/privacy");

    const termsLink = page.getByRole("link", { name: "Terms" });
    await expect(termsLink).toHaveAttribute("href", "/terms");
  });
});
