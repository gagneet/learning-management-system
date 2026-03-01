/**
 * Notification System
 *
 * Handles real-time notifications for:
 * - Help requests (students → tutors)
 * - Homework submissions (students → tutors)
 * - Achievements earned (system → students)
 * - Session updates (system → all)
 * - Parent messages (tutors → parents)
 */

export type NotificationType =
  | 'HELP_REQUEST'
  | 'HOMEWORK_SUBMITTED'
  | 'HOMEWORK_GRADED'
  | 'ACHIEVEMENT_EARNED'
  | 'SESSION_STARTING'
  | 'SESSION_CANCELLED'
  | 'PARENT_MESSAGE'
  | 'TUTOR_NOTE'
  | 'GOAL_ACHIEVED'
  | 'AWARD_REDEEMED'
  | 'AWARD_FULFILLED'
  // Phase 4 — Assessment Engine
  | 'ASSESSMENT_READY_FOR_PROMOTION'
  | 'ASSESSMENT_LESSON_SUBMITTED'
  | 'ASSESSMENT_PROMOTED';

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: Date;
  data?: Record<string, any>;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  getMessage: (data: any) => string;
  getLink?: (data: any) => string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  HELP_REQUEST: {
    type: 'HELP_REQUEST',
    title: '🆘 Help Request',
    getMessage: (data) => `${data.studentName} needs help with ${data.exerciseTitle}`,
    getLink: (data) => `/dashboard/tutor/sessions/${data.sessionId}/live`,
    priority: 'URGENT',
  },
  HOMEWORK_SUBMITTED: {
    type: 'HOMEWORK_SUBMITTED',
    title: '📝 Homework Submitted',
    getMessage: (data) => `${data.studentName} submitted homework for ${data.courseTitle}`,
    getLink: (data) => `/dashboard/tutor/marking`,
    priority: 'MEDIUM',
  },
  HOMEWORK_GRADED: {
    type: 'HOMEWORK_GRADED',
    title: '✅ Homework Graded',
    getMessage: (data) => `Your homework for ${data.courseTitle} has been graded: ${data.score}/${data.maxScore}`,
    getLink: (data) => `/dashboard/student/homework`,
    priority: 'MEDIUM',
  },
  ACHIEVEMENT_EARNED: {
    type: 'ACHIEVEMENT_EARNED',
    title: '🏆 Achievement Unlocked!',
    getMessage: (data) => `Congratulations! You earned "${data.badgeName}"`,
    getLink: () => `/dashboard/student/achievements`,
    priority: 'LOW',
  },
  SESSION_STARTING: {
    type: 'SESSION_STARTING',
    title: '🔔 Session Starting',
    getMessage: (data) => `Your session "${data.sessionTitle}" starts in ${data.minutesUntil} minutes`,
    getLink: (data) => `/dashboard/tutor/sessions/${data.sessionId}`,
    priority: 'HIGH',
  },
  SESSION_CANCELLED: {
    type: 'SESSION_CANCELLED',
    title: '❌ Session Cancelled',
    getMessage: (data) => `Session "${data.sessionTitle}" on ${data.sessionDate} has been cancelled`,
    priority: 'HIGH',
  },
  PARENT_MESSAGE: {
    type: 'PARENT_MESSAGE',
    title: '💬 Message from Tutor',
    getMessage: (data) => `${data.tutorName} sent you a message about ${data.studentName}`,
    getLink: () => `/dashboard/parent`,
    priority: 'MEDIUM',
  },
  TUTOR_NOTE: {
    type: 'TUTOR_NOTE',
    title: '📋 New Note',
    getMessage: (data) => `${data.tutorName} added a note for ${data.studentName}`,
    getLink: (data) => `/dashboard/tutor/students/${data.studentId}`,
    priority: 'LOW',
  },
  GOAL_ACHIEVED: {
    type: 'GOAL_ACHIEVED',
    title: '🎯 Goal Achieved!',
    getMessage: (data) => `Congratulations! You achieved your goal: ${data.goalText}`,
    getLink: () => `/dashboard/student/goals`,
    priority: 'MEDIUM',
  },
  AWARD_REDEEMED: {
    type: 'AWARD_REDEEMED',
    title: '🎁 Award Requested',
    getMessage: (data) => `${data.studentName} redeemed "${data.awardName}" for ${data.xpCost} XP`,
    priority: 'LOW',
  },
  AWARD_FULFILLED: {
    type: 'AWARD_FULFILLED',
    title: '✨ Award Fulfilled',
    getMessage: (data) => `Your reward "${data.awardName}" has been fulfilled!`,
    getLink: () => `/dashboard/student/awards`,
    priority: 'LOW',
  },
  // Phase 4 — Assessment Engine
  ASSESSMENT_READY_FOR_PROMOTION: {
    type: 'ASSESSMENT_READY_FOR_PROMOTION',
    title: '🎯 Student Ready for Promotion',
    getMessage: (data) =>
      `${data.studentName} has completed all lessons in ${data.subject} (${data.levelLabel}) and is ready for a promotion test.`,
    getLink: (data) =>
      `/dashboard/tutor/students/${data.studentId}/promote?subject=${data.subject}`,
    priority: 'HIGH',
  },
  ASSESSMENT_LESSON_SUBMITTED: {
    type: 'ASSESSMENT_LESSON_SUBMITTED',
    title: '📖 Lesson Submitted for Marking',
    getMessage: (data) =>
      `${data.studentName} submitted "${data.lessonTitle}" (${data.subject} Lesson ${data.lessonNumber}) for marking.`,
    getLink: (data) =>
      `/dashboard/tutor/students/${data.studentId}/assessment`,
    priority: 'MEDIUM',
  },
  ASSESSMENT_PROMOTED: {
    type: 'ASSESSMENT_PROMOTED',
    title: '🏆 Assessment Level Promoted!',
    getMessage: (data) =>
      `Great news! You have been promoted in ${data.subject} from ${data.fromLevel} to ${data.toLevel}.`,
    getLink: () => `/dashboard/student/assessment`,
    priority: 'HIGH',
  },
};

/**
 * Create a notification from a template
 */
export function createNotification(
  type: NotificationType,
  userId: string,
  data: any
): Omit<Notification, 'id' | 'createdAt'> {
  const template = NOTIFICATION_TEMPLATES[type];

  return {
    type,
    userId,
    title: template.title,
    message: template.getMessage(data),
    link: template.getLink?.(data),
    read: false,
    priority: template.priority,
    data,
  };
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    HELP_REQUEST: '🆘',
    HOMEWORK_SUBMITTED: '📝',
    HOMEWORK_GRADED: '✅',
    ACHIEVEMENT_EARNED: '🏆',
    SESSION_STARTING: '🔔',
    SESSION_CANCELLED: '❌',
    PARENT_MESSAGE: '💬',
    TUTOR_NOTE: '📋',
    GOAL_ACHIEVED: '🎯',
    AWARD_REDEEMED: '🎁',
    AWARD_FULFILLED: '✨',
    ASSESSMENT_READY_FOR_PROMOTION: '🎯',
    ASSESSMENT_LESSON_SUBMITTED: '📖',
    ASSESSMENT_PROMOTED: '🏆',
  };

  return icons[type];
}

/**
 * Get notification color based on priority
 */
export function getNotificationColor(priority: string): string {
  const colors = {
    LOW: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700',
    MEDIUM: 'bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    HIGH: 'bg-orange-50 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    URGENT: 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
  };

  return colors[priority as keyof typeof colors] || colors.LOW;
}
