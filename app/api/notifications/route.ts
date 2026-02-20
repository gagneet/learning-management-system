import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Fetch user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, read } = body;

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
    }

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id // Ensure user owns the notification
      },
      data: { read: read !== undefined ? read : true },
    });

    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user: authUser } = session;
    const body = await request.json();
    const { type, userId, title, message, link, priority, data } = body;

    // Validate required fields
    if (!type || !userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Authorization check: Only admin roles can notify anyone
    const isAdmin = ["SUPER_ADMIN", "CENTER_ADMIN", "CENTER_SUPERVISOR"].includes(authUser.role);

    if (!isAdmin) {
      // Non-admins can only notify themselves
      if (userId !== authUser.id) {
        // Tutors can notify students in their courses
        if (authUser.role === "TEACHER") {
          const student = await prisma.enrollment.findFirst({
            where: {
              userId: userId,
              course: {
                teacherId: authUser.id
              }
            }
          });

          if (!student) {
            return NextResponse.json({ error: 'Forbidden: You can only notify your own students' }, { status: 403 });
          }
        } else if (authUser.role === "STUDENT") {
          // Students can notify tutors of their sessions
          const sharedSession = await prisma.studentSessionEnrollment.findFirst({
            where: {
              studentId: authUser.id,
              session: {
                tutorId: userId
              }
            }
          });

          if (!sharedSession) {
            return NextResponse.json({ error: 'Forbidden: You can only notify yourself or your tutors' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        userId,
        title,
        message,
        link,
        priority: priority || 'MEDIUM',
        read: false,
        data: data || {},
      },
    });

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Clear all notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.notification.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
