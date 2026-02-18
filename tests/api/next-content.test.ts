import { GET } from "@/app/api/v1/students/[id]/next-content/route";
import { createMocks } from "node-mocks-http";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    subjectAssessment: {
      findUnique: jest.fn(),
    },
    contentUnit: {
      findMany: jest.fn(),
    },
    exerciseAttempt: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

describe("/api/v1/students/[id]/next-content", () => {
  const studentId = "student-1";
  const courseId = "course-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const { req } = createMocks({
      method: "GET",
      url: `http://localhost/api/v1/students/${studentId}/next-content?courseId=${courseId}`
    });
    const response = await GET(req as any, { params: Promise.resolve({ id: studentId }) });
    expect(response.status).toBe(401);
  });

  it("should return recommended next content", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: studentId, role: "STUDENT" },
    });

    (prisma.subjectAssessment.findUnique as jest.Mock).mockResolvedValue({
      assessedGradeLevel: 5,
    });

    (prisma.gradeLevel.findMany as jest.Mock).mockResolvedValue([
      { id: "grade-5-id" }
    ]);

    const mockExercises = [
      { id: "ex-1", title: "Exercise 1", exerciseType: "MULTIPLE_CHOICE", maxScore: 10, isActive: true },
      { id: "ex-2", title: "Exercise 2", exerciseType: "FILL_IN_BLANK", maxScore: 10, isActive: true },
    ];

    (prisma.contentUnit.findMany as jest.Mock).mockResolvedValue([
      {
        id: "unit-1",
        title: "Unit 1",
        sequenceOrder: 1,
        lessons: [
          {
            id: "lesson-1",
            title: "Lesson 1",
            order: 1,
            exercises: mockExercises,
          }
        ],
        gradeLevel: { level: 5, label: "Class 5" }
      }
    ]);

    // ex-1 is completed
    (prisma.exerciseAttempt.findMany as jest.Mock)
      .mockResolvedValue([
        { exerciseId: "ex-1", status: "GRADED", score: 10, exercise: { maxScore: 10 }, submittedAt: new Date() }
      ]);

    const { req } = createMocks({
      method: "GET",
      url: `http://localhost/api/v1/students/${studentId}/next-content?courseId=${courseId}`
    });

    const response = await GET(req as any, { params: Promise.resolve({ id: studentId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.nextExercise.id).toBe("ex-2");
    expect(data.data.unitProgress.completedExercises).toBe(1);
    expect(data.data.unitProgress.totalExercises).toBe(2);
  });

  it("should return resumeAttempt when exercise is in progress", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: studentId, role: "STUDENT" },
    });

    (prisma.subjectAssessment.findUnique as jest.Mock).mockResolvedValue({
      assessedGradeLevel: 5,
    });

    (prisma.gradeLevel.findMany as jest.Mock).mockResolvedValue([{ id: "grade-5-id" }]);

    (prisma.contentUnit.findMany as jest.Mock).mockResolvedValue([
      {
        id: "unit-1",
        title: "Unit 1",
        sequenceOrder: 1,
        lessons: [
          {
            id: "lesson-1",
            title: "Lesson 1",
            order: 1,
            exercises: [{ id: "ex-1", title: "Exercise 1", exerciseType: "MULTIPLE_CHOICE", maxScore: 10, isActive: true }],
          }
        ],
        gradeLevel: { level: 5, label: "Class 5" }
      }
    ]);

    (prisma.exerciseAttempt.findMany as jest.Mock)
      .mockResolvedValue([{ id: "attempt-123", exerciseId: "ex-1", status: "IN_PROGRESS", startedAt: new Date() }]);

    const { req } = createMocks({
      method: "GET",
      url: `http://localhost/api/v1/students/${studentId}/next-content?courseId=${courseId}`
    });

    const response = await GET(req as any, { params: Promise.resolve({ id: studentId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.nextExercise.id).toBe("ex-1");
    // Verified: Now returns the actual attempt ID
    expect(data.data.resumeAttempt.attemptId).toBe("attempt-123");
  });
});
