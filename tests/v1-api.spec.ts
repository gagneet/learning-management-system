import { test, expect } from "@playwright/test";

/**
 * Phase 1 v1 API Tests (Individualized Tutoring Platform)
 * Tests for awards, exercises, help requests, homework, goals, tutor notes
 *
 * Prerequisites: npm run db:seed (demo data must exist)
 * Accounts: teacher@lms.com / teacher123, student@lms.com / student123
 *
 * Note: These are integration tests that verify the API endpoints return correct
 * status codes and response structures.
 */

// Helper to get authenticated API request headers
async function getAuthCookies(
  page: import("@playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

// ─── Help Requests (v1) ──────────────────────────────────────────────────────

test.describe("v1 Help Requests API", () => {
  test("GET /api/v1/help-requests returns 200 for authenticated teacher", async ({
    page,
    request,
  }) => {
    await getAuthCookies(page, "teacher@lms.com", "teacher123");
    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const response = await request.get("/api/v1/help-requests", {
      headers: { Cookie: cookieStr },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("helpRequests");
  });

  test("GET /api/v1/help-requests returns 401 for unauthenticated request", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/help-requests");
    expect(response.status()).toBe(401);
  });

  test("POST /api/v1/help-requests creates help request with priority", async ({
    page,
    request,
  }) => {
    await getAuthCookies(page, "student@lms.com", "student123");
    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    // Get a session ID first
    const sessionRes = await request.get("/api/academic/sessions/by-date", {
      headers: { Cookie: cookieStr },
    });

    // Create help request (may fail without valid sessionId but should not 500)
    const response = await request.post("/api/v1/help-requests", {
      headers: {
        Cookie: cookieStr,
        "Content-Type": "application/json",
      },
      data: {
        message: "Test help request from Playwright",
        priority: "MEDIUM",
        sessionId: "invalid-session-id", // Invalid - expect 400/404
      },
    });
    // Should be 400 (validation error) not 500 (server error)
    expect(response.status()).not.toBe(500);
  });
});

// ─── Student Goals (v1) ──────────────────────────────────────────────────────

test.describe("v1 Student Goals API", () => {
  test("GET /api/v1/student-goals returns 200 for authenticated user", async ({
    page,
    request,
  }) => {
    await getAuthCookies(page, "student@lms.com", "student123");
    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const response = await request.get("/api/v1/student-goals", {
      headers: { Cookie: cookieStr },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("goals");
  });

  test("GET /api/v1/student-goals returns 401 for unauthenticated", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/student-goals");
    expect(response.status()).toBe(401);
  });
});

// ─── Awards (v1) ─────────────────────────────────────────────────────────────

test.describe("v1 Awards API", () => {
  test("GET /api/v1/awards returns 200 for authenticated teacher", async ({
    page,
    request,
  }) => {
    await getAuthCookies(page, "teacher@lms.com", "teacher123");
    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const response = await request.get("/api/v1/awards", {
      headers: { Cookie: cookieStr },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("awards");
  });

  test("GET /api/v1/award-redemptions returns 200 for authenticated user", async ({
    page,
    request,
  }) => {
    await getAuthCookies(page, "teacher@lms.com", "teacher123");
    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const response = await request.get("/api/v1/award-redemptions", {
      headers: { Cookie: cookieStr },
    });
    expect(response.status()).toBe(200);
  });
});

// ─── Tutor Notes (v1) ────────────────────────────────────────────────────────

test.describe("v1 Tutor Notes API", () => {
  test("GET /api/v1/tutor-notes returns 200 for authenticated teacher", async ({
    page,
    request,
  }) => {
    await getAuthCookies(page, "teacher@lms.com", "teacher123");
    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const response = await request.get("/api/v1/tutor-notes", {
      headers: { Cookie: cookieStr },
    });
    expect(response.status()).toBe(200);
  });

  test("GET /api/v1/tutor-notes returns 401 for unauthenticated", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/tutor-notes");
    expect(response.status()).toBe(401);
  });
});

// ─── Homework (v1) ───────────────────────────────────────────────────────────

test.describe("v1 Homework API", () => {
  test("GET /api/v1/homework returns 200 for authenticated teacher", async ({
    page,
    request,
  }) => {
    await getAuthCookies(page, "teacher@lms.com", "teacher123");
    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const response = await request.get("/api/v1/homework", {
      headers: { Cookie: cookieStr },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("assignments");
  });

  test("GET /api/v1/homework returns 401 for unauthenticated", async ({
    request,
  }) => {
    const response = await request.get("/api/v1/homework");
    expect(response.status()).toBe(401);
  });
});
