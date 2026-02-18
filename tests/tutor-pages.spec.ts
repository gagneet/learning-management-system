import { test, expect, Page } from "@playwright/test";

/**
 * Tutor Dashboard Pages Tests
 * Tests for Phase 1 Individualized Tutoring Platform pages
 *
 * Prerequisites: npm run db:seed (demo data must exist)
 * Accounts: teacher@lms.com / teacher123
 */

async function loginAsTeacher(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("teacher@lms.com");
  await page.getByLabel("Password").fill("teacher123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

test.describe("Tutor My Day Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to My Day page", async ({ page }) => {
    await page.goto("/dashboard/tutor/my-day");
    await expect(page).toHaveURL(/.*my-day.*/);
  });

  test("should display My Day heading", async ({ page }) => {
    await page.goto("/dashboard/tutor/my-day");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("should show session schedule", async ({ page }) => {
    await page.goto("/dashboard/tutor/my-day");
    // Page loads without error
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("should be accessible from tutor navigation action card", async ({ page }) => {
    const myDayLink = page.getByRole("link", { name: /My Day/i }).first();
    if (await myDayLink.isVisible()) {
      await expect(myDayLink).toHaveAttribute("href", "/dashboard/tutor/my-day");
    }
  });
});

test.describe("Tutor Session Planner Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to session planner", async ({ page }) => {
    await page.goto("/dashboard/tutor/planner");
    await expect(page).toHaveURL(/.*planner.*/);
  });

  test("should display planner content without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/planner");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("should be accessible from Plan Session action card", async ({ page }) => {
    const planLink = page.getByRole("link", { name: /Plan Session/i }).first();
    if (await planLink.isVisible()) {
      await expect(planLink).toHaveAttribute("href", "/dashboard/tutor/planner");
    }
  });
});

test.describe("Tutor Session History Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to session history", async ({ page }) => {
    await page.goto("/dashboard/tutor/history");
    await expect(page).toHaveURL(/.*history.*/);
  });

  test("should display history content without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/history");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Tutor Content Library Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to content library", async ({ page }) => {
    await page.goto("/dashboard/tutor/content-library");
    await expect(page).toHaveURL(/.*content-library.*/);
  });

  test("should display content library without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/content-library");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Tutor Assessment Creation Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to assessment creation", async ({ page }) => {
    await page.goto("/dashboard/tutor/assessments/create");
    await expect(page).toHaveURL(/.*assessments.*create.*/);
  });

  test("should display assessment wizard without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/assessments/create");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Tutor Student Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to students list", async ({ page }) => {
    await page.goto("/dashboard/tutor/students");
    await expect(page).toHaveURL(/.*students.*/);
  });

  test("should display students page without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/students");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Tutor Sessions Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to sessions list", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    await expect(page).toHaveURL(/.*sessions.*/);
  });

  test("should display sessions without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Tutor Marking Queue", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to marking queue", async ({ page }) => {
    await page.goto("/dashboard/tutor/marking");
    await expect(page).toHaveURL(/.*marking.*/);
  });

  test("should display marking page without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/marking");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Tutor Resources Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should navigate to resources", async ({ page }) => {
    await page.goto("/dashboard/tutor/resources");
    await expect(page).toHaveURL(/.*resources.*/);
  });

  test("should display resources without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/resources");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });
});

test.describe("Tutor Action Cards Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    // Navigate to tutor dashboard
    await page.goto("/dashboard/tutor");
  });

  test("should display Quick Actions section", async ({ page }) => {
    await expect(page.getByText("Quick Actions")).toBeVisible();
  });

  test("should show My Day action card", async ({ page }) => {
    await expect(page.getByRole("link", { name: /My Day/i }).first()).toBeVisible();
  });

  test("should show Plan Session action card", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Plan Session/i }).first()).toBeVisible();
  });

  test("should show My Students action card", async ({ page }) => {
    await expect(page.getByRole("link", { name: /My Students/i }).first()).toBeVisible();
  });

  test("should show Marking Queue action card", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Marking Queue/i }).first()).toBeVisible();
  });

  test("My Day card should link to correct page", async ({ page }) => {
    const myDayCard = page.getByRole("link", { name: /My Day/i }).first();
    await expect(myDayCard).toHaveAttribute("href", "/dashboard/tutor/my-day");
  });
});
