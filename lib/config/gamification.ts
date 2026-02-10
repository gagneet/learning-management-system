// Gamification configuration constants

export const GAMIFICATION_CONFIG = {
  // XP required per level
  XP_PER_LEVEL: 100,
  
  // XP rewards for different activities
  XP_REWARDS: {
    LESSON_COMPLETE: 10,
    QUIZ_COMPLETE: 20,
    COURSE_COMPLETE: 100,
    PERFECT_SCORE: 50,
    DAILY_LOGIN: 5,
  },
  
  // Badge types and their requirements
  BADGE_REQUIREMENTS: {
    FIRST_COURSE: 1,
    COURSE_MASTER: 10,
    STREAK_WEEK: 7,
    STREAK_MONTH: 30,
    PERFECT_STUDENT: 100, // 100% completion rate
  },
} as const;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / GAMIFICATION_CONFIG.XP_PER_LEVEL) + 1;
}

export function getXpForNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  return currentLevel * GAMIFICATION_CONFIG.XP_PER_LEVEL - currentXp;
}
