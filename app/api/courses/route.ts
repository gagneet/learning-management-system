import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/courses - List courses
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const where: any = {
      centerId: user.centerId,
    };

    if (status) {
      where.status = status;
    }

    // Students only see published courses
    if (user.role === "STUDENT") {
      where.status = "PUBLISHED";
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only teachers and admins can create courses
  if (!["SUPER_ADMIN", "CENTER_ADMIN", "TEACHER"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, slug, thumbnail } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists in this center
    const existingCourse = await prisma.course.findUnique({
      where: {
        centerId_slug: {
          centerId: user.centerId,
          slug,
        },
      },
    });

    if (existingCourse) {
      return NextResponse.json(
        { error: "A course with this slug already exists in your center" },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        slug,
        thumbnail,
        centerId: user.centerId,
        teacherId: user.id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
