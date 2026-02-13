import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/v1/tutor-notes/:id - Get specific tutor note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: noteId } = await params;

  try {
    const note = await prisma.tutorNote.findUnique({
      where: { id: noteId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            centerId: true,
            parentId: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            session: {
              select: {
                id: true,
                title: true,
                startTime: true,
                sessionMode: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      );
    }

    // Authorization
    if (user.role === "PARENT") {
      // Parents can only see EXTERNAL notes for their children
      if (
        note.visibility !== "EXTERNAL" ||
        note.student.parentId !== user.id
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (user.role === "STUDENT") {
      // Students can only see EXTERNAL notes about themselves
      if (note.visibility !== "EXTERNAL" || note.studentId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (user.role !== "SUPER_ADMIN") {
      // Teachers, supervisors, admins - check center access
      if (note.student.centerId !== user.centerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Error fetching tutor note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tutor note" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/tutor-notes/:id - Update tutor note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: noteId } = await params;

  // Only teachers, supervisors, and admins can update notes
  if (
    ![
      "SUPER_ADMIN",
      "CENTER_ADMIN",
      "CENTER_SUPERVISOR",
      "TEACHER",
    ].includes(user.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { noteType, visibility, content, tags, attachments } = body;

    // Get existing note
    const existing = await prisma.tutorNote.findUnique({
      where: { id: noteId },
      include: {
        student: {
          select: {
            centerId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      );
    }

    // Verify center access
    if (
      user.role !== "SUPER_ADMIN" &&
      existing.student.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only the original tutor or admins can edit
    if (
      user.role === "TEACHER" &&
      existing.tutorId !== user.id
    ) {
      return NextResponse.json(
        { error: "Only the original tutor or admins can edit this note" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (noteType !== undefined) {
      const validNoteTypes = [
        "STRENGTH",
        "WEAKNESS",
        "OBSERVATION",
        "GOAL",
        "CONCERN",
        "ACHIEVEMENT",
      ];
      if (!validNoteTypes.includes(noteType)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid noteType. Must be one of: ${validNoteTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.noteType = noteType;
    }

    if (visibility !== undefined) {
      const validVisibility = ["INTERNAL", "EXTERNAL"];
      if (!validVisibility.includes(visibility)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid visibility. Must be one of: ${validVisibility.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.visibility = visibility;
    }

    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (attachments !== undefined) updateData.attachments = attachments;

    // Update note
    const note = await prisma.tutorNote.update({
      where: { id: noteId },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tutor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            session: {
              select: {
                id: true,
                title: true,
                startTime: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error("Error updating tutor note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tutor note" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/tutor-notes/:id - Delete tutor note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user } = session;
  const { id: noteId } = await params;

  // Only admins can delete notes
  if (!["SUPER_ADMIN", "CENTER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get existing note
    const existing = await prisma.tutorNote.findUnique({
      where: { id: noteId },
      include: {
        student: {
          select: {
            centerId: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      );
    }

    // Verify center access
    if (
      user.role !== "SUPER_ADMIN" &&
      existing.student.centerId !== user.centerId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete note
    await prisma.tutorNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tutor note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tutor note" },
      { status: 500 }
    );
  }
}
