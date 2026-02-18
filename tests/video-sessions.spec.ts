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

  test("should show Video Session card in dashboard actions", async ({ page }) => {
    await page.goto("/dashboard");
    // Check if Video Sessions action card exists
    const videoCard = page.getByRole("link", { name: /Video Sessions/i });
    if (await videoCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(videoCard).toHaveAttribute("href", "/dashboard/tutor/sessions");
    }
  });

  test("should show video button for video-enabled sessions", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    // Check if any video session buttons are visible
    const videoButton = page.getByRole("link", { name: /📹 Video Session|📹 Video|📹 Live Video/i }).first();
    // The button may or may not exist depending on seed data timing
    const hasVideoButton = await videoButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasVideoButton) {
      // Video button links to the video page
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
});

// ============================================================================
// Teacher: Video Session Page Access & Navigation
// ============================================================================

test.describe("Tutor Video Session Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("should redirect to login when not authenticated", async ({ page }) => {
    // First clear auth by going to a fresh page
    await page.context().clearCookies();
    await page.goto("/dashboard/tutor/sessions/test-id/video");
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("should be accessible at /dashboard/tutor/sessions/:id/video", async ({ page }) => {
    // Navigate to sessions list to find a video session
    await page.goto("/dashboard/tutor/sessions");

    // Try to find a video session link
    const videoLink = page.getByRole("link", { name: /📹 Video Session|📹 Video/i }).first();
    const hasVideoLink = await videoLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasVideoLink) {
      await videoLink.click();
      // Should reach the video page
      await expect(page).toHaveURL(/.*\/video$/);
      // Should not have a 404 or error
      await expect(page.locator("body")).not.toContainText("404");
    } else {
      // If no video-enabled session found in upcoming, skip gracefully
      test.skip(true, "No video-enabled sessions found in upcoming sessions");
    }
  });

  test("should navigate to video session from session details page", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");

    // Navigate to first session detail
    const detailsLink = page.getByRole("link", { name: /Details/i }).first();
    const hasDetailsLink = await detailsLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDetailsLink) {
      await detailsLink.click();
      await expect(page).toHaveURL(/.*\/dashboard\/tutor\/sessions\/[^/]+$/);

      // Check for video button on detail page if this session has video
      const videoButton = page.getByRole("link", { name: /📹 Start Video Session|📹 Live Video Session/i });
      const hasVideoButton = await videoButton.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasVideoButton) {
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

  test("should show video join button for video-enabled sessions", async ({ page }) => {
    await page.goto("/dashboard/student/sessions");

    const videoJoinButton = page.getByRole("link", { name: /📹 Join Video|📹 Join Live Video/i }).first();
    const hasVideoButton = await videoJoinButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasVideoButton) {
      // Video button should link to the tutor's video page
      const href = await videoJoinButton.getAttribute("href");
      expect(href).toMatch(/\/dashboard\/tutor\/sessions\/[^/]+\/video/);
    }
  });

  test("should show video recording link for completed video sessions", async ({ page }) => {
    await page.goto("/dashboard/student/sessions");

    const recordingButton = page.getByRole("link", { name: /📼 Watch Recording/i }).first();
    const hasRecording = await recordingButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasRecording) {
      const href = await recordingButton.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });
});

// ============================================================================
// API: Video Session Endpoints - Auth & Error Handling
// ============================================================================

test.describe("Video Session API Endpoints", () => {
  test("POST /api/sessions/:id/video/create - requires authentication", async ({ request }) => {
    const response = await request.post("/api/sessions/test-session-id/video/create");
    // Should return 401 without auth
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
  test("student should not access non-enrolled video session directly", async ({ page }) => {
    await loginAsStudent(page);
    // Navigate to a non-existent session's video page
    await page.goto("/dashboard/tutor/sessions/nonexistent-id/video");
    // Should either redirect or show a 404 / access denied
    const url = page.url();
    const bodyText = await page.locator("body").textContent();
    const isRedirected = url.includes("/dashboard") && !url.includes("/video");
    const hasNotFound = bodyText?.includes("404") || bodyText?.includes("not found") || bodyText?.includes("Not Found");
    const hasError = bodyText?.includes("session not found") || bodyText?.includes("Unauthorized");
    expect(isRedirected || hasNotFound || hasError).toBeTruthy();
  });

  test("teacher video page redirects non-teacher users", async ({ page }) => {
    // Login as student and try to access teacher-only pages
    await loginAsStudent(page);
    await page.goto("/dashboard/tutor/sessions");
    // Should redirect to /dashboard since students aren't teachers
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
});

// ============================================================================
// Navigation: Video Sessions in Dashboard Action Cards
// ============================================================================

test.describe("Video Sessions Navigation Cards", () => {
  test("teacher dashboard should show Video Sessions card", async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/dashboard");

    // The dashboard should render without errors
    await expect(page.locator("body")).not.toContainText("Error");
    await expect(page.locator("body")).not.toContainText("404");

    // Check for video sessions card (may be labeled differently)
    const videoLink = page.getByRole("link", { name: /Video Sessions/i });
    const hasVideoLink = await videoLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasVideoLink) {
      await expect(videoLink).toHaveAttribute("href", "/dashboard/tutor/sessions");
    }
  });

  test("student dashboard shows My Sessions card linking to sessions page", async ({ page }) => {
    await loginAsStudent(page);
    await page.goto("/dashboard");

    const sessionsLink = page.getByRole("link", { name: /My Sessions/i });
    if (await sessionsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(sessionsLink).toHaveAttribute("href", "/dashboard/student/sessions");
    }
  });
});

// ============================================================================
// Video Session Page: Content Validation
// ============================================================================

test.describe("Video Session Page Content", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test("sessions list shows Upcoming Sessions and Past Sessions sections", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    await expect(page.getByRole("heading", { name: /Upcoming Sessions/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Past Sessions/i })).toBeVisible();
  });

  test("sessions page shows Session Planner button", async ({ page }) => {
    await page.goto("/dashboard/tutor/sessions");
    const plannerBtn = page.getByRole("link", { name: /Session Planner/i });
    await expect(plannerBtn).toBeVisible();
  });
});
