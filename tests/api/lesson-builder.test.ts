import { POST } from "@/app/api/lesson-builder/route";
import { createMocks } from "node-mocks-http";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const transactionModule = {
  findFirst: jest.fn(),
  create: jest.fn(),
};

const transactionLesson = {
  create: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
};

const transactionLessonPlan = {
  upsert: jest.fn(),
};

jest.mock("@/lib/prisma", () => ({
  prisma: {
    course: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

describe("/api/lesson-builder", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) =>
      callback({
        module: transactionModule,
        lesson: transactionLesson,
        lessonPlan: transactionLessonPlan,
      })
    );
  });

  it("should return 401 if unauthorized", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const { req } = createMocks({ method: "POST" });
    req.json = jest.fn().mockResolvedValue({});

    const response = await POST(req as any);
    expect(response.status).toBe(401);
  });

  it("should create a mathematics lesson plan with a new module", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "teacher-1", role: "TEACHER", centerId: "center-1" },
    });

    (prisma.course.findFirst as jest.Mock).mockResolvedValue({
      id: "course-1",
      slug: "advanced-mathematics",
    });

    transactionModule.findFirst
      .mockResolvedValueOnce({ order: 2 });
    transactionModule.create.mockResolvedValue({
      id: "module-3",
      title: "Quadratic Equations",
    });
    transactionLesson.create.mockResolvedValue({
      id: "lesson-9",
      title: "Solving with the quadratic formula",
      description: "Apply the quadratic formula to real problems",
      order: 1,
      plan: null,
    });
    transactionLessonPlan.upsert.mockResolvedValue({
      id: "plan-9",
      lessonId: "lesson-9",
      planType: "MATHEMATICS",
      mathExpressions: [
        {
          id: "quadratic-formula",
          title: "Quadratic Formula",
          latex: "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        },
      ],
    });

    const payload = {
      courseId: "course-1",
      newModuleTitle: "Quadratic Equations",
      lessonTitle: "Solving with the quadratic formula",
      lessonDescription: "Apply the quadratic formula to real problems",
      lessonOrder: 1,
      planType: "MATHEMATICS",
      estimatedDuration: 55,
      objectives: ["Use the quadratic formula accurately"],
      overview: "Students solve quadratic equations using $ax^2 + bx + c = 0$.",
      mathExpressions: [
        {
          id: "quadratic-formula",
          title: "Quadratic Formula",
          latex: "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        },
      ],
    };

    const { req } = createMocks({
      method: "POST",
      body: payload,
    });
    req.json = jest.fn().mockResolvedValue(payload);

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(prisma.course.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "course-1",
          centerId: "center-1",
          teacherId: "teacher-1",
        }),
      })
    );
    expect(transactionModule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Quadratic Equations",
        }),
      })
    );
    expect(transactionLessonPlan.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          planType: "MATHEMATICS",
        }),
      })
    );
  });
});
