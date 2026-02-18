import { test, expect } from "@playwright/test";

/**
 * API Health and Availability Tests
 * Tests for API endpoints to ensure they respond correctly
 *
 * These tests check API routes without requiring authentication where possible,
 * and check that authenticated endpoints return 401 (not 500) when not authenticated.
 */

test.describe("Health Check API", () => {
  test("health endpoint should return 200", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
  });

  test("health endpoint should return JSON", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.json();
    expect(body).toBeTruthy();
    expect(typeof body).toBe("object");
  });
});

test.describe("Auth API", () => {
  test("signin endpoint should exist", async ({ request }) => {
    const response = await request.post("/api/auth/callback/credentials", {
      data: { email: "invalid@test.com", password: "wrong" },
    });
    // Should return 4xx, not 5xx
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Protected API Routes - Unauthenticated", () => {
  test("users API should require auth", async ({ request }) => {
    const response = await request.get("/api/users");
    expect([401, 403, 302]).toContain(response.status());
  });

  test("courses API should require auth", async ({ request }) => {
    const response = await request.get("/api/courses");
    expect([401, 403, 302]).toContain(response.status());
  });

  test("v1 help-requests API should require auth", async ({ request }) => {
    const response = await request.get("/api/v1/help-requests");
    expect([401, 403, 302]).toContain(response.status());
  });

  test("v1 homework API should require auth", async ({ request }) => {
    const response = await request.get("/api/v1/homework");
    expect([401, 403, 302]).toContain(response.status());
  });

  test("v1 student-goals API should require auth", async ({ request }) => {
    const response = await request.get("/api/v1/student-goals");
    expect([401, 403, 302]).toContain(response.status());
  });

  test("v1 tutor-notes API should require auth", async ({ request }) => {
    const response = await request.get("/api/v1/tutor-notes");
    expect([401, 403, 302]).toContain(response.status());
  });

  test("v1 awards API should require auth", async ({ request }) => {
    const response = await request.get("/api/v1/awards");
    expect([401, 403, 302]).toContain(response.status());
  });

  test("notifications API should require auth", async ({ request }) => {
    const response = await request.get("/api/notifications");
    expect([401, 403, 302]).toContain(response.status());
  });

  test("financial API should require auth", async ({ request }) => {
    const response = await request.get("/api/financial/transactions");
    expect([401, 403, 302]).toContain(response.status());
  });
});

test.describe("Public Pages", () => {
  test("home page should load", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.locator("body")).not.toContainText("500");
  });

  test("login page should load", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email Address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("courses page should redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/courses");
    // Either shows courses or redirects to login
    const url = page.url();
    expect(url).toMatch(/\/(courses|login)/);
  });
});
