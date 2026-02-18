import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * GET /api/academic/classes/[id]/schedule - List schedule rules for a class
 * POST /api/academic/classes/[id]/schedule - Add a new schedule rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;

  try {
    // Verify class exists and check center access
    const classCohort = await prisma.classCohort.findUnique({
      where: { id },
      select: { centreId: true }
    });

    if (!classCohort) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && classCohort.centreId !== user.centerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rules = await prisma.classScheduleRule.findMany({
      where: {
        classId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error("Error fetching schedule rules:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const body = await request.json();
    const {
      recurrence,
      startDate,
      endDate,
      daysOfWeek,
      startTime,
      durationMin,
      timezone,
    } = body;

    // Validate required fields
    if (!startDate || !startTime) {
      return NextResponse.json(
        { error: "startDate and startTime are required" },
        { status: 400 }
      );
    }

    // Validate startTime format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(startTime)) {
      return NextResponse.json(
        { error: "startTime must be in HH:MM format" },
        { status: 400 }
      );
    }

    const newRule = await prisma.classScheduleRule.create({
      data: {
        classId: id,
        centreId: user.centerId!,
        recurrence: recurrence || "WEEKLY",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        daysOfWeek: daysOfWeek || [],
        startTime,
        durationMin: durationMin || 60,
        timezone: timezone || "Australia/Sydney",
      },
    });

    // Trigger session generation (Async/Background or inline for now)
    // For now, let's do it inline to show it works
    await generateSessionsFromRule(newRule.id);

    return NextResponse.json({ success: true, data: newRule }, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule rule:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function generateSessionsFromRule(ruleId: string) {
  const rule = await prisma.classScheduleRule.findUnique({
    where: { id: ruleId },
    include: { class: true },
  });

  if (!rule || rule.recurrence !== "WEEKLY" || !rule.daysOfWeek.length) return;

  const sessions = [];
  const start = new Date(rule.startDate);
  // Generate sessions for the next 12 weeks or until endDate
  const endLimit = rule.endDate ? new Date(rule.endDate) : new Date(start.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);

  // Safety check to prevent infinite loop or excessive iterations
  const maxIterations = 365;
  let iterationCount = 0;

  let current = new Date(start);
  while (current <= endLimit && iterationCount < maxIterations) {
    iterationCount++;
    if (rule.daysOfWeek.includes(current.getDay())) {
      // Create session for this day
      const sessionStart = new Date(current);
      const [hours, minutes] = rule.startTime.split(':').map(Number);
      sessionStart.setHours(hours, minutes, 0, 0);

      const sessionEnd = new Date(sessionStart.getTime() + rule.durationMin * 60 * 1000);

      sessions.push({
        centreId: rule.centreId,
        classId: rule.classId,
        tutorId: rule.class.teacherId,
        title: `${rule.class.name} - Session`,
        startTime: sessionStart,
        endTime: sessionEnd,
        status: "SCHEDULED",
        sessionMode: "PHYSICAL", // Default
        provider: "OTHER",
        timezone: rule.timezone,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  // Bulk create sessions (skipDuplicates to avoid overlaps if schema supported it,
  // but here we manually filter against existing sessions)
  if (sessions.length > 0) {
    // Basic uniqueness guard: check existing sessions for this class and startTimes
    const startTimes = sessions.map(s => s.startTime);
    const existing = await prisma.session.findMany({
      where: {
        classId: rule.classId,
        startTime: { in: startTimes }
      },
      select: { startTime: true }
    });

    const existingTimes = new Set(existing.map(e => e.startTime.getTime()));
    const newSessions = sessions.filter(s => !existingTimes.has(s.startTime.getTime()));

    if (newSessions.length > 0) {
      await prisma.session.createMany({
        data: newSessions as any,
      });
    }
  }
}
