import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  if (!["CENTER_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { studentId } = await request.json();

    const membership = await prisma.classMembership.create({
      data: {
        classId: id,
        studentId,
        centreId: user.centerId!,
      },
    });

    // Update enrollment count
    await prisma.classCohort.update({
      where: { id },
      data: { currentEnrollment: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: membership });
  } catch (error) {
    console.error("Error adding student to class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  if (!["CENTER_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }

  try {
    await prisma.classMembership.delete({
      where: {
        classId_studentId: {
          classId: id,
          studentId,
        },
      },
    });

    // Update enrollment count
    await prisma.classCohort.update({
      where: { id },
      data: { currentEnrollment: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing student from class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
