import { GET, POST } from "@/app/api/academic/classes/route";
import { createMocks } from "node-mocks-http";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    classCohort: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

describe("/api/academic/classes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const { req } = createMocks({
      method: "GET",
      url: "http://localhost/api/academic/classes"
    });
    const response = await GET(req as any);
    expect(response.status).toBe(401);
  });

  it("should return 403 if user is a student", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { role: "STUDENT", centerId: "center-1" },
    });
    const { req } = createMocks({
      method: "GET",
      url: "http://localhost/api/academic/classes"
    });
    const response = await GET(req as any);
    expect(response.status).toBe(403);
  });

  it("should return classes for teacher", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { role: "TEACHER", centerId: "center-1" },
    });
    const mockClasses = [{ id: "class-1", name: "Math" }];
    (prisma.classCohort.findMany as jest.Mock).mockResolvedValue(mockClasses);

    const { req } = createMocks({
      method: "GET",
      url: "http://localhost/api/academic/classes"
    });
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockClasses);
    expect(prisma.classCohort.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ centreId: "center-1" }),
      })
    );
  });

  it("should create a new class if admin", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { role: "CENTER_ADMIN", centerId: "center-1" },
    });
    const newClass = { id: "class-2", name: "Science" };
    (prisma.classCohort.create as jest.Mock).mockResolvedValue(newClass);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "teacher-1", centerId: "center-1", role: "TEACHER" });

    const { req } = createMocks({
      method: "POST",
      body: {
        name: "Science",
        subject: "STEM",
        startDate: "2026-03-01",
        teacherId: "teacher-1",
      },
    });

    // Mock request.json()
    req.json = jest.fn().mockResolvedValue(req.body);

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(prisma.classCohort.create).toHaveBeenCalled();
  });
});
