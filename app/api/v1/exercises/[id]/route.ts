import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/exercises/:id - Get exercise details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: exerciseId } = await params;

  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    centerId: true,
                  },
                },
              },
            },
            unit: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    centerId: true,
                  },
                },
                gradeLevel: {
                  select: {
                    id: true,
                    level: true,
                    label: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: "Exercise not found" },
        { status: 404 }
      );
    }

    // Check center access
    const courseCenter = exercise.lesson.module?.course?.centerId ||
                         exercise.lesson.unit?.course?.centerId;

    if (user.role !== "SUPER_ADMIN" && courseCenter && courseCenter !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Students and parents should not see expected answers
    if (["STUDENT", "PARENT"].includes(user.role)) {
      const { expectedAnswers, ...exerciseWithoutAnswers } = exercise;
      return NextResponse.json({
        success: true,
        data: exerciseWithoutAnswers,
      });
    }

    return NextResponse.json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    console.error("Error fetching exercise:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch exercise" },
      { status: 500 }
    );
  }
}
