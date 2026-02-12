import { PrismaClient, BadgeCategory, BadgeTier } from '@prisma/client';

const prisma = new PrismaClient();

const BADGE_DEFINITIONS = [
  // Completion badges
  {
    name: 'First Steps',
    description: 'Complete your first lesson',
    category: BadgeCategory.COMPLETION,
    tier: BadgeTier.BRONZE,
    xpValue: 10,
    criteria: { type: 'lesson_count', count: 1 },
  },
  {
    name: 'Course Conqueror',
    description: 'Complete your first course',
    category: BadgeCategory.COMPLETION,
    tier: BadgeTier.SILVER,
    xpValue: 100,
    criteria: { type: 'course_completion', count: 1 },
  },
  {
    name: 'Learning Legend',
    description: 'Complete 5 courses',
    category: BadgeCategory.COMPLETION,
    tier: BadgeTier.GOLD,
    xpValue: 500,
    criteria: { type: 'course_completion', count: 5 },
  },

  // Streak badges
  {
    name: 'Week Warrior',
    description: '7-day attendance streak',
    category: BadgeCategory.STREAK,
    tier: BadgeTier.BRONZE,
    xpValue: 50,
    criteria: { type: 'attendance_streak', days: 7 },
  },
  {
    name: 'Month Master',
    description: '30-day attendance streak',
    category: BadgeCategory.STREAK,
    tier: BadgeTier.SILVER,
    xpValue: 200,
    criteria: { type: 'attendance_streak', days: 30 },
  },
  {
    name: 'Dedication Champion',
    description: '100-day attendance streak',
    category: BadgeCategory.STREAK,
    tier: BadgeTier.PLATINUM,
    xpValue: 1000,
    criteria: { type: 'attendance_streak', days: 100 },
  },

  // Mastery badges
  {
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    category: BadgeCategory.MASTERY,
    tier: BadgeTier.GOLD,
    xpValue: 50,
    criteria: { type: 'quiz_perfect', count: 1 },
  },
  {
    name: 'Quiz Master',
    description: 'Get 100% on 10 quizzes',
    category: BadgeCategory.MASTERY,
    tier: BadgeTier.PLATINUM,
    xpValue: 500,
    criteria: { type: 'quiz_perfect', count: 10 },
  },

  // Social badges
  {
    name: 'Helpful Friend',
    description: 'Help 5 classmates',
    category: BadgeCategory.SOCIAL,
    tier: BadgeTier.SILVER,
    xpValue: 25,
    criteria: { type: 'peer_help', count: 5 },
  },
  {
    name: 'Team Player',
    description: 'Participate in 10 group activities',
    category: BadgeCategory.SOCIAL,
    tier: BadgeTier.GOLD,
    xpValue: 100,
    criteria: { type: 'group_activity', count: 10 },
  },

  // Special badges
  {
    name: 'Early Adopter',
    description: 'One of the first 100 users',
    category: BadgeCategory.SPECIAL,
    tier: BadgeTier.PLATINUM,
    xpValue: 100,
    criteria: { type: 'user_id_range', max: 100 },
  },
];

export async function seedBadges() {
  console.log('🎖️  Seeding badge definitions...');

  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badgeDefinition.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge,
    });
  }

  console.log(`✅ Seeded ${BADGE_DEFINITIONS.length} badge definitions`);
}

// Run if called directly (ES module check)
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBadges()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
