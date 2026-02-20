import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/v1/student-traits - Create a new strength or weakness
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;
    if (user.role !== "TEACHER" && user.role !== "CENTER_ADMIN" && user.role !== "CENTER_SUPERVISOR" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, courseId, type, description } = body;

    if (!studentId || !type || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trait = await prisma.studentStrengthWeakness.create({
      data: {
        studentId,
        courseId: courseId || null,
        type, // "STRENGTH" or "WEAKNESS"
        description,
        identifiedBy: user.id,
      },
      include: {
        course: {
          select: {
            title: true,
          },
        },
        identifier: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(trait);
  } catch (error) {
    console.error("Error creating student trait:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/v1/student-traits - Get traits for a student
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const traits = await prisma.studentStrengthWeakness.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            title: true,
          },
        },
        identifier: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(traits);
  } catch (error) {
    console.error("Error fetching student traits:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
