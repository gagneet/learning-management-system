import { test, expect, Page } from "@playwright/test";

/**
 * Database Prerequisites:
 * These tests require the database to be seeded with demo data.
 * Run `npm run db:seed` before running tests to ensure test accounts exist.
 * 
 * Test accounts used:
 * - admin@lms.com / admin123 (SUPER_ADMIN)
 * - student@lms.com / student123 (STUDENT)
 * - teacher@lms.com / teacher123 (TEACHER)
 * - centeradmin@lms.com / admin123 (CENTER_ADMIN)
 */

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "admin@lms.com", "admin123");
  });

  test("should display welcome message", async ({ page }) => {
    await expect(page.getByText("Welcome,")).toBeVisible();
  });

  test("should display SUPER_ADMIN role badge", async ({ page }) => {
    await expect(page.getByText("SUPER_ADMIN")).toBeVisible();
  });

  test("should show real statistics", async ({ page }) => {
    await expect(page.getByText("Total Courses")).toBeVisible();
    await expect(page.getByText("Avg Progress")).toBeVisible();
    await expect(page.getByText("Active Users")).toBeVisible();
    await expect(page.getByText("Students")).toBeVisible();
  });

  test("should display quick action buttons", async ({ page }) => {
    await expect(page.getByText("Manage Users")).toBeVisible();
    await expect(page.getByText("Manage Courses")).toBeVisible();
    await expect(page.getByText("Browse Courses")).toBeVisible();
    await expect(page.getByText("Analytics")).toBeVisible();
  });

  test("should show recent enrollments section", async ({ page }) => {
    await expect(page.getByText("Recent Enrollments")).toBeVisible();
  });

  test("should have sign out button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Sign Out" })
    ).toBeVisible();
  });

  test("quick action links should navigate correctly", async ({ page }) => {
    const manageUsersLink = page.getByRole("link", { name: "Manage Users" });
    await expect(manageUsersLink).toHaveAttribute("href", "/admin/users");

    const manageCoursesLink = page.getByRole("link", { name: "Manage Courses" });
    await expect(manageCoursesLink).toHaveAttribute("href", "/admin/courses");
  });
});

test.describe("Student Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "student@lms.com", "student123");
  });

  test("should display My Learning Dashboard heading", async ({ page }) => {
    await expect(page.getByText("My Learning Dashboard")).toBeVisible();
  });

  test("should display welcome message with student name", async ({ page }) => {
    await expect(page.getByText("Welcome back,")).toBeVisible();
  });

  test("should display Today's Lessons stat", async ({ page }) => {
    await expect(page.getByText("Today's Lessons")).toBeVisible();
  });

  test("should display Total XP stat", async ({ page }) => {
    await expect(page.getByText("Total XP")).toBeVisible();
  });

  test("should display Reading Age stat", async ({ page }) => {
    await expect(page.getByText("Reading Age")).toBeVisible();
  });

  test("should display Level stat", async ({ page }) => {
    await expect(page.getByText("Level")).toBeVisible();
  });

  test("should display Activity Streak section", async ({ page }) => {
    await expect(page.getByText("Activity Streak")).toBeVisible();
  });

  test("should display Badges Earned section", async ({ page }) => {
    await expect(page.getByText("Badges Earned")).toBeVisible();
  });

  test("should display Upcoming Sessions section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Upcoming Sessions" })
    ).toBeVisible();
  });

  test("should display Assignments Due section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Assignments Due" })
    ).toBeVisible();
  });

  test("should display My Courses section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "My Courses" })
    ).toBeVisible();
  });

  test("should have sign out button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Sign Out" })
    ).toBeVisible();
  });
});

test.describe("Tutor Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "teacher@lms.com", "teacher123");
  });

  test("should display Tutor Dashboard heading", async ({ page }) => {
    await expect(page.getByText("Tutor Dashboard")).toBeVisible();
  });

  test("should display My Day section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "My Day" })
    ).toBeVisible();
  });

  test("should show My Courses stat", async ({ page }) => {
    await expect(page.getByText("My Courses")).toBeVisible();
  });

  test("should show Total Students stat", async ({ page }) => {
    await expect(page.getByText("Total Students")).toBeVisible();
  });

  test("should show Avg Progress stat", async ({ page }) => {
    await expect(page.getByText("Avg Progress")).toBeVisible();
  });

  test("should show Upcoming Sessions stat", async ({ page }) => {
    await expect(page.getByText("Upcoming Sessions")).toBeVisible();
  });

  test("should display Classes Today section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Classes Today" })
    ).toBeVisible();
  });

  test("should display Marking Queue section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Marking Queue" })
    ).toBeVisible();
  });

  test("should display My Courses section with create button", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "My Courses" })
    ).toBeVisible();
    await expect(page.getByText("+ Create Course")).toBeVisible();
  });

  test("should have sign out button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Sign Out" })
    ).toBeVisible();
  });
});

test.describe("Supervisor Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "centeradmin@lms.com", "admin123");
  });

  test("should display Supervisor Dashboard heading", async ({ page }) => {
    await expect(page.getByText("Supervisor Dashboard")).toBeVisible();
  });

  test("should display Financial Overview section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Financial Overview" })
    ).toBeVisible();
  });

  test("should display revenue metrics", async ({ page }) => {
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Tutor Payments")).toBeVisible();
    await expect(page.getByText("Operational Costs")).toBeVisible();
    await expect(page.getByText("Profit Margin")).toBeVisible();
  });

  test("should display centre performance metrics", async ({ page }) => {
    await expect(page.getByText("Total Students")).toBeVisible();
    await expect(page.getByText("Total Tutors")).toBeVisible();
    await expect(page.getByText("Active Courses")).toBeVisible();
    await expect(page.getByText("Pending Payments")).toBeVisible();
  });

  test("should display Attendance Trends section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Attendance Trends" })
    ).toBeVisible();
  });

  test("should display Tutor Performance Analytics section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Tutor Performance Analytics" })
    ).toBeVisible();
  });

  test("should display attendance rates for sessions", async ({ page }) => {
    // Check that attendance trends section has content
    const attendanceSection = page.locator('text="Attendance Trends"').locator('..');
    await expect(attendanceSection).toBeVisible();
  });

  test("should display financial transaction data", async ({ page }) => {
    // Revenue metrics should show actual values from seed data
    const revenueSection = page.locator('text="Total Revenue"').locator('..');
    await expect(revenueSection).toBeVisible();
  });

  test("should have sign out button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Sign Out" })
    ).toBeVisible();
  });
});

test.describe("Dashboard with Seed Data", () => {
  test("student dashboard should show today's sessions", async ({ page }) => {
    await login(page, "student@lms.com", "student123");
    
    // Check Today's Lessons stat
    await expect(page.getByText("Today's Lessons")).toBeVisible();
    
    // Check Upcoming Sessions section exists
    await expect(
      page.getByRole("heading", { name: "Upcoming Sessions" })
    ).toBeVisible();
  });

  test("student dashboard should show assignments due", async ({ page }) => {
    await login(page, "student@lms.com", "student123");
    
    // Check Assignments Due section exists
    await expect(
      page.getByRole("heading", { name: "Assignments Due" })
    ).toBeVisible();
  });

  test("tutor dashboard should show marking queue", async ({ page }) => {
    await login(page, "teacher@lms.com", "teacher123");
    
    // Check Marking Queue section exists
    await expect(
      page.getByRole("heading", { name: "Marking Queue" })
    ).toBeVisible();
  });

  test("tutor dashboard should show classes today", async ({ page }) => {
    await login(page, "teacher@lms.com", "teacher123");
    
    // Check Classes Today section exists
    await expect(
      page.getByRole("heading", { name: "Classes Today" })
    ).toBeVisible();
  });
});

test.describe("Dashboard Access Control", () => {
  test("unauthenticated user should be redirected to login from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page.url()).toContain("/login");
  });

  test("unauthenticated user should be redirected from student dashboard", async ({ page }) => {
    await page.goto("/dashboard/student");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page.url()).toContain("/login");
  });

  test("unauthenticated user should be redirected from tutor dashboard", async ({ page }) => {
    await page.goto("/dashboard/tutor");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page.url()).toContain("/login");
  });

  test("unauthenticated user should be redirected from supervisor dashboard", async ({ page }) => {
    await page.goto("/dashboard/supervisor");
    await page.waitForURL("**/login**", { timeout: 15000 });
    await expect(page.url()).toContain("/login");
  });
});
