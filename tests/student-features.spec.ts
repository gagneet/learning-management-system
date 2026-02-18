import { test, expect, Page } from "@playwright/test";

/**
 * Student Feature Pages Tests
 * Tests for Phase 1 student features: goals, homework, awards, gamification
 *
 * Prerequisites: npm run db:seed (demo data must exist)
 * Accounts: student@lms.com / student123
 */

async function loginAsStudent(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("student@lms.com");
  await page.getByLabel("Password").fill("student123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

test.describe("Student Goals Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to goals page", async ({ page }) => {
    await page.goto("/dashboard/student/goals");
    await expect(page).toHaveURL(/.*goals.*/);
  });

  test("should display goals page without error", async ({ page }) => {
    await page.goto("/dashboard/student/goals");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Student Homework Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to homework page", async ({ page }) => {
    await page.goto("/dashboard/student/homework");
    await expect(page).toHaveURL(/.*homework.*/);
  });

  test("should display homework tracker without error", async ({ page }) => {
    await page.goto("/dashboard/student/homework");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Student Awards Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to awards page", async ({ page }) => {
    await page.goto("/dashboard/student/awards");
    await expect(page).toHaveURL(/.*awards.*/);
  });

  test("should display awards without error", async ({ page }) => {
    await page.goto("/dashboard/student/awards");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Student Gamification Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to gamification page", async ({ page }) => {
    await page.goto("/dashboard/student/gamification");
    await expect(page).toHaveURL(/.*gamification.*/);
  });

  test("should display gamification stats without error", async ({ page }) => {
    await page.goto("/dashboard/student/gamification");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Student Achievements Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to achievements page", async ({ page }) => {
    await page.goto("/dashboard/student/achievements");
    await expect(page).toHaveURL(/.*achievements.*/);
  });

  test("should display achievements without error", async ({ page }) => {
    await page.goto("/dashboard/student/achievements");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Student Sessions Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to sessions page", async ({ page }) => {
    await page.goto("/dashboard/student/sessions");
    await expect(page).toHaveURL(/.*sessions.*/);
  });

  test("should display sessions without error", async ({ page }) => {
    await page.goto("/dashboard/student/sessions");
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Student Dashboard Quick Actions", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/dashboard/student");
  });

  test("should display Quick Actions section", async ({ page }) => {
    await expect(page.getByText("Quick Actions")).toBeVisible();
  });

  test("should show Browse Courses action", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Browse Courses/i }).first()).toBeVisible();
  });

  test("should show Homework action", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Homework/i }).first()).toBeVisible();
  });

  test("should show My Goals action", async ({ page }) => {
    await expect(page.getByRole("link", { name: /My Goals/i }).first()).toBeVisible();
  });

  test("Browse Courses should link to /courses", async ({ page }) => {
    const coursesLink = page.getByRole("link", { name: /Browse Courses/i }).first();
    await expect(coursesLink).toHaveAttribute("href", "/courses");
  });

  test("Homework link should point to homework page", async ({ page }) => {
    const hwLink = page.getByRole("link", { name: /Homework/i }).first();
    await expect(hwLink).toHaveAttribute("href", "/dashboard/student/homework");
  });
});

test.describe("Student Help Request Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to help request page", async ({ page }) => {
    await page.goto("/dashboard/student/help");
    await expect(page).toHaveURL(/.*student\/help.*/);
  });

  test("should display help request form", async ({ page }) => {
    await page.goto("/dashboard/student/help");
    await expect(page.getByText("Request Help")).toBeVisible();
    await expect(page.getByText("New Help Request")).toBeVisible();
  });

  test("should display priority selector", async ({ page }) => {
    await page.goto("/dashboard/student/help");
    await expect(page.locator("select")).toBeVisible();
  });

  test("should display submit button", async ({ page }) => {
    await page.goto("/dashboard/student/help");
    await expect(page.getByRole("button", { name: /Submit Help Request/i })).toBeVisible();
  });

  test("should be accessible from Request Help action card", async ({ page }) => {
    await page.goto("/dashboard/student");
    const helpLink = page.getByRole("link", { name: /Request Help/i }).first();
    if (await helpLink.isVisible()) {
      await expect(helpLink).toHaveAttribute("href", "/dashboard/student/help");
    }
  });
});

test.describe("Student Chat Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to chat page", async ({ page }) => {
    await page.goto("/dashboard/student/chat");
    await expect(page).toHaveURL(/.*chat.*/);
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("User Profile and Settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should navigate to profile page", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await expect(page).toHaveURL(/.*profile.*/);
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("should navigate to settings page", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page).toHaveURL(/.*settings.*/);
    await expect(page.locator("body")).not.toContainText("500");
    await expect(page.locator("body")).not.toContainText("404");
  });
});
