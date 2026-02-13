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

    // TODO: Once Notification model is added to Prisma schema, fetch from database
    // For now, return empty array or mock data
    // const notifications = await prisma.notification.findMany({
    //   where: { userId: session.user.id },
    //   orderBy: { createdAt: 'desc' },
    //   take: 50,
    // });

    // Mock notifications for development
    const mockNotifications = [];

    return NextResponse.json({
      notifications: mockNotifications,
      count: mockNotifications.length,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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

    const body = await request.json();
    const { type, userId, title, message, link, priority, data } = body;

    // Validate required fields
    if (!type || !userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Once Notification model is added to Prisma schema, create in database
    // const notification = await prisma.notification.create({
    //   data: {
    //     type,
    //     userId,
    //     title,
    //     message,
    //     link,
    //     priority: priority || 'MEDIUM',
    //     read: false,
    //     data: data || {},
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Notification created (mock mode)',
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

    // TODO: Once Notification model is added to Prisma schema, delete from database
    // await prisma.notification.deleteMany({
    //   where: { userId: session.user.id },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
