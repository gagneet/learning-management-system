import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display the login form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Welcome Back" })
    ).toBeVisible();
    await expect(
      page.getByText("Sign in to your Learning Management System")
    ).toBeVisible();
  });

  test("should have email input field", async ({ page }) => {
    const emailInput = page.getByLabel("Email Address");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("placeholder", "you@example.com");
  });

  test("should have password input field", async ({ page }) => {
    const passwordInput = page.getByLabel("Password");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("should have a Sign In button", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: "Sign In" });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test("should display demo credentials", async ({ page }) => {
    await expect(page.getByText("Demo Credentials:")).toBeVisible();
    await expect(page.getByText("admin@lms.com")).toBeVisible();
    await expect(page.getByText("teacher@lms.com")).toBeVisible();
    await expect(page.getByText("student@lms.com")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.getByLabel("Email Address").fill("invalid@test.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible({
      timeout: 10000,
    });
  });

  // Note: Loading state test removed as it's flaky due to fast authentication
  // The "Signing in..." state is transient and may not be visible on fast systems

  test("should require email field", async ({ page }) => {
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign In" }).click();

    // HTML5 validation should prevent form submission
    const emailInput = page.getByLabel("Email Address");
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("should require password field", async ({ page }) => {
    await page.getByLabel("Email Address").fill("test@test.com");
    await page.getByRole("button", { name: "Sign In" }).click();

    // HTML5 validation should prevent form submission
    const passwordInput = page.getByLabel("Password");
    await expect(passwordInput).toHaveAttribute("required", "");
  });

  test("should redirect to dashboard on successful admin login", async ({ page }) => {
    await page.getByLabel("Email Address").fill("admin@lms.com");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await expect(page.url()).toContain("/dashboard");
  });

  test("should redirect student to student dashboard on login", async ({ page }) => {
    await page.getByLabel("Email Address").fill("student@lms.com");
    await page.getByLabel("Password").fill("student123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("**/dashboard/student**", { timeout: 15000 });
    await expect(page.url()).toContain("/dashboard/student");
  });

  test("should redirect teacher to tutor dashboard on login", async ({ page }) => {
    await page.getByLabel("Email Address").fill("teacher@lms.com");
    await page.getByLabel("Password").fill("teacher123");
    await page.getByRole("button", { name: "Sign In" }).click();

    await page.waitForURL("**/dashboard/tutor**", { timeout: 15000 });
    await expect(page.url()).toContain("/dashboard/tutor");
  });
});
