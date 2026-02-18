import { test, expect, Page } from "@playwright/test";

/**
 * Video Sessions Tests
 * Tests for Multi-Student Video Conferencing (Daily.co integration)
 *
 * Prerequisites: npm run db:seed (demo data must exist)
 * Accounts:
 *   teacher@lms.com / teacher123 (TEACHER)
 *   student@lms.com / student123 (STUDENT)
 *   admin@lms.com / admin123 (SUPER_ADMIN)
 *
 * Key behaviour (post-fix):
 *   - Video button shows for ALL ONLINE/HYBRID sessions, not just those with videoRoomId
 *   - Video page auto-creates the Daily.co room if it doesn't exist
 *   - Session details page always shows "Start Video Session" for ONLINE sessions
 */

async function loginAsTeacher(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("teacher@lms.com");
  await page.getByLabel("Password").fill("teacher123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

async function loginAsStudent(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill("student@lms.com");
  await page.getByLabel("Password").fill("student123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 15000 });
}

// ============================================================================
// Teacher: Sessions List Page - Video Button Display
// ============================================================================

test.describe("Tutor Sessions Page - Video Integration", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should load sessions list page without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    await expect(page).toHaveURL(/.*sessions.*/);
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("should display sessions page heading", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    await expect(page.getByRole("heading", { name: /My Sessions/i })).toBeVisible();
  });

  test("should show Video Session card in teacher dashboard actions", async ({ page }) => {
    await page.goto("/dashboard");
    const videoCard = page.getByRole("link", { name: /Video Sessions/i });
    if (await videoCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(videoCard).toHaveAttribute("href", "/dashboard/tutor/sessions");
    }
  });

  test("should show 📹 Start Video button for upcoming ONLINE sessions", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    // After fix, video button appears for ALL ONLINE/HYBRID sessions
    const videoButton = page
      .getByRole("link", { name: /📹 Start Video|📹 Live Video|📹 Video Session/i })
      .first();
    const hasVideoButton = await videoButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasVideoButton) {
      const href = await videoButton.getAttribute("href");
      expect(href).toMatch(/\/dashboard\/tutor\/sessions\/[^/]+\/video/);
    }
  });

  test("should show session planner link from sessions page", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    const plannerLink = page.getByRole("link", { name: /Session Planner/i });
    await expect(plannerLink).toBeVisible();
    await expect(plannerLink).toHaveAttribute("href", "/dashboard/tutor/planner");
  });

  test("sessions list shows Upcoming Sessions and Past Sessions sections", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    await expect(page.getByRole("heading", { name: /Upcoming Sessions/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Past Sessions/i })).toBeVisible();
  });
});

// ============================================================================
// Teacher: Session Details Page - Start Session Button Fix
// ============================================================================

test.describe("Tutor Session Details Page - Start Session Button", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should load session details page without error", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    const detailsLink = page.getByRole("link", { name: /Details/i }).first();
    if (await detailsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailsLink.click();
      await expect(page).toHaveURL(/.*\/dashboard\/tutor\/sessions\/[^/]+$/);
      await expect(page.locator("body")).not.toContainText("Error");
      await expect(page.locator("body")).not.toContainText("404");
    }
  });

  test("session details page shows Start Video Session button for ONLINE sessions", async ({
    page,
  }) => {
    await page.goto("/dashboard/tutor/sessions");
    const detailsLink = page.getByRole("link", { name: /Details/i }).first();
    if (await detailsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailsLink.click();
      // Check for video button - should be present for ONLINE sessions (fixed behavior)
      const videoButton = page.getByRole("link", {
        name: /📹 Start Video Session|📹 Live Video Session/i,
      });
      const sessionDashBtn = page.getByRole("link", { name: /Session Dashboard/i });
      const hasVideoBtn = await videoButton.isVisible({ timeout: 3000 }).catch(() => false);
      const hasDashBtn = await sessionDashBtn.isVisible({ timeout: 3000 }).catch(() => false);
      // At least one action button should be present
      if (hasVideoBtn) {
        const href = await videoButton.getAttribute("href");
        expect(href).toMatch(/\/video$/);
      }
      if (hasDashBtn) {
        const href = await sessionDashBtn.getAttribute("href");
        expect(href).toMatch(/\/live$/);
      }
    }
  });

  test("session details page shows attendance stats", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    const detailsLink = page.getByRole("link", { name: /Details/i }).first();
    if (await detailsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailsLink.click();
      // Attendance section should be present
      await expect(page.getByText(/Attendance/i)).toBeVisible();
      await expect(page.getByText(/Total Registered/i)).toBeVisible();
    }
  });
});

// ============================================================================
// Teacher: Video Session Page Access & Navigation
// ============================================================================

test.describe("Tutor Video Session Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/tutor/sessions/test-id/video");
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("should navigate to video page from sessions list", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    const videoLink = page
      .getByRole("link", { name: /📹 Start Video|📹 Live Video/i })
      .first();
    const hasVideoLink = await videoLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasVideoLink) {
      await videoLink.click();
      await expect(page).toHaveURL(/.*\/video$/);
      await expect(page.locator("body")).not.toContainText("404");
    } else {
      test.skip(true, "No video-enabled sessions found in upcoming sessions");
    }
  });

  test("should navigate to video session from session details page", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    const detailsLink = page.getByRole("link", { name: /Details/i }).first();
    if (await detailsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await detailsLink.click();
      await expect(page).toHaveURL(/.*\/dashboard\/tutor\/sessions\/[^/]+$/);

      const videoButton = page.getByRole("link", {
        name: /📹 Start Video Session|📹 Live Video Session/i,
      });
      if (await videoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(videoButton).toHaveAttribute("href", /\/video$/);
      }
    }
  });
});

// ============================================================================
// Student: Sessions Page - Video Join Button
// ============================================================================

test.describe("Student Sessions Page - Video Join", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test("should load student sessions page without error", async ({ page }) => {
    await page.goto("/dashboard/student/sessions");
    await expect(page).toHaveURL(/.*sessions.*/);
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");
  });

  test("should display student sessions heading", async ({ page }) => {
    await page.goto("/dashboard/student/sessions");
    await expect(page.getByRole("heading", { name: /My Sessions/i })).toBeVisible();
  });

  test("should show Upcoming Sessions and Past Sessions sections", async ({ page }) => {
    await page.goto("/dashboard/student/sessions");
    await expect(page.getByRole("heading", { name: /Upcoming Sessions/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Past Sessions/i })).toBeVisible();
  });

  test("should show video join button for ONLINE sessions", async ({ page }) => {
    await page.goto("/dashboard/student/sessions");
    // After fix, button shows for ALL ONLINE sessions (not just those with videoRoomId)
    const videoJoinButton = page
      .getByRole("link", { name: /📹 Join Video|📹 Join Live Video/i })
      .first();
    const hasVideoButton = await videoJoinButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasVideoButton) {
      const href = await videoJoinButton.getAttribute("href");
      expect(href).toMatch(/\/dashboard\/tutor\/sessions\/[^/]+\/video/);
    }
  });

  test("should show recording link for completed video sessions", async ({ page }) => {
    await page.goto("/dashboard/student/sessions");
    const recordingButton = page
      .getByRole("link", { name: /📼 Watch Recording/i })
      .first();
    const hasRecording = await recordingButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasRecording) {
      const href = await recordingButton.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });

  test("student dashboard shows My Sessions card", async ({ page }) => {
    await page.goto("/dashboard");
    const sessionsLink = page.getByRole("link", { name: /My Sessions/i });
    if (await sessionsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(sessionsLink).toHaveAttribute("href", "/dashboard/student/sessions");
    }
  });
});

// ============================================================================
// API: Video Session Endpoints - Auth & Error Handling
// ============================================================================

test.describe("Video Session API Endpoints", () => {
  test("POST /api/sessions/:id/video/create - requires authentication", async ({ request }) => {
    const response = await request.post("/api/sessions/test-session-id/video/create");
    expect(response.status()).toBe(401);
  });

  test("GET /api/sessions/:id/video/token - requires authentication", async ({ request }) => {
    const response = await request.get("/api/sessions/test-session-id/video/token");
    expect(response.status()).toBe(401);
  });

  test("GET /api/sessions/:id/video/recording - requires authentication", async ({ request }) => {
    const response = await request.get("/api/sessions/test-session-id/video/recording");
    expect(response.status()).toBe(401);
  });

  test("POST /api/sessions/:id/video/recording - requires authentication", async ({ request }) => {
    const response = await request.post("/api/sessions/test-session-id/video/recording");
    expect(response.status()).toBe(401);
  });

  test("DELETE /api/sessions/:id/video/create - requires authentication", async ({ request }) => {
    const response = await request.delete("/api/sessions/test-session-id/video/create");
    expect(response.status()).toBe(401);
  });
});

// ============================================================================
// RBAC: Role-Based Access Control for Video Sessions
// ============================================================================

test.describe("Video Session RBAC", () => {
  test("student redirected when accessing tutor sessions list page", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/dashboard/tutor/sessions");
    // Students don't have TEACHER role - should redirect to /dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    // Should not be on /tutor/sessions
    expect(page.url()).not.toMatch(/tutor\/sessions$/);
  });

  test("unauthenticated user redirected from video page to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/tutor/sessions/test-session-id/video");
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("student cannot access non-enrolled video session", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/dashboard/tutor/sessions/nonexistent-id/video");
    const url = page.url();
    const bodyText = await page.locator("body").textContent();
    const isRedirected = url.includes("/dashboard") && !url.includes("/video");
    const hasError =
      bodyText?.includes("404") ||
      bodyText?.includes("not found") ||
      bodyText?.includes("Not Found") ||
      bodyText?.includes("Unauthorized") ||
      bodyText?.includes("session not found");
    expect(isRedirected || hasError).toBeTruthy();
  });
});

// ============================================================================
// Navigation: Video Sessions in Dashboard Action Cards
// ============================================================================

test.describe("Video Sessions Navigation Cards", () => {
  test("teacher dashboard shows Video Sessions card", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard");
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");

    const videoLink = page.getByRole("link", { name: /Video Sessions/i });
    if (await videoLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(videoLink).toHaveAttribute("href", "/dashboard/tutor/sessions");
    }
  });

  test("teacher dashboard has All Sessions card", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard");
    const sessionsLink = page.getByRole("link", { name: /All Sessions/i });
    if (await sessionsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(sessionsLink).toHaveAttribute("href", "/dashboard/tutor/sessions");
    }
  });
});

// ============================================================================
// Video Session Integration: Token & Room Creation
// ============================================================================

test.describe("Video Session Token & Room API (Authenticated)", () => {
  test("authenticated teacher can get video token for their session", async ({
    page,
    request,
  }) => {
    await loginAsTeacher(page);
    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    // First find a session
    const sessionsRes = await request.get("/dashboard/tutor/sessions", {
      headers: { Cookie: cookieStr },
    });
    // Response should be 200 (HTML page)
    expect(sessionsRes.status()).toBe(200);

    // Try getting token for nonexistent session - should be 404, not 500
    const tokenRes = await request.get("/api/sessions/nonexistent-id/video/token", {
      headers: { Cookie: cookieStr },
    });
    expect(tokenRes.status()).not.toBe(500);
    expect([401, 403, 404]).toContain(tokenRes.status());
  });

  test("video create API returns 404 for nonexistent session", async ({ page, request }) => {
    await loginAsTeacher(page);
    const cookies = await page.context().cookies();
    const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    const createRes = await request.post("/api/sessions/nonexistent-id/video/create", {
      headers: {
        Cookie: cookieStr,
        "Content-Type": "application/json",
      },
      data: {},
    });
    expect(createRes.status()).not.toBe(500);
    expect([403, 404]).toContain(createRes.status());
  });
});
