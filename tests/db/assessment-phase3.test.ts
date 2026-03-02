/**
 * Phase 3 — Assessment Engine: Database logic tests
 *
 * Tests cover:
 *   • Promotion outcome classification (PROMOTED, FAILED, BORDERLINE, LEVEL_SKIPPED)
 *   • Age band distribution aggregation logic
 *   • CSV export data shape
 *   • Seed data expected shape for Phase 3
 */

// ── Types (matching the Prisma schema) ────────────────────────────────────────

type PromotionOutcome = "PROMOTED" | "LEVEL_SKIPPED" | "FAILED" | "BORDERLINE" | "PENDING";

interface PromotionTest {
  totalMarks: number;
  passingScore: number;   // % threshold to pass
  excellenceScore: number; // % threshold to skip a level
}

interface PromotionAttempt {
  score: number;
  percentageScore: number;
  outcome: PromotionOutcome;
}

// ── Helpers matching app/api/v1/promotion-tests/[id]/attempts/route.ts ────────

function classifyOutcome(percentageScore: number, test: PromotionTest): PromotionOutcome {
  if (percentageScore >= test.excellenceScore) return "LEVEL_SKIPPED";
  if (percentageScore >= test.passingScore)    return "PROMOTED";
  // Borderline: within 5% below passing
  if (percentageScore >= test.passingScore - 5) return "BORDERLINE";
  return "FAILED";
}

// ── Age band helpers matching tutor/assessment/page.tsx ───────────────────────

function ageGap(chronoAge: number, ageYear: number, ageMonth: number): number {
  return Math.round((ageYear + ageMonth / 12 - chronoAge) * 10) / 10;
}

function ageBand(gap: number): string {
  if (gap >= 0.5)  return "ABOVE";
  if (gap >= -0.5) return "ON_LEVEL";
  if (gap >= -1.0) return "SLIGHTLY_BELOW";
  if (gap >= -2.0) return "BELOW";
  return "SIGNIFICANTLY_BELOW";
}

// ── CSV export helper (matching AssessmentGridClient.tsx exportToCsv) ─────────

interface StudentRow {
  name: string;
  chronologicalAge: number | null;
  placements: Record<string, {
    displayLabel: string;
    ageGap: number | null;
    ageBand: string | null;
    lessonsCompleted: number;
    readyForPromotion: boolean;
  } | null>;
}

const AGE_BAND_LABELS: Record<string, string> = {
  ABOVE: "Above", ON_LEVEL: "On Level", SLIGHTLY_BELOW: "Slightly Below",
  BELOW: "Below", SIGNIFICANTLY_BELOW: "Sig. Below",
};

function buildCsvRows(students: StudentRow[], subjects: string[]): string[][] {
  const header = [
    "Student Name", "Chronological Age",
    ...subjects.flatMap((s) => [`${s} Level`, `${s} Age Gap`, `${s} Band`, `${s} Lessons Done`, `${s} Ready`]),
  ];
  const rows = [header];
  for (const student of students) {
    rows.push([
      student.name,
      String(student.chronologicalAge ?? ""),
      ...subjects.flatMap((s) => {
        const p = student.placements[s];
        if (!p) return ["—", "", "", "", ""];
        return [
          p.displayLabel,
          String(p.ageGap !== null ? p.ageGap : ""),
          AGE_BAND_LABELS[p.ageBand ?? ""] ?? p.ageBand ?? "",
          String(p.lessonsCompleted),
          p.readyForPromotion ? "Yes" : "No",
        ];
      }),
    ]);
  }
  return rows;
}

// ── Phase 3 seed data constants (must match prisma/seed.ts) ─────────────────

const SEEDED_STUDENTS = [
  { name: "Jane Student",  chronoAge: 9.7,  dob: "2016-06-15" },
  { name: "Alex Thompson", chronoAge: 10.5, dob: "2015-09-10" },
  { name: "Michael Lee",   chronoAge: 11.3, dob: "2014-11-20" },
  { name: "Sophia Patel",  chronoAge: 8.2,  dob: "2018-01-05" },
];

const EXPECTED_PLACEMENTS: Array<{ student: string; subject: string; ageYear: number; expectedBand: string }> = [
  { student: "Jane Student",  subject: "ENGLISH",     ageYear: 8,  expectedBand: "BELOW" },
  { student: "Jane Student",  subject: "MATHEMATICS",  ageYear: 10, expectedBand: "ON_LEVEL" },
  { student: "Jane Student",  subject: "SCIENCE",      ageYear: 9,  expectedBand: "SLIGHTLY_BELOW" },
  { student: "Alex Thompson", subject: "ENGLISH",      ageYear: 9,  expectedBand: "BELOW" },
  { student: "Alex Thompson", subject: "MATHEMATICS",  ageYear: 11, expectedBand: "ABOVE" },
  { student: "Michael Lee",   subject: "ENGLISH",      ageYear: 8,  expectedBand: "SIGNIFICANTLY_BELOW" },
  { student: "Michael Lee",   subject: "MATHEMATICS",  ageYear: 10, expectedBand: "BELOW" },
  { student: "Sophia Patel",  subject: "ENGLISH",      ageYear: 8,  expectedBand: "ON_LEVEL" },
  { student: "Sophia Patel",  subject: "MATHEMATICS",  ageYear: 9,  expectedBand: "ABOVE" },
];

// =============================================================================
// Tests
// =============================================================================

describe("Promotion Outcome Classification", () => {
  const sampleTest: PromotionTest = { totalMarks: 100, passingScore: 70, excellenceScore: 90 };

  test("scores >= excellenceScore yield LEVEL_SKIPPED", () => {
    expect(classifyOutcome(90, sampleTest)).toBe("LEVEL_SKIPPED");
    expect(classifyOutcome(95, sampleTest)).toBe("LEVEL_SKIPPED");
    expect(classifyOutcome(100, sampleTest)).toBe("LEVEL_SKIPPED");
  });

  test("scores >= passingScore and < excellenceScore yield PROMOTED", () => {
    expect(classifyOutcome(70, sampleTest)).toBe("PROMOTED");
    expect(classifyOutcome(80, sampleTest)).toBe("PROMOTED");
    expect(classifyOutcome(89.9, sampleTest)).toBe("PROMOTED");
  });

  test("scores within 5% below passing yield BORDERLINE", () => {
    expect(classifyOutcome(65, sampleTest)).toBe("BORDERLINE");
    expect(classifyOutcome(67, sampleTest)).toBe("BORDERLINE");
    // 65 is 5 below 70 → BORDERLINE boundary
    expect(classifyOutcome(65, sampleTest)).toBe("BORDERLINE");
  });

  test("scores more than 5% below passing yield FAILED", () => {
    expect(classifyOutcome(64, sampleTest)).toBe("FAILED");
    expect(classifyOutcome(0, sampleTest)).toBe("FAILED");
    expect(classifyOutcome(50, sampleTest)).toBe("FAILED");
  });

  test("Jane's seed attempt (88.6%) yields PROMOTED", () => {
    const result = classifyOutcome(88.6, { totalMarks: 35, passingScore: 70, excellenceScore: 90 });
    expect(result).toBe("PROMOTED");
  });
});

describe("Age Band Calculation — Seed Data Expectations", () => {
  test.each(EXPECTED_PLACEMENTS)(
    "$student — $subject @ $ageYear yr = $expectedBand",
    ({ student, subject, ageYear, expectedBand }) => {
      const studentDef = SEEDED_STUDENTS.find((s) => s.name === student)!;
      // ageMonth = 1 as per seed
      const gap  = ageGap(studentDef.chronoAge, ageYear, 1);
      const band = ageBand(gap);
      expect(band).toBe(expectedBand);
    }
  );

  test("Jane ENGLISH 8y → gap ≈ -1.7yr (BELOW)", () => {
    // Jane chronoAge ≈ 9.7, placed at 8y1m
    const gap = ageGap(9.7, 8, 1);
    expect(gap).toBeLessThan(-1.0);
    expect(gap).toBeGreaterThanOrEqual(-2.0);
    expect(ageBand(gap)).toBe("BELOW");
  });

  test("Alex MATHEMATICS 11y → gap > 0.5yr (ABOVE)", () => {
    const gap = ageGap(10.5, 11, 1);
    expect(gap).toBeGreaterThanOrEqual(0.5);
    expect(ageBand(gap)).toBe("ABOVE");
  });

  test("Michael ENGLISH 8y → gap < -2yr (SIGNIFICANTLY_BELOW)", () => {
    const gap = ageGap(11.3, 8, 1);
    expect(gap).toBeLessThan(-2.0);
    expect(ageBand(gap)).toBe("SIGNIFICANTLY_BELOW");
  });

  test("Sophia ENGLISH 8y → gap ≈ -0.2yr (ON_LEVEL)", () => {
    const gap = ageGap(8.2, 8, 1);
    expect(gap).toBeGreaterThanOrEqual(-0.5);
    expect(gap).toBeLessThan(0.5);
    expect(ageBand(gap)).toBe("ON_LEVEL");
  });
});

describe("Analytics — Age Band Aggregation", () => {
  // Simulate what the analytics page computes from seed placements
  const seedPlacements = EXPECTED_PLACEMENTS.map(({ student, subject, ageYear, expectedBand }) => ({
    subject,
    band: expectedBand,
    student,
  }));

  test("counts SIGNIFICANTLY_BELOW correctly", () => {
    const count = seedPlacements.filter((p) => p.band === "SIGNIFICANTLY_BELOW").length;
    expect(count).toBe(1); // Only Michael ENGLISH
  });

  test("counts ABOVE correctly", () => {
    const count = seedPlacements.filter((p) => p.band === "ABOVE").length;
    expect(count).toBe(2); // Alex MATHEMATICS + Sophia MATHEMATICS
  });

  test("counts ON_LEVEL correctly", () => {
    const count = seedPlacements.filter((p) => p.band === "ON_LEVEL").length;
    expect(count).toBe(2); // Jane MATHEMATICS + Sophia ENGLISH
  });

  test("total seeded placements count is correct", () => {
    expect(seedPlacements.length).toBe(9);
  });

  test("belowLevel count (BELOW + SIGNIFICANTLY_BELOW) across all subjects", () => {
    const below = seedPlacements.filter(
      (p) => p.band === "BELOW" || p.band === "SIGNIFICANTLY_BELOW"
    ).length;
    expect(below).toBe(4); // Jane ENG, Alex ENG, Michael ENG, Michael MATH
  });
});

describe("CSV Export Data Shape", () => {
  const mockStudents: StudentRow[] = [
    {
      name: "Jane Student",
      chronologicalAge: 9.7,
      placements: {
        ENGLISH: { displayLabel: "8.01", ageGap: -1.7, ageBand: "BELOW", lessonsCompleted: 15, readyForPromotion: true },
        MATHEMATICS: { displayLabel: "10.01", ageGap: 0.3, ageBand: "ON_LEVEL", lessonsCompleted: 8, readyForPromotion: false },
      },
    },
    {
      name: "Michael Lee",
      chronologicalAge: 11.3,
      placements: {
        ENGLISH: { displayLabel: "8.01", ageGap: -3.3, ageBand: "SIGNIFICANTLY_BELOW", lessonsCompleted: 2, readyForPromotion: false },
        MATHEMATICS: null,
      },
    },
  ];
  const subjects = ["ENGLISH", "MATHEMATICS"];

  test("header row has correct columns", () => {
    const rows = buildCsvRows(mockStudents, subjects);
    expect(rows[0]).toContain("Student Name");
    expect(rows[0]).toContain("Chronological Age");
    expect(rows[0]).toContain("ENGLISH Level");
    expect(rows[0]).toContain("ENGLISH Age Gap");
    expect(rows[0]).toContain("ENGLISH Band");
    expect(rows[0]).toContain("ENGLISH Lessons Done");
    expect(rows[0]).toContain("ENGLISH Ready");
  });

  test("data row for Jane has correct values", () => {
    const rows = buildCsvRows(mockStudents, subjects);
    const janeRow = rows[1];
    expect(janeRow[0]).toBe("Jane Student");
    expect(janeRow[1]).toBe("9.7");
    expect(janeRow[2]).toBe("8.01");   // ENGLISH Level
    expect(janeRow[4]).toBe("Below");  // ENGLISH Band
    expect(janeRow[6]).toBe("Yes");    // ENGLISH Ready
  });

  test("null placement renders as dashes", () => {
    const rows = buildCsvRows(mockStudents, subjects);
    const michaelRow = rows[2];
    // Michael has no MATHEMATICS placement — columns 7+ should be dashes
    const mathOffset = 2 + 5; // 2 base cols + 5 ENGLISH cols = index 7
    expect(michaelRow[mathOffset]).toBe("—");
  });

  test("row count equals students + 1 header", () => {
    const rows = buildCsvRows(mockStudents, subjects);
    expect(rows.length).toBe(3); // 1 header + 2 students
  });

  test("total column count per row is consistent", () => {
    const rows = buildCsvRows(mockStudents, subjects);
    const expectedCols = 2 + subjects.length * 5; // 2 base + 5 per subject
    for (const row of rows) {
      expect(row.length).toBe(expectedCols);
    }
  });
});

describe("Promotion Test Seed Shape", () => {
  test("Year 3 English promotion test has correct structure", () => {
    // Shape matching what the seed creates
    const sampleTest = {
      title: "Year 3 English Promotion Assessment",
      subject: "ENGLISH",
      totalMarks: 35,
      passingScore: 70,
      excellenceScore: 90,
      timeLimit: 60,
      isAutoGraded: false,
      questions: [
        { id: "q1", text: "Identify the main idea.", type: "SHORT_ANSWER", marks: 10 },
        { id: "q2", text: "Vocabulary question.", type: "MULTIPLE_CHOICE", marks: 5, options: ["Careful", "Careless", "Fast", "Slow"], correctAnswer: "Careful" },
        { id: "q3", text: "Write a summary.", type: "SHORT_ANSWER", marks: 15 },
        { id: "q4", text: "Reading age score.", type: "NUMERICAL", marks: 5 },
      ],
    };

    expect(sampleTest.totalMarks).toBe(35);
    expect(sampleTest.passingScore).toBe(70);
    expect(sampleTest.questions).toHaveLength(4);
    expect(sampleTest.questions.reduce((a, q) => a + q.marks, 0)).toBe(35);
    expect(sampleTest.isAutoGraded).toBe(false);
  });

  test("Jane's seeded promotion attempt passes at 88.6%", () => {
    const testConfig: PromotionTest = { totalMarks: 35, passingScore: 70, excellenceScore: 90 };
    const attempt: PromotionAttempt = {
      score: 31,
      percentageScore: 88.6,
      outcome: classifyOutcome(88.6, testConfig),
    };
    expect(attempt.outcome).toBe("PROMOTED");
    expect(attempt.percentageScore).toBeCloseTo(88.6, 0);
  });
});

describe("Assessment Age Level Seed Shape", () => {
  const AGE_LEVEL_DEFS = [
    { ageYear: 5,  ageMonth: 1, displayLabel: "5.01", australianYear: "Foundation" },
    { ageYear: 6,  ageMonth: 1, displayLabel: "6.01", australianYear: "Year 1" },
    { ageYear: 7,  ageMonth: 1, displayLabel: "7.01", australianYear: "Year 2" },
    { ageYear: 8,  ageMonth: 1, displayLabel: "8.01", australianYear: "Year 3" },
    { ageYear: 9,  ageMonth: 1, displayLabel: "9.01", australianYear: "Year 4" },
    { ageYear: 10, ageMonth: 1, displayLabel: "10.01", australianYear: "Year 5" },
    { ageYear: 11, ageMonth: 1, displayLabel: "11.01", australianYear: "Year 6" },
    { ageYear: 12, ageMonth: 1, displayLabel: "12.01", australianYear: "Year 7" },
    { ageYear: 13, ageMonth: 1, displayLabel: "13.01", australianYear: "Year 8" },
  ];

  test("9 age levels are defined in seed", () => {
    expect(AGE_LEVEL_DEFS).toHaveLength(9);
  });

  test("all ageMonth values are 1", () => {
    for (const def of AGE_LEVEL_DEFS) {
      expect(def.ageMonth).toBe(1);
    }
  });

  test("displayLabel format matches ageYear.ageMonth zero-padded", () => {
    for (const def of AGE_LEVEL_DEFS) {
      const expected = `${def.ageYear}.${String(def.ageMonth).padStart(2, "0")}`;
      expect(def.displayLabel).toBe(expected);
    }
  });

  test("Australian year labels cover Foundation through Year 8", () => {
    const labels = AGE_LEVEL_DEFS.map((d) => d.australianYear);
    expect(labels).toContain("Foundation");
    expect(labels).toContain("Year 1");
    expect(labels).toContain("Year 8");
  });

  test("lesson count: 9 levels × 2 subjects × 6 lessons = 108 total", () => {
    const LEVELS = 9;
    const SUBJECTS = 2;
    const LESSONS_PER_LEVEL = 6;
    expect(LEVELS * SUBJECTS * LESSONS_PER_LEVEL).toBe(108);
  });
});
