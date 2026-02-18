import { POST } from "@/app/api/academic/sessions/presence/route";
import { createMocks } from "node-mocks-http";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    studentSessionEnrollment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sessionPresenceLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

describe("/api/academic/sessions/presence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update activeMs on heartbeat", async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: "student-1", role: "STUDENT" },
    });

    const lastActive = new Date(Date.now() - 30000); // 30s ago
    const mockEnrollment = {
      id: "enr-1",
      studentId: "student-1",
      lastActiveAt: lastActive,
      activeMs: 1000,
    };

    (prisma.studentSessionEnrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollment);
    (prisma.studentSessionEnrollment.update as jest.Mock).mockResolvedValue({});

    const { req } = createMocks({
      method: "POST",
      body: {
        sessionId: "sess-1",
        enrollmentId: "enr-1",
        event: "HEARTBEAT",
      },
    });
    req.json = jest.fn().mockResolvedValue(req.body);

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.activeMs).toBeGreaterThan(1000);
    expect(prisma.sessionPresenceLog.create).toHaveBeenCalled();
    expect(prisma.studentSessionEnrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          activeMs: expect.any(Number),
        }),
      })
    );
  });
});
