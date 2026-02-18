import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
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
    const body = await request.json();
    const { name, subject, teacherId, startDate, endDate, maxCapacity, gradeMin, gradeMax } = body;

    const updatedClass = await prisma.classCohort.update({
      where: { id },
      data: {
        name,
        subject,
        teacherId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        maxCapacity,
        gradeMin,
        gradeMax,
      },
    });

    return NextResponse.json({ success: true, data: updatedClass });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
