import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the AetherLearn branding", async ({ page }) => {
    await expect(page.locator("nav")).toContainText("AetherLearn");
  });

  test("should display the main heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Learning Management System" })
    ).toBeVisible();
  });

  test("should have a Sign In button in the navigation", async ({ page }) => {
    const signInLink = page.locator("nav").getByRole("link", { name: "Sign In" });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/login");
  });

  test("should display Student login portal", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Students" })
    ).toBeVisible();
    await expect(page.getByText("Student Login")).toBeVisible();
  });

  test("should display Parent login portal", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Parents" })
    ).toBeVisible();
    await expect(page.getByText("Parent Login")).toBeVisible();
  });

  test("should display Tutor login portal", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Tutors" })
    ).toBeVisible();
    await expect(page.getByText("Tutor Login")).toBeVisible();
  });

  test("all login portal cards should link to /login", async ({ page }) => {
    const portalLinks = page.locator('a[href="/login"]');
    // Nav Sign In + 3 portal cards = at least 4 links to /login
    await expect(portalLinks).toHaveCount(4);
  });

  test("should display feature highlights", async ({ page }) => {
    await expect(page.getByText("Multi-Centre Support")).toBeVisible();
    await expect(page.getByText("Role-Based Access")).toBeVisible();
    await expect(page.getByText("Academic Intelligence")).toBeVisible();
  });

  test("should display key features section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Key Features" })
    ).toBeVisible();
    await expect(page.getByText("Course Management")).toBeVisible();
    await expect(page.getByText("Gamification")).toBeVisible();
    await expect(page.getByText("Live Sessions")).toBeVisible();
    await expect(page.getByText("Financial Tracking")).toBeVisible();
  });

  test("should display footer", async ({ page }) => {
    await expect(page.locator("footer")).toContainText("AetherLearn");
  });

  test("Student portal card should navigate to login page", async ({ page }) => {
    await page.getByText("Student Login").click();
    await expect(page).toHaveURL("/login");
  });

  test("Parent portal card should navigate to login page", async ({ page }) => {
    await page.getByText("Parent Login").click();
    await expect(page).toHaveURL("/login");
  });

  test("Tutor portal card should navigate to login page", async ({ page }) => {
    await page.getByText("Tutor Login").click();
    await expect(page).toHaveURL("/login");
  });
});
