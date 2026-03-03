import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasPermission(session, Permissions.ASSESSMENT_GRID_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { user } = session;
  const { searchParams } = new URL(request.url);
  const subjectFilter = searchParams.get("subject");
  const statusFilter = searchParams.get("status");

  try {
    const placements = await prisma.studentAgeAssessment.findMany({
      where: {
        centreId:
          user.role !== "SUPER_ADMIN" ? (user.centerId ?? undefined) : undefined,
        status: statusFilter
          ? (statusFilter as string)
          : { not: "ARCHIVED" },
        subject: subjectFilter ? (subjectFilter as any) : undefined,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            dateOfBirth: true,
            academicProfile: { select: { chronologicalAge: true } },
          },
        },
        currentAge: {
          select: {
            displayLabel: true,
            australianYear: true,
            ageYear: true,
          },
        },
        initialAge: { select: { displayLabel: true } },
        placedBy: { select: { name: true } },
        _count: { select: { lessonCompletions: true, promotionAttempts: true } },
      },
      orderBy: [{ subject: "asc" }, { student: { name: "asc" } }],
    });

    // Build CSV header row
    const headers = [
      "Student Name",
      "Email",
      "Date of Birth",
      "Chronological Age",
      "Subject",
      "Current Level",
      "Australian Year",
      "Initial Level",
      "Lessons Completed",
      "Ready for Promotion",
      "Status",
      "Promotion Attempts",
      "Placed By",
      "Placed At",
      "Last Updated",
    ];

    const rows = placements.map((p) => {
      const dob = p.student.dateOfBirth;
      const chronoAge =
        p.student.academicProfile?.chronologicalAge ??
        (dob
          ? Math.floor(
              ((Date.now() - new Date(dob).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)) *
                10
            ) / 10
          : "");

      return [
        p.student.name ?? "",
        p.student.email,
        dob ? new Date(dob).toLocaleDateString("en-AU") : "",
        chronoAge,
        p.subject,
        p.currentAge.displayLabel,
        p.currentAge.australianYear ?? "",
        p.initialAge?.displayLabel ?? "",
        p.lessonsCompleted,
        p.readyForPromotion ? "Yes" : "No",
        p.status,
        p._count.promotionAttempts,
        p.placedBy?.name ?? "",
        new Date(p.placedAt).toLocaleDateString("en-AU"),
        new Date(p.updatedAt).toLocaleDateString("en-AU"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `assessment-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating assessment export:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
