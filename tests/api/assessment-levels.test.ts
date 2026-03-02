/**
 * Jest unit tests for /api/v1/assessment-levels route
 *
 * GET is a PUBLIC endpoint (no auth required): returns { success, data, total }
 * POST requires CENTER_ADMIN with ASSESSMENT_LEVEL_MANAGE permission
 *
 * Response shapes confirmed from route.ts:
 *   GET  → { success: true, data: [...], total: N }
 *   POST → { success: true, data: level } with status 201
 */

import { GET, POST } from "@/app/api/v1/assessment-levels/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    assessmentAge: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

function makeGetRequest(url: string) {
  return new Request(url, { method: "GET" });
}

function makePostRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── GET (public) ────────────────────────────────────────────────────────────

describe("GET /api/v1/assessment-levels", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 even for unauthenticated requests (public endpoint)", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    (prisma.assessmentAge.findMany as jest.Mock).mockResolvedValue([]);
    const res = await GET(makeGetRequest("http://localhost/api/v1/assessment-levels") as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("returns correct data shape and total count", async () => {
    (prisma.assessmentAge.findMany as jest.Mock).mockResolvedValue([
      { id: "l1", ageYear: 5, ageMonth: 1, displayLabel: "5.1", australianYear: "Year 1", isActive: true },
      { id: "l2", ageYear: 5, ageMonth: 7, displayLabel: "5.7", australianYear: "Year 2", isActive: true },
    ]);
    const res = await GET(makeGetRequest("http://localhost/api/v1/assessment-levels") as any);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.data[0]).toMatchObject({ id: "l1", ageYear: 5, displayLabel: "5.1" });
  });

  it("passes ageYear filter into the Prisma where clause", async () => {
    (prisma.assessmentAge.findMany as jest.Mock).mockResolvedValue([]);
    await GET(makeGetRequest("http://localhost/api/v1/assessment-levels?ageYear=7") as any);
    expect(prisma.assessmentAge.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ageYear: 7 }) })
    );
  });

  it("passes isActive=true filter when provided", async () => {
    (prisma.assessmentAge.findMany as jest.Mock).mockResolvedValue([]);
    await GET(makeGetRequest("http://localhost/api/v1/assessment-levels?isActive=true") as any);
    expect(prisma.assessmentAge.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    );
  });

  it("includes lessons relation when includeLessonCount=true", async () => {
    (prisma.assessmentAge.findMany as jest.Mock).mockResolvedValue([
      { id: "l1", ageYear: 5, ageMonth: 1, displayLabel: "5.1", australianYear: null, isActive: true, lessons: [] },
    ]);
    await GET(makeGetRequest("http://localhost/api/v1/assessment-levels?includeLessonCount=true") as any);
    expect(prisma.assessmentAge.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: expect.objectContaining({ lessons: expect.any(Object) }) })
    );
  });

  it("filters out levels with no matching lessons when subject param given", async () => {
    (prisma.assessmentAge.findMany as jest.Mock).mockResolvedValue([
      { id: "l1", ageYear: 5, ageMonth: 1, displayLabel: "5.1", australianYear: null, isActive: true, lessons: [{ subject: "ENGLISH", isActive: true }] },
      { id: "l2", ageYear: 5, ageMonth: 7, displayLabel: "5.7", australianYear: null, isActive: true, lessons: [] },
    ]);
    const res = await GET(makeGetRequest("http://localhost/api/v1/assessment-levels?subject=ENGLISH") as any);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("l1");
  });

  it("returns 500 when prisma throws an error", async () => {
    (prisma.assessmentAge.findMany as jest.Mock).mockRejectedValue(new Error("DB error"));
    const res = await GET(makeGetRequest("http://localhost/api/v1/assessment-levels") as any);
    expect(res.status).toBe(500);
  });
});

// ─── POST ────────────────────────────────────────────────────────────────────

describe("POST /api/v1/assessment-levels", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const res = await POST(makePostRequest("http://localhost/api/v1/assessment-levels", { ageYear: 6, ageMonth: 1 }) as any);
    expect(res.status).toBe(401);
  });

  it("returns 403 for TEACHER (lacks ASSESSMENT_LEVEL_MANAGE permission)", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    const res = await POST(makePostRequest("http://localhost/api/v1/assessment-levels", { ageYear: 6, ageMonth: 1 }) as any);
    expect(res.status).toBe(403);
  });

  it("returns 403 for STUDENT", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "s1", role: "STUDENT", centerId: "c1" } });
    const res = await POST(makePostRequest("http://localhost/api/v1/assessment-levels", { ageYear: 6, ageMonth: 1 }) as any);
    expect(res.status).toBe(403);
  });

  it("returns 400 when ageYear is missing", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "a1", role: "CENTER_ADMIN", centerId: "c1" } });
    const res = await POST(makePostRequest("http://localhost/api/v1/assessment-levels", { ageMonth: 1 }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when ageYear is out of range (>18)", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "a1", role: "CENTER_ADMIN", centerId: "c1" } });
    const res = await POST(makePostRequest("http://localhost/api/v1/assessment-levels", { ageYear: 99, ageMonth: 1 }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 when ageMonth is 0 (must be 1–12)", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "a1", role: "CENTER_ADMIN", centerId: "c1" } });
    const res = await POST(makePostRequest("http://localhost/api/v1/assessment-levels", { ageYear: 7, ageMonth: 0 }) as any);
    expect(res.status).toBe(400);
  });

  it("returns 409 when level already exists for that ageYear+ageMonth", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "a1", role: "CENTER_ADMIN", centerId: "c1" } });
    (prisma.assessmentAge.findFirst as jest.Mock).mockResolvedValue({ id: "existing", ageYear: 7, ageMonth: 6 });
    const res = await POST(makePostRequest("http://localhost/api/v1/assessment-levels", { ageYear: 7, ageMonth: 6 }) as any);
    expect(res.status).toBe(409);
  });

  it("returns 201 and creates level for CENTER_ADMIN with valid data", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "a1", role: "CENTER_ADMIN", centerId: "c1" } });
    (prisma.assessmentAge.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.assessmentAge.create as jest.Mock).mockResolvedValue({
      id: "new-l1", ageYear: 8, ageMonth: 6, displayLabel: "8.6", australianYear: "Year 3", isActive: true,
    });
    const res = await POST(makePostRequest("http://localhost/api/v1/assessment-levels", { ageYear: 8, ageMonth: 6, australianYear: "Year 3" }) as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({ ageYear: 8, ageMonth: 6 });
  });
});
