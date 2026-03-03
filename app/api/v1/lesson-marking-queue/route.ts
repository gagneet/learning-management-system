import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { user } = session;
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const submittedLessons = await prisma.ageLessonCompletion.findMany({
    where: {
      status: "SUBMITTED",
      placement: { placedById: user.id },
    },
    include: {
      student: { select: { id: true, name: true } },
      lesson: { select: { lessonNumber: true, title: true, subject: true } },
      placement: { select: { id: true, currentAge: { select: { displayLabel: true } } } },
    },
    orderBy: { completedAt: "asc" },
    take: 10,
  });

  return NextResponse.json({ success: true, data: submittedLessons, total: submittedLessons.length });
}
