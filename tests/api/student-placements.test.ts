/**
 * Jest unit tests for /api/v1/student-placements route
 *
 * Response shapes confirmed from route.ts:
 *   GET  → { success: true, data: [...], total: N }
 *   POST → { success: true, data: placement } with status 201
 *
 * POST body: { studentId, subject, ageYear, ageMonth }
 *   Uses prisma.$transaction internally — both tx.studentAgeAssessment.create
 *   and tx.ageAssessmentHistory.create must be mocked.
 */

import { GET, POST } from "@/app/api/v1/student-placements/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const mockTxCreate = jest.fn();
const mockTxHistoryCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    studentAgeAssessment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    assessmentAge: {
      findFirst: jest.fn(),
    },
    ageAssessmentHistory: {
      create: jest.fn(),
    },
    // Transaction mock: executes the callback with a mock tx object
    $transaction: jest.fn(async (cb: any) => {
      const tx = {
        studentAgeAssessment: { create: mockTxCreate },
        ageAssessmentHistory: { create: mockTxHistoryCreate },
      };
      return cb(tx);
    }),
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

function makeRequest(method: string, url: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const TEACHER_SESSION = { user: { id: "teacher-1", role: "TEACHER", centerId: "centre-1" } };
const STUDENT_SESSION = { user: { id: "student-1", role: "STUDENT", centerId: "centre-1" } };
const PARENT_SESSION  = { user: { id: "parent-1",  role: "PARENT",  centerId: "centre-1" } };

// GET tests
describe("GET /api/v1/student-placements", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest("GET", "http://localhost/api/v1/student-placements") as any);
    expect(res.status).toBe(401);
  });

  it("returns 403 for FINANCE_ADMIN", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "f1", role: "FINANCE_ADMIN", centerId: "c1" } });
    const res = await GET(makeRequest("GET", "http://localhost/api/v1/student-placements") as any);
    expect(res.status).toBe(403);
  });

  it("returns 200 with data and total for TEACHER", async () => {
    (auth as jest.Mock).mockResolvedValue(TEACHER_SESSION);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([
      { id: "p1", studentId: "s1", subject: "ENGLISH", centreId: "centre-1",
        student: { id: "s1", name: "Alice", email: "a@t.com", role: "STUDENT" },
        currentAge: { id: "a1", ageYear: 7, ageMonth: 1, displayLabel: "7.1", australianYear: null },
        placedBy: { id: "t1", name: "Teacher", role: "TEACHER" } },
    ]);
    const res = await GET(makeRequest("GET", "http://localhost/api/v1/student-placements") as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("scopes STUDENT to only their own placements", async () => {
    (auth as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([]);
    await GET(makeRequest("GET", "http://localhost/api/v1/student-placements") as any);
    expect(prisma.studentAgeAssessment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ studentId: "student-1" }) })
    );
  });

  it("scopes PARENT to their children's placements", async () => {
    (auth as jest.Mock).mockResolvedValue(PARENT_SESSION);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: "c1" }, { id: "c2" }]);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([]);
    await GET(makeRequest("GET", "http://localhost/api/v1/student-placements") as any);
    expect(prisma.studentAgeAssessment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ studentId: { in: ["c1", "c2"] } }) })
    );
  });

  it("returns 403 when PARENT requests a non-child student", async () => {
    (auth as jest.Mock).mockResolvedValue(PARENT_SESSION);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: "c1" }]);
    const res = await GET(makeRequest("GET", "http://localhost/api/v1/student-placements?studentId=other") as any);
    expect(res.status).toBe(403);
  });

  it("scopes non-SUPER_ADMIN queries by centreId", async () => {
    (auth as jest.Mock).mockResolvedValue(TEACHER_SESSION);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([]);
    await GET(makeRequest("GET", "http://localhost/api/v1/student-placements") as any);
    expect(prisma.studentAgeAssessment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ centreId: "centre-1" }) })
    );
  });
});

// POST tests
describe("POST /api/v1/student-placements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTxCreate.mockReset();
    mockTxHistoryCreate.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest("POST", "http://localhost/api/v1/student-placements",
      { studentId: "s1", subject: "ENGLISH", ageYear: 7, ageMonth: 1 }) as any);
    expect(res.status).toBe(401);
  });

  it("returns 403 for STUDENT", async () => {
    (auth as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    const res = await POST(makeRequest("POST", "http://localhost/api/v1/student-placements",
      { studentId: "s1", subject: "ENGLISH", ageYear: 7, ageMonth: 1 }) as any);
    expect(res.status).toBe(403);
  });

  it("returns 400 when subject is missing", async () => {
    (auth as jest.Mock).mockResolvedValue(TEACHER_SESSION);
    const res = await POST(makeRequest("POST", "http://localhost/api/v1/student-placements",
      { studentId: "s1", ageYear: 7, ageMonth: 1 }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when ageYear is missing", async () => {
    (auth as jest.Mock).mockResolvedValue(TEACHER_SESSION);
    const res = await POST(makeRequest("POST", "http://localhost/api/v1/student-placements",
      { studentId: "s1", subject: "ENGLISH", ageMonth: 1 }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 404 when student does not exist", async () => {
    (auth as jest.Mock).mockResolvedValue(TEACHER_SESSION);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest("POST", "http://localhost/api/v1/student-placements",
      { studentId: "nonexistent", subject: "ENGLISH", ageYear: 7, ageMonth: 1 }) as any);
    expect(res.status).toBe(404);
  });

  it("returns 404 when assessment age level not found for ageYear+ageMonth", async () => {
    (auth as jest.Mock).mockResolvedValue(TEACHER_SESSION);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "s1", role: "STUDENT", centerId: "centre-1", name: "Alice" });
    (prisma.assessmentAge.findFirst as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest("POST", "http://localhost/api/v1/student-placements",
      { studentId: "s1", subject: "ENGLISH", ageYear: 99, ageMonth: 1 }) as any);
    expect(res.status).toBe(404);
  });

  it("creates placement via transaction and returns 201", async () => {
    (auth as jest.Mock).mockResolvedValue(TEACHER_SESSION);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "s1", role: "STUDENT", centerId: "centre-1", name: "Alice" });
    (prisma.assessmentAge.findFirst as jest.Mock).mockResolvedValue({ id: "a1", ageYear: 7, ageMonth: 1, displayLabel: "7.1" });
    (prisma.studentAgeAssessment.findFirst as jest.Mock).mockResolvedValue(null); // no duplicate

    const createdPlacement = {
      id: "p-new", studentId: "s1", subject: "ENGLISH", centreId: "centre-1",
      status: "ACTIVE", currentLessonNumber: 1, lessonsCompleted: 0,
      student: { id: "s1", name: "Alice", email: "a@t.com" },
      currentAge: { id: "a1", ageYear: 7, ageMonth: 1, displayLabel: "7.1" },
      placedBy: { id: "teacher-1", name: "Teacher" },
    };
    mockTxCreate.mockResolvedValue(createdPlacement);
    mockTxHistoryCreate.mockResolvedValue({});

    const res = await POST(makeRequest("POST", "http://localhost/api/v1/student-placements",
      { studentId: "s1", subject: "ENGLISH", ageYear: 7, ageMonth: 1 }) as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({ studentId: "s1", subject: "ENGLISH" });
  });

  it("returns 409 for duplicate active placement in same subject", async () => {
    (auth as jest.Mock).mockResolvedValue(TEACHER_SESSION);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "s1", role: "STUDENT", centerId: "centre-1", name: "Alice" });
    (prisma.assessmentAge.findFirst as jest.Mock).mockResolvedValue({ id: "a1", ageYear: 7, ageMonth: 1 });
    (prisma.studentAgeAssessment.findFirst as jest.Mock).mockResolvedValue({ id: "existing-p", status: "ACTIVE" });

    const res = await POST(makeRequest("POST", "http://localhost/api/v1/student-placements",
      { studentId: "s1", subject: "ENGLISH", ageYear: 7, ageMonth: 1 }) as any);
    expect(res.status).toBe(409);
  });
});
