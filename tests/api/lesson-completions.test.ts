/**
 * Jest unit tests for POST /api/v1/student-placements/[id]/lesson-completions
 *
 * Phase 4 — Assessment Engine: Lesson Completion API
 *
 * Covers:
 *   • Unauthenticated → 401
 *   • Student submitting their own lesson → 201
 *   • Student submitting another student's placement → 403
 *   • Invalid lessonId → 404
 *   • Subject mismatch → 400
 *   • SUBMITTED status triggers notification to tutor (fire-and-forget)
 *   • MARKED status triggers readyForPromotion when 25 lessons complete
 */

import { POST, GET } from "@/app/api/v1/student-placements/[id]/lesson-completions/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/lib/prisma", () => ({
  prisma: {
    studentAgeAssessment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ageAssessmentLesson: {
      findUnique: jest.fn(),
    },
    ageLessonCompletion: {
      upsert: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/v1/student-placements/placement-1/lesson-completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGetRequest() {
  return new Request(
    "http://localhost/api/v1/student-placements/placement-1/lesson-completions",
    { method: "GET" }
  );
}

const STUDENT_SESSION = {
  user: { id: "student-1", role: "STUDENT", centerId: "centre-1" },
};
const TEACHER_SESSION = {
  user: { id: "teacher-1", role: "TEACHER", centerId: "centre-1" },
};

const PLACEMENT = {
  id: "placement-1",
  studentId: "student-1",
  centreId: "centre-1",
  subject: "MATHEMATICS",
  lessonsCompleted: 10,
  readyForPromotion: false,
  student: { parentId: null },
};

const LESSON = {
  id: "lesson-1",
  subject: "MATHEMATICS",
  lessonNumber: 5,
  assessmentAgeId: "age-1",
  difficultyScore: 20,
};

const COMPLETION_RECORD = {
  id: "comp-1",
  studentId: "student-1",
  placementId: "placement-1",
  lessonId: "lesson-1",
  status: "IN_PROGRESS",
  score: null,
  percentageScore: null,
  completedAt: null,
  timeSpentMinutes: null,
  feedback: null,
  gradedById: null,
  gradedAt: null,
  lesson: { id: "lesson-1", subject: "MATHEMATICS", lessonNumber: 5, title: "Fractions", difficultyScore: 20 },
  gradedBy: null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/student-placements/[id]/lesson-completions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(null);
    const res = await POST(makeRequest({ lessonId: "lesson-1", status: "IN_PROGRESS" }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(401);
  });

  test("returns 404 when placement not found", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(STUDENT_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const res = await POST(makeRequest({ lessonId: "lesson-1", status: "IN_PROGRESS" }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(404);
  });

  test("returns 403 when student accesses another student's placement", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(STUDENT_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock).mockResolvedValueOnce({
      ...PLACEMENT,
      studentId: "other-student",
    });
    const res = await POST(makeRequest({ lessonId: "lesson-1", status: "IN_PROGRESS" }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(403);
  });

  test("returns 400 when lessonId missing", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(STUDENT_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock).mockResolvedValueOnce(PLACEMENT);
    const res = await POST(makeRequest({ status: "IN_PROGRESS" }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(400);
  });

  test("returns 400 when status missing", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(STUDENT_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock).mockResolvedValueOnce(PLACEMENT);
    const res = await POST(makeRequest({ lessonId: "lesson-1" }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(400);
  });

  test("returns 404 when lesson not found", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(STUDENT_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock).mockResolvedValueOnce(PLACEMENT);
    (prisma.ageAssessmentLesson.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const res = await POST(makeRequest({ lessonId: "lesson-1", status: "IN_PROGRESS" }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(404);
  });

  test("returns 400 when lesson subject does not match placement subject", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(STUDENT_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock).mockResolvedValueOnce(PLACEMENT);
    (prisma.ageAssessmentLesson.findUnique as jest.Mock).mockResolvedValueOnce({
      ...LESSON,
      subject: "ENGLISH", // mismatch
    });
    const res = await POST(makeRequest({ lessonId: "lesson-1", status: "IN_PROGRESS" }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/subject/i);
  });

  test("student can update their own lesson to IN_PROGRESS (201)", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(STUDENT_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock).mockResolvedValueOnce(PLACEMENT);
    (prisma.ageAssessmentLesson.findUnique as jest.Mock).mockResolvedValueOnce(LESSON);
    (prisma.ageLessonCompletion.upsert as jest.Mock).mockResolvedValueOnce(COMPLETION_RECORD);

    const res = await POST(makeRequest({ lessonId: "lesson-1", status: "IN_PROGRESS" }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("IN_PROGRESS");
  });

  test("student submitting SUBMITTED notifies tutor (non-blocking)", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(STUDENT_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock)
      .mockResolvedValueOnce(PLACEMENT) // initial placement fetch
      .mockResolvedValueOnce({ placedById: "teacher-1" }); // for notification
    (prisma.ageAssessmentLesson.findUnique as jest.Mock).mockResolvedValueOnce(LESSON);
    (prisma.ageLessonCompletion.upsert as jest.Mock).mockResolvedValueOnce({
      ...COMPLETION_RECORD,
      status: "SUBMITTED",
      completedAt: new Date().toISOString(),
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ name: "Test Student" });
    (prisma.notification.create as jest.Mock).mockResolvedValueOnce({});

    const res = await POST(makeRequest({ lessonId: "lesson-1", status: "SUBMITTED" }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(201);
    // Notification.create should have been called
    await new Promise(process.nextTick); // flush microtasks
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "ASSESSMENT_LESSON_SUBMITTED" }),
      })
    );
  });

  test("MARKED status with 25 completions sets readyForPromotion", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock)
      .mockResolvedValueOnce({ ...PLACEMENT, lessonsCompleted: 24, readyForPromotion: false }) // initial
      .mockResolvedValueOnce({ placedById: "teacher-1", currentAge: { displayLabel: "Year 5", australianYear: "Year 5" } }); // for notification
    (prisma.ageAssessmentLesson.findUnique as jest.Mock).mockResolvedValueOnce(LESSON);
    (prisma.ageLessonCompletion.upsert as jest.Mock).mockResolvedValueOnce({
      ...COMPLETION_RECORD,
      status: "MARKED",
    });
    (prisma.ageLessonCompletion.count as jest.Mock).mockResolvedValueOnce(25); // exactly 25
    (prisma.studentAgeAssessment.update as jest.Mock).mockResolvedValueOnce({});
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ name: "Test Student" });
    (prisma.notification.create as jest.Mock).mockResolvedValueOnce({});

    const res = await POST(makeRequest({ lessonId: "lesson-1", status: "MARKED", score: 85 }), {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(201);

    // Verify update was called with readyForPromotion: true
    expect(prisma.studentAgeAssessment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ readyForPromotion: true }),
      })
    );
  });
});

// ─── GET tests ────────────────────────────────────────────────────────────────

describe("GET /api/v1/student-placements/[id]/lesson-completions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(null);
    const res = await GET(makeGetRequest() as any, {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(401);
  });

  test("returns 404 when placement not found", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const res = await GET(makeGetRequest() as any, {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(404);
  });

  test("teacher can list completions for a placement", async () => {
    (auth as jest.Mock).mockResolvedValueOnce(TEACHER_SESSION);
    (prisma.studentAgeAssessment.findUnique as jest.Mock).mockResolvedValueOnce({
      ...PLACEMENT,
      student: { parentId: null },
    });
    (prisma.ageLessonCompletion.findMany as jest.Mock).mockResolvedValueOnce([
      COMPLETION_RECORD,
    ]);
    const res = await GET(makeGetRequest() as any, {
      params: Promise.resolve({ id: "placement-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
