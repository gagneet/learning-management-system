import { test, expect } from "@playwright/test";

test.describe("Live Session Tracking", () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher
    await page.goto("/login");
    await page.fill('input[name="email"]', "teacher@lms.com");
    await page.fill('input[name="password"]', "teacher123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("Teacher can view live session control center and student metrics", async ({ page }) => {
    // Navigate to My Day
    await page.goto("/dashboard/tutor/my-day");
    await expect(page.locator("h1")).toContainText("Good day");

    // Click on a session (assuming seed data has one)
    const sessionCard = page.locator('a[href*="/dashboard/tutor/sessions/"]').first();
    await sessionCard.click();

    // Check for control center elements
    await expect(page.locator("text=Time Online")).toBeVisible();
    await expect(page.locator("text=Currently Working On")).toBeVisible();

    // Select a student
    await page.locator('button:has-text("VIEW WHITEBOARD")').first().click();

    // Check sidebar tabs
    await expect(page.locator("text=Activity Time Analysis")).toBeVisible();
  });
});
