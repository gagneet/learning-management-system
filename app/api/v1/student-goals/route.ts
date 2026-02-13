import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/student-goals - List student goals
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);

  const studentId = searchParams.get("studentId");
  const category = searchParams.get("category");
  const isAchieved = searchParams.get("isAchieved");

  try {
    // Build where clause based on role and filters
    const where: any = {};

    // Authorization
    if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      // Parents can see their children's goals
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });

      where.studentId = {
        in: children.map((child) => child.id),
      };
    } else if (user.role !== "SUPER_ADMIN") {
      // Teachers, supervisors, admins - filter by center
      const student = studentId
        ? await prisma.user.findUnique({
            where: { id: studentId },
            select: { centerId: true },
          })
        : null;

      if (student && student.centerId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Apply filters
    if (studentId && user.role !== "STUDENT") {
      where.studentId = studentId;
    }

    if (category) {
      where.category = category;
    }

    if (isAchieved !== null) {
      where.isAchieved = isAchieved === "true";
    }

    const goals = await prisma.studentGoal.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isAchieved: "asc" }, // Not achieved goals first
        { targetDate: "asc" }, // Soonest deadlines first
      ],
    });

    return NextResponse.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error("Error fetching student goals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student goals" },
      { status: 500 }
    );
  }
}

// POST /api/v1/student-goals - Create a new student goal
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Students can set their own goals, teachers/admins can set goals for students
  if (
    ![
      "SUPER_ADMIN",
      "CENTER_ADMIN",
      "CENTER_SUPERVISOR",
      "TEACHER",
      "STUDENT",
    ].includes(user.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { studentId, category, goalText, targetDate } = body;

    // Validation
    if (!studentId || !goalText) {
      return NextResponse.json(
        {
          success: false,
          error: "studentId and goalText are required",
        },
        { status: 400 }
      );
    }

    // Verify student exists and access
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { centerId: true, role: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "User is not a student" },
        { status: 400 }
      );
    }

    // Students can only set goals for themselves
    if (user.role === "STUDENT" && studentId !== user.id) {
      return NextResponse.json(
        { error: "Students can only set goals for themselves" },
        { status: 403 }
      );
    }

    // Others must have center access
    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "STUDENT" &&
      student.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create student goal
    const goal = await prisma.studentGoal.create({
      data: {
        studentId,
        category,
        goalText,
        targetDate: targetDate ? new Date(targetDate) : null,
        isAchieved: false,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: goal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating student goal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create student goal" },
      { status: 500 }
    );
  }
}
