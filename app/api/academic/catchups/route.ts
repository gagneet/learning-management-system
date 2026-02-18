import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/academic/catchups - List catch-up packages
 * POST /api/academic/catchups - Create a new catch-up package manually
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);

  const studentId = searchParams.get("studentId");
  const status = searchParams.get("status");
  const centreId = searchParams.get("centreId") || user.centerId;

  try {
    const where: any = {
      centreId,
    };

    if (user.role === "STUDENT") {
      where.studentId = user.id;
    } else if (user.role === "PARENT") {
      const children = await prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      where.studentId = { in: children.map(c => c.id) };
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      where.status = status;
    }

    const catchups = await prisma.catchUpPackage.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        session: {
          select: {
            id: true,
            title: true,
            startTime: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json({ success: true, data: catchups });
  } catch (error) {
    console.error("Error fetching catchups:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  // Only tutors and admins can create catch-ups
  if (user.role === "STUDENT" || user.role === "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      studentId,
      sessionId,
      attendanceId,
      dueDate,
      resources,
      notes,
    } = body;

    if (!studentId || !sessionId || !attendanceId || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const catchup = await prisma.catchUpPackage.create({
      data: {
        studentId,
        sessionId,
        attendanceId,
        dueDate: new Date(dueDate),
        resources: resources || [],
        notes,
        centreId: user.centerId!,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: catchup }, { status: 201 });
  } catch (error) {
    console.error("Error creating catchup:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
