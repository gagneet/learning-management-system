export const LESSON_PLAN_TYPES = ["STANDARD", "MATHEMATICS"] as const;

export type LessonPlanTypeValue = (typeof LESSON_PLAN_TYPES)[number];

export const LESSON_PLAN_SECTION_ORDER = [
  "overview",
  "warmUp",
  "directInstruction",
  "guidedPractice",
  "independentPractice",
  "assessment",
  "homework",
  "resources",
] as const;

export type LessonPlanSectionKey = (typeof LESSON_PLAN_SECTION_ORDER)[number];

export const LESSON_PLAN_SECTION_LABELS: Record<LessonPlanSectionKey, string> = {
  overview: "Lesson overview",
  warmUp: "Warm-up",
  directInstruction: "Direct instruction",
  guidedPractice: "Guided practice",
  independentPractice: "Independent practice",
  assessment: "Assessment / checks for understanding",
  homework: "Homework / extension",
  resources: "Resources and materials",
};

export interface LessonPlanMathExpression {
  id: string;
  title: string;
  latex: string;
  notes?: string;
}

export interface LessonPlanFormValues {
  planType: LessonPlanTypeValue;
  estimatedDuration: number | null;
  objectives: string[];
  overview: string;
  warmUp: string;
  directInstruction: string;
  guidedPractice: string;
  independentPractice: string;
  assessment: string;
  homework: string;
  resources: string;
  teacherNotes: string;
  mathExpressions: LessonPlanMathExpression[];
}

export const EMPTY_LESSON_PLAN_VALUES: LessonPlanFormValues = {
  planType: "STANDARD",
  estimatedDuration: 60,
  objectives: [],
  overview: "",
  warmUp: "",
  directInstruction: "",
  guidedPractice: "",
  independentPractice: "",
  assessment: "",
  homework: "",
  resources: "",
  teacherNotes: "",
  mathExpressions: [],
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

export function normalizeObjectives(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

export function normalizeMathExpressions(value: unknown): LessonPlanMathExpression[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const expressions: LessonPlanMathExpression[] = [];

  for (const entry of value) {
    const record = asRecord(entry);
    if (!record) {
      continue;
    }

    const title = normalizeText(record.title);
    const latex = normalizeText(record.latex);

    if (!title || !latex) {
      continue;
    }

    expressions.push({
      id:
        normalizeText(record.id) ||
        `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${latex.length}`,
      title,
      latex,
      notes: normalizeText(record.notes) || undefined,
    });
  }

  return expressions;
}

export function normalizePlanType(value: unknown): LessonPlanTypeValue {
  return value === "MATHEMATICS" ? "MATHEMATICS" : "STANDARD";
}

export function lessonPlanFromSource(source?: Partial<Record<string, unknown>> | null): LessonPlanFormValues {
  return {
    planType: normalizePlanType(source?.planType),
    estimatedDuration:
      typeof source?.estimatedDuration === "number" && Number.isFinite(source.estimatedDuration)
        ? source.estimatedDuration
        : EMPTY_LESSON_PLAN_VALUES.estimatedDuration,
    objectives: normalizeObjectives(source?.objectives),
    overview: normalizeText(source?.overview),
    warmUp: normalizeText(source?.warmUp),
    directInstruction: normalizeText(source?.directInstruction),
    guidedPractice: normalizeText(source?.guidedPractice),
    independentPractice: normalizeText(source?.independentPractice),
    assessment: normalizeText(source?.assessment),
    homework: normalizeText(source?.homework),
    resources: normalizeText(source?.resources),
    teacherNotes: normalizeText(source?.teacherNotes),
    mathExpressions: normalizeMathExpressions(source?.mathExpressions),
  };
}

export function hasLessonPlanContent(values: LessonPlanFormValues): boolean {
  return (
    values.objectives.length > 0 ||
    values.mathExpressions.length > 0 ||
    LESSON_PLAN_SECTION_ORDER.some((key) => values[key].trim().length > 0) ||
    values.teacherNotes.trim().length > 0
  );
}
