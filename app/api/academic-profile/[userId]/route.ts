import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/academic-profile/[userId] - Get academic profile for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { userId } = await params;

  try {
    // Check if user has permission to view this profile
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, centerId: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Students can only view their own profile
    // Tutors can view their students' profiles
    // Admins can view all profiles in their center
    // Super admins can view all profiles
    if (
      user.role === "STUDENT" &&
      userId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      targetUser.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get or create academic profile
    let profile = await prisma.academicProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create profile if it doesn't exist (for students)
    if (!profile && targetUser.role === "STUDENT") {
      profile = await prisma.academicProfile.create({
        data: {
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching academic profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch academic profile" },
      { status: 500 }
    );
  }
}

// PUT /api/academic-profile/[userId] - Update academic profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { userId } = await params;

  // Only teachers, supervisors, and admins can update academic profiles
  if (!["TEACHER", "CENTER_SUPERVISOR", "CENTER_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      chronologicalAge,
      readingAge,
      numeracyAge,
      comprehensionIndex,
      writingProficiency,
      subjectLevels,
    } = body;

    // Check if user exists and is in the same center
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, centerId: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      targetUser.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate subjectLevels if provided
    if (subjectLevels && typeof subjectLevels !== 'object') {
      return NextResponse.json({ error: "subjectLevels must be an object" }, { status: 400 });
    }

    // Update or create profile
    const profile = await prisma.academicProfile.upsert({
      where: { userId },
      update: {
        chronologicalAge,
        readingAge,
        numeracyAge,
        comprehensionIndex,
        writingProficiency,
        subjectLevels: subjectLevels || undefined,
      },
      create: {
        userId,
        chronologicalAge,
        readingAge,
        numeracyAge,
        comprehensionIndex,
        writingProficiency,
        subjectLevels: subjectLevels || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating academic profile:", error);
    return NextResponse.json(
      { error: "Failed to update academic profile" },
      { status: 500 }
    );
  }
}
