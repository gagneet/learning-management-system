import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  LESSON_PLAN_TYPES,
  normalizeMathExpressions,
  normalizeNullableText,
  normalizeObjectives,
  normalizePlanType,
  normalizeText,
} from "@/lib/lesson-plans";

const EDITOR_ROLES = ["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR", "TEACHER"];

function normalizePositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return null;
  }

  return value;
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  if (!EDITOR_ROLES.includes(user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const courseId = normalizeText(body.courseId);
    const moduleId = normalizeText(body.moduleId);
    const lessonId = normalizeText(body.lessonId);
    const newModuleTitle = normalizeText(body.newModuleTitle);
    const lessonTitle = normalizeText(body.lessonTitle);
    const lessonDescription = normalizeNullableText(body.lessonDescription);
    const lessonOrder = normalizePositiveInteger(body.lessonOrder);
    const estimatedDuration = normalizePositiveInteger(body.estimatedDuration);
    const planType = normalizePlanType(body.planType);
    const objectives = normalizeObjectives(body.objectives);
    const mathExpressions = normalizeMathExpressions(body.mathExpressions);
    const objectivesJson = objectives as unknown as Prisma.InputJsonValue;
    const mathExpressionsJson = mathExpressions as unknown as Prisma.InputJsonValue;

    if (!courseId || !lessonTitle) {
      return NextResponse.json(
        { success: false, error: "courseId and lessonTitle are required" },
        { status: 400 }
      );
    }

    if (!moduleId && !newModuleTitle) {
      return NextResponse.json(
        { success: false, error: "Select an existing module or provide a newModuleTitle" },
        { status: 400 }
      );
    }

    if (!LESSON_PLAN_TYPES.includes(planType)) {
      return NextResponse.json(
        { success: false, error: "Invalid lesson plan type" },
        { status: 400 }
      );
    }

    const courseWhere =
      user.role === "SUPER_ADMIN"
        ? { id: courseId }
        : user.role === "TEACHER"
          ? { id: courseId, centerId: user.centerId, teacherId: user.id }
          : { id: courseId, centerId: user.centerId };

    const course = await prisma.course.findFirst({
      where: courseWhere,
      select: {
        id: true,
        slug: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found or not accessible" },
        { status: 404 }
      );
    }

    const lessonPlan = await prisma.$transaction(async (tx) => {
      let resolvedModuleId = moduleId;
      let resolvedModuleTitle = "";

      if (resolvedModuleId) {
        const existingModule = await tx.module.findFirst({
          where: {
            id: resolvedModuleId,
            courseId: course.id,
          },
          select: {
            id: true,
            title: true,
          },
        });

        if (!existingModule) {
          throw new Error("MODULE_NOT_FOUND");
        }

        resolvedModuleTitle = existingModule.title;
      } else {
        const highestModuleOrder = await tx.module.findFirst({
          where: { courseId: course.id },
          orderBy: { order: "desc" },
          select: { order: true },
        });

        const createdModule = await tx.module.create({
          data: {
            courseId: course.id,
            title: newModuleTitle,
            order: (highestModuleOrder?.order ?? 0) + 1,
          },
          select: {
            id: true,
            title: true,
          },
        });

        resolvedModuleId = createdModule.id;
        resolvedModuleTitle = createdModule.title;
      }

      let lessonRecord;

      if (lessonId) {
        const existingLesson = await tx.lesson.findFirst({
          where: {
            id: lessonId,
            module: {
              courseId: course.id,
            },
          },
          include: {
            plan: true,
          },
        });

        if (!existingLesson) {
          throw new Error("LESSON_NOT_FOUND");
        }

        lessonRecord = await tx.lesson.update({
          where: { id: lessonId },
          data: {
            moduleId: resolvedModuleId,
            title: lessonTitle,
            description: lessonDescription,
            order: lessonOrder ?? existingLesson.order,
          },
          include: {
            plan: true,
          },
        });
      } else {
        const highestLessonOrder = await tx.lesson.findFirst({
          where: { moduleId: resolvedModuleId },
          orderBy: { order: "desc" },
          select: { order: true },
        });

        lessonRecord = await tx.lesson.create({
          data: {
            moduleId: resolvedModuleId,
            title: lessonTitle,
            description: lessonDescription,
            order: lessonOrder ?? (highestLessonOrder?.order ?? 0) + 1,
          },
          include: {
            plan: true,
          },
        });
      }

      const plan = await tx.lessonPlan.upsert({
        where: { lessonId: lessonRecord.id },
        update: {
          planType,
          estimatedDuration,
          objectives: objectivesJson,
          overview: normalizeNullableText(body.overview),
          warmUp: normalizeNullableText(body.warmUp),
          directInstruction: normalizeNullableText(body.directInstruction),
          guidedPractice: normalizeNullableText(body.guidedPractice),
          independentPractice: normalizeNullableText(body.independentPractice),
          assessment: normalizeNullableText(body.assessment),
          homework: normalizeNullableText(body.homework),
          resources: normalizeNullableText(body.resources),
          teacherNotes: normalizeNullableText(body.teacherNotes),
          mathExpressions: mathExpressionsJson,
        },
        create: {
          lessonId: lessonRecord.id,
          planType,
          estimatedDuration,
          objectives: objectivesJson,
          overview: normalizeNullableText(body.overview),
          warmUp: normalizeNullableText(body.warmUp),
          directInstruction: normalizeNullableText(body.directInstruction),
          guidedPractice: normalizeNullableText(body.guidedPractice),
          independentPractice: normalizeNullableText(body.independentPractice),
          assessment: normalizeNullableText(body.assessment),
          homework: normalizeNullableText(body.homework),
          resources: normalizeNullableText(body.resources),
          teacherNotes: normalizeNullableText(body.teacherNotes),
          mathExpressions: mathExpressionsJson,
        },
      });

      return {
        lesson: {
          id: lessonRecord.id,
          title: lessonRecord.title,
          description: lessonRecord.description,
          order: lessonRecord.order,
          moduleId: resolvedModuleId,
          moduleTitle: resolvedModuleTitle,
        },
        plan,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          courseId: course.id,
          courseSlug: course.slug,
          ...lessonPlan,
        },
      },
      { status: lessonId ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "MODULE_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Module not found for the selected course" },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "LESSON_NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "Lesson not found for the selected course" },
        { status: 404 }
      );
    }

    console.error("Error saving lesson plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save lesson plan" },
      { status: 500 }
    );
  }
}
