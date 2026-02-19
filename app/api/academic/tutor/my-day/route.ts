import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTutorMyDayData } from '@/lib/academic/tutor-actions';

/**
 * GET /api/academic/tutor/my-day
 *
 * Returns a comprehensive daily overview for tutors.
 * Refactored to use shared utility function for performance and consistency.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only tutors can access this endpoint
    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tutorId = session.user.id;
    const centreId = session.user.centerId;

    if (!centreId) {
      return NextResponse.json({ error: 'Centre ID is required' }, { status: 400 });
    }

    const data = await getTutorMyDayData(tutorId, centreId);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching tutor my-day:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
