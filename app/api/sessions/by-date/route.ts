import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/sessions/by-date?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include full end date

    // Build query based on user role
    const whereClause: any = {
      startTime: {
        gte: start,
        lte: end,
      },
    };

    // Filter by tutor for TEACHER role
    if (session.user.role === 'TEACHER') {
      whereClause.tutorId = session.user.id;
    }

    // Filter by centre for non-SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      whereClause.centreId = session.user.centerId;
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        tutor: {
          select: {
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
            slug: true,
          },
        },
        students: {
          select: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            attendanceRecords: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error('Error fetching sessions by date:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
