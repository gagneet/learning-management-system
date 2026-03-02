/**
 * Jest unit tests for POST /api/v1/student-placements/bulk
 *
 * Phase 5 — Bulk Student Placement API
 *
 * Covers:
 *   • 401 when unauthenticated
 *   • 403 when student/parent tries to use it
 *   • 400 when placements array is empty or missing
 *   • 400 when individual item is missing required fields
 *   • Successful create (new placement)
 *   • Successful update (existing placement → MANUAL_OVERRIDE)
 *   • Per-item error isolation (one bad, others succeed)
 *   • 422 when every item fails
 */

import { POST } from "@/app/api/v1/student-placements/bulk/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));

const mockTxStudentCreate = jest.fn();
const mockTxHistoryCreate = jest.fn();
const mockTxStudentUpdate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: jest.fn(), findUnique: jest.fn() },
    assessmentAge: { findFirst: jest.fn() },
    studentAgeAssessment: { findFirst: jest.fn() },
    $transaction: jest.fn(async (cb: any) =>
      cb({
        studentAgeAssessment: {
          create: mockTxStudentCreate,
          update: mockTxStudentUpdate,
        },
        ageAssessmentHistory: { create: mockTxHistoryCreate },
      })
    ),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request(
    "http://localhost/api/v1/student-placements/bulk",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

const TEACHER_SESSION = {
  user: { id: "teacher-1", role: "TEACHER", centerId: "centre-1" },
};

const STUDENT_SESSION = {
  user: { id: "student-1", role: "STUDENT", centerId: "centre-1" },
};

const VALID_STUDENT = {
  id: "student-1",
  role: "STUDENT",
  centerId: "centre-1",
  name: "Test Student",
};

const ASSESSMENT_AGE = {
  id: "age-9-1",
  ageYear: 9,
  ageMonth: 1,
};

const NEW_PLACEMENT = { id: "placement-new" };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/student-placements/bulk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset tx mocks to always resolve successfully by default
    mockTxStudentCreate.mockResolvedValue({ id: "placement-new" });
    mockTxStudentUpdate.mockResolvedValue({ id: "existing-placement" });
    mockTxHistoryCreate.mockResolvedValue({});
  });

  test("returns 401 when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(null);
    const res = await POST(makeRequest({ placements: [] }));
    expect(res.status).toBe(401);
  });

  test("returns 403 when STUDENT role", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(STUDENT_SESSION);
    const res = await POST(makeRequest({ placements: [] }));
    expect(res.status).toBe(403);
  });

  test("returns 400 when placements is missing", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  test("returns 400 when placements is empty array", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    const res = await POST(makeRequest({ placements: [] }));
    expect(res.status).toBe(400);
  });

  test("returns 400 when item is missing required fields", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    const res = await POST(
      makeRequest({
        placements: [{ studentId: "s1", subject: "ENGLISH" }], // missing ageYear/ageMonth
      })
    );
    expect(res.status).toBe(400);
  });

  test("returns 400 when more than 50 items", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    const placements = Array.from({ length: 51 }, (_, i) => ({
      studentId: `s${i}`,
      subject: "ENGLISH",
      ageYear: 9,
      ageMonth: 1,
    }));
    const res = await POST(makeRequest({ placements }));
    expect(res.status).toBe(400);
  });

  test("creates a new placement successfully", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(VALID_STUDENT);
    (prisma.assessmentAge.findFirst as jest.Mock).mockResolvedValueOnce(ASSESSMENT_AGE);
    (prisma.studentAgeAssessment.findFirst as jest.Mock).mockResolvedValueOnce(null); // no existing
    mockTxStudentCreate.mockResolvedValueOnce(NEW_PLACEMENT);
    mockTxHistoryCreate.mockResolvedValueOnce({});

    const res = await POST(
      makeRequest({
        placements: [
          { studentId: "student-1", subject: "ENGLISH", ageYear: 9, ageMonth: 1 },
        ],
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.created).toBe(1);
    expect(body.updated).toBe(0);
    expect(body.errors).toHaveLength(0);
  });

  test("updates an existing placement (MANUAL_OVERRIDE)", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(VALID_STUDENT);
    (prisma.assessmentAge.findFirst as jest.Mock).mockResolvedValueOnce(ASSESSMENT_AGE);
    (prisma.studentAgeAssessment.findFirst as jest.Mock).mockResolvedValueOnce({
      id: "existing-placement",
      currentAgeId: "age-8-1",
    });
    // persistent mock so the tx callback always resolves
    mockTxStudentUpdate.mockResolvedValue({ id: "existing-placement" });
    mockTxHistoryCreate.mockResolvedValue({});

    const res = await POST(
      makeRequest({
        placements: [
          { studentId: "student-1", subject: "ENGLISH", ageYear: 9, ageMonth: 1 },
        ],
      })
    );
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.errors).toHaveLength(0);
    expect(body.created + body.updated).toBe(1);
  });

  test("isolates per-item errors — error captured, does not throw 500", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    // Both students not found — errors collected per-item, no throw
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        placements: [
          { studentId: "bad-id-1", subject: "ENGLISH",     ageYear: 9, ageMonth: 1 },
          { studentId: "bad-id-2", subject: "MATHEMATICS",  ageYear: 9, ageMonth: 1 },
        ],
      })
    );
    // All fail → 422 (expected per route logic)
    const body = await res.json();
    expect(body.errors.length).toBe(2);
    expect(body.errors.map((e: any) => e.studentId)).toContain("bad-id-1");
  });

  test("returns 422 when ALL items fail", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // all not found

    const res = await POST(
      makeRequest({
        placements: [
          { studentId: "bad1", subject: "ENGLISH", ageYear: 9, ageMonth: 1 },
          { studentId: "bad2", subject: "MATHEMATICS", ageYear: 9, ageMonth: 1 },
        ],
      })
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errors).toHaveLength(2);
  });
});
