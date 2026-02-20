import { GET as getHelpRequests } from "@/app/api/academic/help-requests/route";
import { GET as getHomework } from "@/app/api/academic/homework/route";
import { createMocks } from "node-mocks-http";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    helpRequest: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    homeworkAssignment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

describe("Bolt Optimizations Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Help Requests API Optimization", () => {
    it("should use direct centreId filter for staff users instead of relation join", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "tutor-1", role: "TEACHER", centerId: "center-1" },
      });

      const { req } = createMocks({
        method: "GET",
        url: "http://localhost/api/academic/help-requests",
      });

      await getHelpRequests(req as any);

      expect(prisma.helpRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            centreId: "center-1",
          }),
        })
      );

      // Verify no student join is used for center filtering
      const call = (prisma.helpRequest.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.student).toBeUndefined();
    });
  });

  describe("Homework API Optimization and Fix", () => {
    it("should apply centreId filter for staff users", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: "tutor-1", role: "TEACHER", centerId: "center-1" },
      });

      const { req } = createMocks({
        method: "GET",
        url: "http://localhost/api/academic/homework",
      });

      await getHomework(req as any);

      expect(prisma.homeworkAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            centreId: "center-1",
          }),
        })
      );
    });

    it("should not call findUnique for student center verification when studentId is not provided", async () => {
        (auth as jest.Mock).mockResolvedValue({
          user: { id: "tutor-1", role: "TEACHER", centerId: "center-1" },
        });

        const { req } = createMocks({
          method: "GET",
          url: "http://localhost/api/academic/homework",
        });

        await getHomework(req as any);

        expect(prisma.user.findUnique).not.toHaveBeenCalled();
      });
  });
});
