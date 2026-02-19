import { prisma } from '@/lib/prisma';

/**
 * Fetches comprehensive daily overview data for a tutor.
 * Optimized for performance by:
 * 1. Filtering for active enrollments only (completedAt: null)
 * 2. Limiting the number of students processed for attention analysis
 * 3. Using direct database queries instead of internal API calls
 */
export async function getTutorMyDayData(tutorId: string, centreId: string) {
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Stage 1: Fetch base data in parallel.
  const [
    todaySessions,
    helpRequests,
    pendingMarking,
    activeEnrollments,
  ] = await Promise.all([
    // 1. Today's sessions
    prisma.session.findMany({
      where: {
        tutorId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        studentEnrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            course: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        attendanceRecords: {
          select: {
            studentId: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    }),

    // 2. Active help requests (PENDING or ACKNOWLEDGED)
    prisma.helpRequest.findMany({
      where: {
        status: {
          in: ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS'],
        },
        session: {
          tutorId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        exercise: {
          select: {
            title: true,
            exerciseType: true,
          },
        },
        session: {
          select: {
            title: true,
            startTime: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: 20,
    }),

    // 3. Pending marking (SUBMITTED homework)
    prisma.homeworkAssignment.findMany({
      where: {
        centreId,
        status: 'SUBMITTED',
        course: {
          teacherId: tutorId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
        exercise: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'asc', // Oldest first
      },
      take: 20,
    }),

    // 4. Active students (for attention analysis)
    // ⚡ Bolt Optimization: Filter by completedAt: null to only process active students
    // and limit to 100 most recent to ensure predictable performance.
    prisma.enrollment.findMany({
      where: {
        course: {
          teacherId: tutorId,
          centerId: centreId,
        },
        completedAt: null, // Only active students
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc',
      },
      take: 100,
    }),
  ]);

  // Stage 2: Extract unique student IDs and fetch recent activity specifically for them.
  const studentIds = Array.from(new Set(activeEnrollments.map((e) => e.user.id)));

  const recentActivity = await prisma.exerciseAttempt.findMany({
    where: {
      studentId: { in: studentIds },
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      studentId: true,
      score: true,
      maxScore: true,
    },
  });

  // Calculate students needing attention
  const studentMap = new Map();
  activeEnrollments.forEach((enrollment) => {
    const studentId = enrollment.user.id;
    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, {
        ...enrollment.user,
        courses: [],
        totalProgress: 0,
        attemptsCount: 0,
        attemptsTotal: 0,
      });
    }
    const student = studentMap.get(studentId);
    student.courses.push({
      title: enrollment.course.title,
      progress: enrollment.progress,
    });
    student.totalProgress += enrollment.progress;
  });

  // Add attempt data
  recentActivity.forEach((attempt) => {
    if (studentMap.has(attempt.studentId)) {
      const student = studentMap.get(attempt.studentId);
      student.attemptsCount++;
      student.attemptsTotal += attempt.maxScore > 0 && attempt.score !== null ? (attempt.score / attempt.maxScore) * 100 : 0;
    }
  });

  const studentsNeedingAttention = Array.from(studentMap.values())
    .map((student: any) => ({
      ...student,
      averageProgress: student.courses.length > 0 ? student.totalProgress / student.courses.length : 0,
      averageScore: student.attemptsCount > 0 ? student.attemptsTotal / student.attemptsCount : 0,
    }))
    .filter((student: any) => student.averageProgress < 50 || student.averageScore < 60)
    .sort((a: any, b: any) => a.averageProgress - b.averageProgress)
    .slice(0, 10);

  // Calculate stats
  const stats = {
    sessionsToday: todaySessions.length,
    activeHelpRequests: helpRequests.length,
    pendingMarking: pendingMarking.length,
    studentsNeedingAttention: studentsNeedingAttention.length,
    totalStudents: studentMap.size,
    completedSessions: todaySessions.filter((s) => s.status === 'COMPLETED').length,
    upcomingSessions: todaySessions.filter((s) => s.status === 'SCHEDULED').length,
  };

  return {
    success: true,
    date: today.toISOString(),
    todaySessions,
    helpRequests,
    pendingMarking,
    studentsNeedingAttention,
    stats,
  };
}
