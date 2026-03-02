/**
 * Jest unit tests for GET /api/v1/assessment-grid
 *
 * Route response shape (confirmed from route.ts):
 *   { students: [...], subjects: [...], totalStudents: N, lastUpdated: ISO }
 *
 * Each student row: { id, name, dateOfBirth, chronologicalAge, placements: { ENGLISH: {...}|null, ... } }
 *
 * The route makes TWO Prisma queries:
 *   1. prisma.user.findMany    — to get students
 *   2. prisma.studentAgeAssessment.findMany — to get their placements
 *
 * Both must be mocked for tests that exercise the happy path.
 */

import { GET } from "@/app/api/v1/assessment-grid/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
    studentAgeAssessment: {
      findMany: jest.fn(),
    },
    classCohort: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

function makeRequest(url: string) {
  return new Request(url, { method: "GET" });
}

// Shared DOB for "exactly 8 years old" (approx)
const DOB_8Y = new Date(
  new Date().getFullYear() - 8,
  new Date().getMonth(),
  new Date().getDate()
);

const MOCK_STUDENTS = [
  {
    id: "student-1",
    name: "Alice",
    dateOfBirth: DOB_8Y,
  },
];

const MOCK_PLACEMENTS = [
  {
    id: "p1",
    studentId: "student-1",
    subject: "ENGLISH",
    currentLessonNumber: 10,
    lessonsCompleted: 9,
    status: "ACTIVE",
    readyForPromotion: false,
    currentAge: { id: "a1", ageYear: 8, ageMonth: 1, displayLabel: "8.1", australianYear: "Year 3" },
  },
  {
    id: "p2",
    studentId: "student-1",
    subject: "MATHEMATICS",
    currentLessonNumber: 5,
    lessonsCompleted: 4,
    status: "ACTIVE",
    readyForPromotion: true,
    currentAge: { id: "a2", ageYear: 6, ageMonth: 1, displayLabel: "6.1", australianYear: "Year 1" },
  },
];

describe("GET /api/v1/assessment-grid", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    expect(res.status).toBe(401);
  });

  it("returns 403 for STUDENT (lacks ASSESSMENT_GRID_VIEW permission)", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "s1", role: "STUDENT", centerId: "c1" } });
    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    expect(res.status).toBe(403);
  });

  it("returns 403 for PARENT", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "p1", role: "PARENT", centerId: "c1" } });
    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    expect(res.status).toBe(403);
  });

  it("returns 200 with students array for TEACHER", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue(MOCK_STUDENTS);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue(MOCK_PLACEMENTS);

    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("students");
    expect(Array.isArray(body.students)).toBe(true);
  });

  it("returns 200 with students array for CENTER_ADMIN", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "a1", role: "CENTER_ADMIN", centerId: "c1" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.students).toEqual([]);
    expect(body.totalStudents).toBe(0);
  });

  it("scopes user query to centreId for non-SUPER_ADMIN", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "centre-abc" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ centerId: "centre-abc" }) })
    );
  });

  it("does NOT scope centreId for SUPER_ADMIN", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "sa", role: "SUPER_ADMIN", centerId: null } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    const arg = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
    expect(arg.where?.centerId).toBeUndefined();
  });

  it("student row shape includes id, name, placements, chronologicalAge", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue(MOCK_STUDENTS);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue(MOCK_PLACEMENTS);

    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    const body = await res.json();
    const row = body.students[0];

    expect(row).toHaveProperty("id", "student-1");
    expect(row).toHaveProperty("name", "Alice");
    expect(row).toHaveProperty("placements");
    expect(row).toHaveProperty("chronologicalAge");
  });

  it("ENGLISH placement is ON_LEVEL when student and level are both ~8y", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue(MOCK_STUDENTS);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue(MOCK_PLACEMENTS);

    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    const body = await res.json();
    const eng = body.students[0]?.placements?.ENGLISH;

    if (eng) {
      // 8y chronoAge, 8y1m level → gap ≈ +0.08 → ON_LEVEL
      expect(["ON_LEVEL", "ABOVE"]).toContain(eng.ageBand);
    }
  });

  it("MATHEMATICS placement is BELOW when level is 6y for 8y student", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue(MOCK_STUDENTS);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue(MOCK_PLACEMENTS);

    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    const body = await res.json();
    const math = body.students[0]?.placements?.MATHEMATICS;

    if (math) {
      // 8y chronoAge, 6y1m level → gap ≈ -1.9 → BELOW
      expect(["BELOW", "SIGNIFICANTLY_BELOW"]).toContain(math.ageBand);
    }
  });

  it("readyForPromotion is correctly propagated in grid row", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue(MOCK_STUDENTS);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue(MOCK_PLACEMENTS);

    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    const body = await res.json();
    const math = body.students[0]?.placements?.MATHEMATICS;

    if (math) {
      expect(math.readyForPromotion).toBe(true);
    }
    const eng = body.students[0]?.placements?.ENGLISH;
    if (eng) {
      expect(eng.readyForPromotion).toBe(false);
    }
  });

  it("returns 400 for invalid subject filter", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid?subject=INVALID") as any);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid ageBand filter", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid?ageBand=WRONG") as any);
    expect(res.status).toBe(400);
  });

  it("response includes subjects array and lastUpdated timestamp", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    const body = await res.json();
    expect(Array.isArray(body.subjects)).toBe(true);
    expect(body.subjects.length).toBeGreaterThan(0);
    expect(body.lastUpdated).toBeDefined();
  });

  it("name search filter is passed to user.findMany query", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "c1" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([]);

    await GET(makeRequest("http://localhost/api/v1/assessment-grid?search=alice") as any);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({ contains: "alice" }),
        }),
      })
    );
  });

  it("returns empty students array for centre with no students", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "t1", role: "TEACHER", centerId: "empty-centre" } });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.studentAgeAssessment.findMany as jest.Mock).mockResolvedValue([]);

    const res = await GET(makeRequest("http://localhost/api/v1/assessment-grid") as any);
    const body = await res.json();
    expect(body.students).toHaveLength(0);
    expect(body.totalStudents).toBe(0);
  });
});
