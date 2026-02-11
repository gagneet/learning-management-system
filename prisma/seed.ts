import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Constants for time calculations
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TWO_DAYS_MS = 2 * ONE_DAY_MS;
const FIVE_DAYS_MS = 5 * ONE_DAY_MS;
const TEN_DAYS_MS = 10 * ONE_DAY_MS;
const FIFTEEN_DAYS_MS = 15 * ONE_DAY_MS;
const TWENTY_DAYS_MS = 20 * ONE_DAY_MS;
const TWENTYFIVE_DAYS_MS = 25 * ONE_DAY_MS;
const TWENTYEIGHT_DAYS_MS = 28 * ONE_DAY_MS;
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;
const THIRTYFIVE_DAYS_MS = 35 * ONE_DAY_MS;
const FORTY_DAYS_MS = 40 * ONE_DAY_MS;
const FORTYTHREE_DAYS_MS = 43 * ONE_DAY_MS;
const FORTYFIVE_DAYS_MS = 45 * ONE_DAY_MS;
const FIFTY_DAYS_MS = 50 * ONE_DAY_MS;
const FIFTYFIVE_DAYS_MS = 55 * ONE_DAY_MS;
const FIFTYEIGHT_DAYS_MS = 58 * ONE_DAY_MS;
const SIXTY_DAYS_MS = 60 * ONE_DAY_MS;
const SEVENTY_DAYS_MS = 70 * ONE_DAY_MS;
const EIGHTY_DAYS_MS = 80 * ONE_DAY_MS;
const NINETY_DAYS_MS = 90 * ONE_DAY_MS;

async function main() {
  console.log('🌱 Starting database seed...');

  // Create centers
  const center1 = await prisma.center.upsert({
    where: { slug: 'main-campus' },
    update: {},
    create: {
      name: 'Main Campus',
      slug: 'main-campus',
      description: 'Primary learning center',
      region: 'North America',
      settings: {
        timezone: 'America/New_York',
        language: 'en',
      },
    },
  });

  const center2 = await prisma.center.upsert({
    where: { slug: 'online-campus' },
    update: {},
    create: {
      name: 'Online Campus',
      slug: 'online-campus',
      description: 'Virtual learning center',
      region: 'Global',
      settings: {
        timezone: 'UTC',
        language: 'en',
      },
    },
  });

  console.log('✅ Centers created');

  // Create users with various roles
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: {
      email: 'admin@lms.com',
      name: 'Super Admin',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      centerId: center1.id,
    },
  });

  // Centre Head (CENTER_ADMIN)
  const centerAdmin = await prisma.user.upsert({
    where: { email: 'centeradmin@lms.com' },
    update: {},
    create: {
      email: 'centeradmin@lms.com',
      name: 'Sarah Johnson',
      password: adminPassword,
      role: 'CENTER_ADMIN',
      centerId: center1.id,
      bio: 'Centre Head with 15 years of educational leadership experience',
    },
  });

  // Supervisor (CENTER_SUPERVISOR)
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@lms.com' },
    update: {},
    create: {
      email: 'supervisor@lms.com',
      name: 'David Martinez',
      password: adminPassword,
      role: 'CENTER_SUPERVISOR',
      centerId: center1.id,
      bio: 'Academic Supervisor overseeing curriculum and teaching quality',
    },
  });

  // Finance Administrator (FINANCE_ADMIN)
  const financeAdmin = await prisma.user.upsert({
    where: { email: 'finance@lms.com' },
    update: {},
    create: {
      email: 'finance@lms.com',
      name: 'Emily Chen',
      password: adminPassword,
      role: 'FINANCE_ADMIN',
      centerId: center1.id,
      bio: 'Financial Administrator managing billing and payments',
    },
  });

  // Teacher 1 - Programming
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher@lms.com' },
    update: {},
    create: {
      email: 'teacher@lms.com',
      name: 'John Teacher',
      password: teacherPassword,
      role: 'TEACHER',
      centerId: center1.id,
      bio: 'Computer Science educator specializing in programming fundamentals',
    },
  });

  // Teacher 2 - Mathematics
  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@lms.com' },
    update: {},
    create: {
      email: 'teacher2@lms.com',
      name: 'Maria Garcia',
      password: teacherPassword,
      role: 'TEACHER',
      centerId: center1.id,
      bio: 'Mathematics teacher with expertise in algebra and calculus',
    },
  });

  // Parent 1 - Has 2 children
  const parent1 = await prisma.user.upsert({
    where: { email: 'parent1@lms.com' },
    update: {},
    create: {
      email: 'parent1@lms.com',
      name: 'Robert Johnson',
      password: adminPassword,
      role: 'PARENT',
      centerId: center1.id,
      bio: 'Parent of Jane Student and Sophia Patel',
    },
  });

  // Parent 2 - Has 1 child
  const parent2 = await prisma.user.upsert({
    where: { email: 'parent2@lms.com' },
    update: {},
    create: {
      email: 'parent2@lms.com',
      name: 'Lisa Thompson',
      password: adminPassword,
      role: 'PARENT',
      centerId: center1.id,
      bio: 'Parent of Alex Thompson',
    },
  });

  // Parent 3 - Has 1 child
  const parent3 = await prisma.user.upsert({
    where: { email: 'parent3@lms.com' },
    update: {},
    create: {
      email: 'parent3@lms.com',
      name: 'Jennifer Lee',
      password: adminPassword,
      role: 'PARENT',
      centerId: center1.id,
      bio: 'Parent of Michael Lee',
    },
  });

  // Student 1 - High performer (linked to parent1)
  const student1 = await prisma.user.upsert({
    where: { email: 'student@lms.com' },
    update: {},
    create: {
      email: 'student@lms.com',
      name: 'Jane Student',
      password: studentPassword,
      role: 'STUDENT',
      centerId: center1.id,
      parentId: parent1.id,
    },
  });

  // Student 2 - Average performer (linked to parent2)
  const student2 = await prisma.user.upsert({
    where: { email: 'student2@lms.com' },
    update: {},
    create: {
      email: 'student2@lms.com',
      name: 'Alex Thompson',
      password: studentPassword,
      role: 'STUDENT',
      centerId: center1.id,
      parentId: parent2.id,
    },
  });

  // Student 3 - Needs attention (linked to parent3)
  const student3 = await prisma.user.upsert({
    where: { email: 'student3@lms.com' },
    update: {},
    create: {
      email: 'student3@lms.com',
      name: 'Michael Lee',
      password: studentPassword,
      role: 'STUDENT',
      centerId: center1.id,
      parentId: parent3.id,
    },
  });

  // Student 4 - Just started (linked to parent1, so parent1 has 2 children)
  const student4 = await prisma.user.upsert({
    where: { email: 'student4@lms.com' },
    update: {},
    create: {
      email: 'student4@lms.com',
      name: 'Sophia Patel',
      password: studentPassword,
      role: 'STUDENT',
      centerId: center1.id,
      parentId: parent1.id,
    },
  });

  console.log('✅ Users created (14 total: 1 super admin, 1 center admin, 1 supervisor, 1 finance admin, 2 teachers, 3 parents, 4 students)');

  // Create Academic Profiles for students
  await prisma.academicProfile.upsert({
    where: { userId: student1.id },
    update: {},
    create: {
      userId: student1.id,
      chronologicalAge: 14.5,
      readingAge: 16.2,
      numeracyAge: 15.8,
      comprehensionIndex: 88.5,
      writingProficiency: 82.0,
    },
  });

  await prisma.academicProfile.upsert({
    where: { userId: student2.id },
    update: {},
    create: {
      userId: student2.id,
      chronologicalAge: 13.8,
      readingAge: 13.5,
      numeracyAge: 14.0,
      comprehensionIndex: 75.0,
      writingProficiency: 71.5,
    },
  });

  await prisma.academicProfile.upsert({
    where: { userId: student3.id },
    update: {},
    create: {
      userId: student3.id,
      chronologicalAge: 15.2,
      readingAge: 13.8,
      numeracyAge: 13.2,
      comprehensionIndex: 62.0,
      writingProficiency: 58.5,
    },
  });

  await prisma.academicProfile.upsert({
    where: { userId: student4.id },
    update: {},
    create: {
      userId: student4.id,
      chronologicalAge: 14.0,
      readingAge: 14.5,
      numeracyAge: 14.8,
      comprehensionIndex: 80.0,
      writingProficiency: 76.0,
    },
  });

  console.log('✅ Academic profiles created');

  // Create Gamification Profiles for students
  const gamProfile1 = await prisma.gamificationProfile.upsert({
    where: { userId: student1.id },
    update: {},
    create: {
      userId: student1.id,
      xp: 2450,
      level: 8,
      streak: 12,
      lastActivityAt: new Date(),
    },
  });

  const gamProfile2 = await prisma.gamificationProfile.upsert({
    where: { userId: student2.id },
    update: {},
    create: {
      userId: student2.id,
      xp: 1200,
      level: 5,
      streak: 5,
      lastActivityAt: new Date(),
    },
  });

  const gamProfile3 = await prisma.gamificationProfile.upsert({
    where: { userId: student3.id },
    update: {},
    create: {
      userId: student3.id,
      xp: 450,
      level: 2,
      streak: 1,
      lastActivityAt: new Date(Date.now() - TWO_DAYS_MS), // 2 days ago
    },
  });

  const gamProfile4 = await prisma.gamificationProfile.upsert({
    where: { userId: student4.id },
    update: {},
    create: {
      userId: student4.id,
      xp: 150,
      level: 1,
      streak: 3,
      lastActivityAt: new Date(),
    },
  });

  console.log('✅ Gamification profiles created');

  // Create Badges
  await prisma.badge.createMany({
    data: [
      {
        name: 'First Lesson',
        description: 'Completed your first lesson',
        type: 'COMPLETION',
        profileId: gamProfile1.id,
      },
      {
        name: '7-Day Streak',
        description: 'Maintained a 7-day learning streak',
        type: 'STREAK',
        profileId: gamProfile1.id,
      },
      {
        name: 'Quick Learner',
        description: 'Completed 5 lessons in one day',
        type: 'MASTERY',
        profileId: gamProfile1.id,
      },
      {
        name: 'First Lesson',
        description: 'Completed your first lesson',
        type: 'COMPLETION',
        profileId: gamProfile2.id,
      },
      {
        name: 'First Lesson',
        description: 'Completed your first lesson',
        type: 'COMPLETION',
        profileId: gamProfile4.id,
      },
    ],
  });

  // Create Achievements
  await prisma.achievement.createMany({
    data: [
      {
        title: 'Course Completion',
        description: 'Completed Introduction to Programming',
        category: 'completion',
        value: 100,
        profileId: gamProfile1.id,
      },
      {
        title: 'Perfect Attendance',
        description: 'Attended all sessions this month',
        category: 'attendance',
        value: 100,
        profileId: gamProfile1.id,
      },
      {
        title: 'Half Way There',
        description: 'Completed 50% of Web Development Basics',
        category: 'completion',
        value: 50,
        profileId: gamProfile2.id,
      },
    ],
  });

  console.log('✅ Badges and achievements created');

  // Create courses
  const course1 = await prisma.course.upsert({
    where: {
      centerId_slug: {
        centerId: center1.id,
        slug: 'introduction-to-programming',
      },
    },
    update: {},
    create: {
      title: 'Introduction to Programming',
      slug: 'introduction-to-programming',
      description: 'Learn the fundamentals of programming with hands-on examples',
      status: 'PUBLISHED',
      centerId: center1.id,
      teacherId: teacher1.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: {
      centerId_slug: {
        centerId: center1.id,
        slug: 'web-development-basics',
      },
    },
    update: {},
    create: {
      title: 'Web Development Basics',
      slug: 'web-development-basics',
      description: 'Master HTML, CSS, and JavaScript fundamentals',
      status: 'PUBLISHED',
      centerId: center1.id,
      teacherId: teacher1.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: {
      centerId_slug: {
        centerId: center1.id,
        slug: 'algebra-fundamentals',
      },
    },
    update: {},
    create: {
      title: 'Algebra Fundamentals',
      slug: 'algebra-fundamentals',
      description: 'Master algebraic concepts and problem-solving',
      status: 'PUBLISHED',
      centerId: center1.id,
      teacherId: teacher2.id,
    },
  });

  const course4 = await prisma.course.upsert({
    where: {
      centerId_slug: {
        centerId: center1.id,
        slug: 'advanced-mathematics',
      },
    },
    update: {},
    create: {
      title: 'Advanced Mathematics',
      slug: 'advanced-mathematics',
      description: 'Calculus and advanced mathematical concepts',
      status: 'PUBLISHED',
      centerId: center1.id,
      teacherId: teacher2.id,
    },
  });

  console.log('✅ Courses created');

  // Create modules for course 1
  const module1_1 = await prisma.module.create({
    data: {
      title: 'Getting Started',
      description: 'Introduction to programming concepts',
      order: 1,
      courseId: course1.id,
    },
  });

  const module1_2 = await prisma.module.create({
    data: {
      title: 'Variables and Data Types',
      description: 'Understanding variables and basic data types',
      order: 2,
      courseId: course1.id,
    },
  });

  const module1_3 = await prisma.module.create({
    data: {
      title: 'Control Flow',
      description: 'Conditional statements and loops',
      order: 3,
      courseId: course1.id,
    },
  });

  // Create modules for course 2
  const module2_1 = await prisma.module.create({
    data: {
      title: 'HTML Basics',
      description: 'Learn HTML structure and elements',
      order: 1,
      courseId: course2.id,
    },
  });

  const module2_2 = await prisma.module.create({
    data: {
      title: 'CSS Styling',
      description: 'Style your web pages with CSS',
      order: 2,
      courseId: course2.id,
    },
  });

  const module2_3 = await prisma.module.create({
    data: {
      title: 'JavaScript Fundamentals',
      description: 'Add interactivity with JavaScript',
      order: 3,
      courseId: course2.id,
    },
  });

  // Create modules for course 3
  const module3_1 = await prisma.module.create({
    data: {
      title: 'Introduction to Algebra',
      description: 'Basic algebraic concepts and notation',
      order: 1,
      courseId: course3.id,
    },
  });

  const module3_2 = await prisma.module.create({
    data: {
      title: 'Solving Equations',
      description: 'Techniques for solving linear equations',
      order: 2,
      courseId: course3.id,
    },
  });

  console.log('✅ Modules created');

  // Create lessons for module 1_1
  const lesson1_1_1 = await prisma.lesson.create({
    data: {
      title: 'What is Programming?',
      description: 'Overview of programming and its applications',
      order: 1,
      moduleId: module1_1.id,
    },
  });

  const lesson1_1_2 = await prisma.lesson.create({
    data: {
      title: 'Setting Up Your Environment',
      description: 'Installing and configuring development tools',
      order: 2,
      moduleId: module1_1.id,
    },
  });

  const lesson1_1_3 = await prisma.lesson.create({
    data: {
      title: 'Your First Program',
      description: 'Write and run your first program',
      order: 3,
      moduleId: module1_1.id,
    },
  });

  // Create lessons for module 1_2
  const lesson1_2_1 = await prisma.lesson.create({
    data: {
      title: 'Understanding Variables',
      description: 'What are variables and how to use them',
      order: 1,
      moduleId: module1_2.id,
    },
  });

  const lesson1_2_2 = await prisma.lesson.create({
    data: {
      title: 'Data Types',
      description: 'Exploring different data types',
      order: 2,
      moduleId: module1_2.id,
    },
  });

  // Create lessons for module 2_1
  const lesson2_1_1 = await prisma.lesson.create({
    data: {
      title: 'HTML Document Structure',
      description: 'Understanding the basic structure of HTML',
      order: 1,
      moduleId: module2_1.id,
    },
  });

  const lesson2_1_2 = await prisma.lesson.create({
    data: {
      title: 'Common HTML Elements',
      description: 'Learn about headings, paragraphs, and lists',
      order: 2,
      moduleId: module2_1.id,
    },
  });

  const lesson2_1_3 = await prisma.lesson.create({
    data: {
      title: 'HTML Forms',
      description: 'Creating interactive forms',
      order: 3,
      moduleId: module2_1.id,
    },
  });

  // Create lessons for module 3_1
  const lesson3_1_1 = await prisma.lesson.create({
    data: {
      title: 'Algebraic Expressions',
      description: 'Understanding algebraic notation',
      order: 1,
      moduleId: module3_1.id,
    },
  });

  const lesson3_1_2 = await prisma.lesson.create({
    data: {
      title: 'Variables in Algebra',
      description: 'Working with variables and constants',
      order: 2,
      moduleId: module3_1.id,
    },
  });

  console.log('✅ Lessons created');

  // Create content for lessons
  await prisma.content.createMany({
    data: [
      {
        title: 'Introduction Video',
        type: 'VIDEO',
        url: 'https://example.com/videos/intro.mp4',
        duration: 15,
        lessonId: lesson1_1_1.id,
      },
      {
        title: 'Course Materials PDF',
        type: 'DOCUMENT',
        url: 'https://example.com/docs/materials.pdf',
        lessonId: lesson1_1_1.id,
      },
      {
        title: 'Setup Guide',
        type: 'DOCUMENT',
        url: 'https://example.com/docs/setup.pdf',
        lessonId: lesson1_1_2.id,
      },
      {
        title: 'First Program Tutorial',
        type: 'VIDEO',
        url: 'https://example.com/videos/first-program.mp4',
        duration: 20,
        lessonId: lesson1_1_3.id,
      },
      {
        title: 'Variables Explained',
        type: 'VIDEO',
        url: 'https://example.com/videos/variables.mp4',
        duration: 18,
        lessonId: lesson1_2_1.id,
      },
      {
        title: 'HTML Structure Video',
        type: 'VIDEO',
        url: 'https://example.com/videos/html-structure.mp4',
        duration: 25,
        lessonId: lesson2_1_1.id,
      },
    ],
  });

  console.log('✅ Content created');

  // Create enrollments with varying progress (3-month history)
  // Student 1 - High performer (enrolled in 3 courses)
  const enrollment1_1 = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student1.id,
        courseId: course1.id,
      },
    },
    update: {},
    create: {
      userId: student1.id,
      courseId: course1.id,
      tutorId: teacher1.id,
      progress: 85,
      enrolledAt: new Date(Date.now() - NINETY_DAYS_MS), // 90 days ago
    },
  });

  const enrollment1_2 = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student1.id,
        courseId: course2.id,
      },
    },
    update: {},
    create: {
      userId: student1.id,
      courseId: course2.id,
      tutorId: teacher1.id,
      progress: 45,
      enrolledAt: new Date(Date.now() - SIXTY_DAYS_MS), // 60 days ago
    },
  });

  const enrollment1_3 = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student1.id,
        courseId: course3.id,
      },
    },
    update: {},
    create: {
      userId: student1.id,
      courseId: course3.id,
      tutorId: teacher2.id,
      progress: 30,
      enrolledAt: new Date(Date.now() - THIRTY_DAYS_MS), // 30 days ago
    },
  });

  // Student 2 - Average performer (enrolled in 2 courses)
  const enrollment2_1 = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student2.id,
        courseId: course1.id,
      },
    },
    update: {},
    create: {
      userId: student2.id,
      courseId: course1.id,
      tutorId: teacher1.id,
      progress: 55,
      enrolledAt: new Date(Date.now() - SEVENTY_DAYS_MS), // 70 days ago
    },
  });

  const enrollment2_2 = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student2.id,
        courseId: course2.id,
      },
    },
    update: {},
    create: {
      userId: student2.id,
      courseId: course2.id,
      tutorId: teacher1.id,
      progress: 38,
      enrolledAt: new Date(Date.now() - FORTY_DAYS_MS), // 40 days ago
    },
  });

  // Student 3 - Needs attention (enrolled in 2 courses, low progress)
  const enrollment3_1 = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student3.id,
        courseId: course1.id,
      },
    },
    update: {},
    create: {
      userId: student3.id,
      courseId: course1.id,
      tutorId: teacher1.id,
      progress: 15,
      enrolledAt: new Date(Date.now() - EIGHTY_DAYS_MS), // 80 days ago
    },
  });

  const enrollment3_2 = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student3.id,
        courseId: course3.id,
      },
    },
    update: {},
    create: {
      userId: student3.id,
      courseId: course3.id,
      tutorId: teacher2.id,
      progress: 8,
      enrolledAt: new Date(Date.now() - FIFTY_DAYS_MS), // 50 days ago
    },
  });

  // Student 4 - Just started (enrolled in 1 course)
  const enrollment4_1 = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: student4.id,
        courseId: course2.id,
      },
    },
    update: {},
    create: {
      userId: student4.id,
      courseId: course2.id,
      tutorId: teacher1.id,
      progress: 0,
      enrolledAt: new Date(Date.now() - FIVE_DAYS_MS), // 5 days ago
    },
  });

  console.log('✅ Enrollments created');

  // Create progress records for students
  // Student 1 - completed many lessons
  await prisma.progress.createMany({
    data: [
      {
        userId: student1.id,
        lessonId: lesson1_1_1.id,
        completed: true,
        completedAt: new Date(Date.now() - EIGHTY_DAYS_MS),
        timeSpent: 25,
      },
      {
        userId: student1.id,
        lessonId: lesson1_1_2.id,
        completed: true,
        completedAt: new Date(Date.now() - SEVENTY_DAYS_MS),
        timeSpent: 30,
      },
      {
        userId: student1.id,
        lessonId: lesson1_1_3.id,
        completed: true,
        completedAt: new Date(Date.now() - SIXTY_DAYS_MS),
        timeSpent: 35,
      },
      {
        userId: student1.id,
        lessonId: lesson1_2_1.id,
        completed: true,
        completedAt: new Date(Date.now() - FIFTY_DAYS_MS),
        timeSpent: 28,
      },
      {
        userId: student1.id,
        lessonId: lesson1_2_2.id,
        completed: false,
        timeSpent: 15,
      },
      {
        userId: student1.id,
        lessonId: lesson2_1_1.id,
        completed: true,
        completedAt: new Date(Date.now() - TWENTYFIVE_DAYS_MS),
        timeSpent: 32,
      },
      {
        userId: student1.id,
        lessonId: lesson2_1_2.id,
        completed: false,
        timeSpent: 10,
      },
    ],
  });

  // Student 2 - moderate progress
  await prisma.progress.createMany({
    data: [
      {
        userId: student2.id,
        lessonId: lesson1_1_1.id,
        completed: true,
        completedAt: new Date(Date.now() - SIXTY_DAYS_MS),
        timeSpent: 28,
      },
      {
        userId: student2.id,
        lessonId: lesson1_1_2.id,
        completed: true,
        completedAt: new Date(Date.now() - FIFTY_DAYS_MS),
        timeSpent: 32,
      },
      {
        userId: student2.id,
        lessonId: lesson1_1_3.id,
        completed: false,
        timeSpent: 12,
      },
      {
        userId: student2.id,
        lessonId: lesson2_1_1.id,
        completed: true,
        completedAt: new Date(Date.now() - FIFTEEN_DAYS_MS),
        timeSpent: 30,
      },
    ],
  });

  // Student 3 - minimal progress
  await prisma.progress.createMany({
    data: [
      {
        userId: student3.id,
        lessonId: lesson1_1_1.id,
        completed: true,
        completedAt: new Date(Date.now() - SEVENTY_DAYS_MS),
        timeSpent: 20,
      },
      {
        userId: student3.id,
        lessonId: lesson1_1_2.id,
        completed: false,
        timeSpent: 8,
      },
    ],
  });

  console.log('✅ Progress records created');

  // Create Sessions
  const today = new Date();
  const tomorrow = new Date(today.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today.getTime());
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const yesterday = new Date(today.getTime());
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today.getTime());
  lastWeek.setDate(lastWeek.getDate() - 7);

  // Today's sessions
  const todaySession1StartTime = new Date(today);
  todaySession1StartTime.setHours(10, 0, 0, 0);
  const todaySession1EndTime = new Date(today);
  todaySession1EndTime.setHours(11, 0, 0, 0);

  const todaySession1 = await prisma.session.create({
    data: {
      title: 'Introduction to Programming - Live Q&A',
      description: 'Interactive Q&A session for programming concepts',
      provider: 'TEAMS',
      joinUrl: 'https://teams.microsoft.com/join/abc123',
      startTime: todaySession1StartTime,
      endTime: todaySession1EndTime,
      status: 'SCHEDULED',
      lessonId: lesson1_1_1.id,
      tutorId: teacher1.id,
    },
  });

  const todaySession2StartTime = new Date(today);
  todaySession2StartTime.setHours(14, 0, 0, 0);
  const todaySession2EndTime = new Date(today);
  todaySession2EndTime.setHours(15, 30, 0, 0);

  const todaySession2 = await prisma.session.create({
    data: {
      title: 'HTML Basics Workshop',
      description: 'Hands-on HTML coding workshop',
      provider: 'ZOOM',
      joinUrl: 'https://zoom.us/j/123456789',
      startTime: todaySession2StartTime,
      endTime: todaySession2EndTime,
      status: 'SCHEDULED',
      lessonId: lesson2_1_1.id,
      tutorId: teacher1.id,
    },
  });

  const todaySession3StartTime = new Date(today);
  todaySession3StartTime.setHours(16, 0, 0, 0);
  const todaySession3EndTime = new Date(today);
  todaySession3EndTime.setHours(17, 0, 0, 0);

  const todaySession3 = await prisma.session.create({
    data: {
      title: 'Algebra Study Group',
      description: 'Collaborative problem-solving session',
      provider: 'TEAMS',
      joinUrl: 'https://teams.microsoft.com/join/def456',
      startTime: todaySession3StartTime,
      endTime: todaySession3EndTime,
      status: 'SCHEDULED',
      lessonId: lesson3_1_1.id,
      tutorId: teacher2.id,
    },
  });

  // Tomorrow's sessions
  const tomorrowSession1StartTime = new Date(tomorrow);
  tomorrowSession1StartTime.setHours(10, 0, 0, 0);
  const tomorrowSession1EndTime = new Date(tomorrow);
  tomorrowSession1EndTime.setHours(11, 30, 0, 0);

  const tomorrowSession1 = await prisma.session.create({
    data: {
      title: 'Variables Deep Dive',
      description: 'Advanced discussion on variables and data types',
      provider: 'TEAMS',
      joinUrl: 'https://teams.microsoft.com/join/ghi789',
      startTime: tomorrowSession1StartTime,
      endTime: tomorrowSession1EndTime,
      status: 'SCHEDULED',
      lessonId: lesson1_2_1.id,
      tutorId: teacher1.id,
    },
  });

  const tomorrowSession2StartTime = new Date(tomorrow);
  tomorrowSession2StartTime.setHours(15, 0, 0, 0);
  const tomorrowSession2EndTime = new Date(tomorrow);
  tomorrowSession2EndTime.setHours(16, 30, 0, 0);

  const tomorrowSession2 = await prisma.session.create({
    data: {
      title: 'CSS Styling Techniques',
      description: 'Learn modern CSS styling methods',
      provider: 'ZOOM',
      joinUrl: 'https://zoom.us/j/987654321',
      startTime: tomorrowSession2StartTime,
      endTime: tomorrowSession2EndTime,
      status: 'SCHEDULED',
      lessonId: lesson2_1_2.id,
      tutorId: teacher1.id,
    },
  });

  // Completed sessions (past week)
  const completedSession1StartTime = new Date(lastWeek);
  completedSession1StartTime.setHours(10, 0, 0, 0);
  const completedSession1EndTime = new Date(lastWeek);
  completedSession1EndTime.setHours(11, 0, 0, 0);

  const completedSession1 = await prisma.session.create({
    data: {
      title: 'Getting Started with Programming',
      description: 'Introductory session',
      provider: 'TEAMS',
      joinUrl: 'https://teams.microsoft.com/join/old123',
      startTime: completedSession1StartTime,
      endTime: completedSession1EndTime,
      status: 'COMPLETED',
      recordingUrl: 'https://example.com/recordings/session1.mp4',
      lessonId: lesson1_1_1.id,
      tutorId: teacher1.id,
    },
  });

  const completedSession2StartTime = new Date(yesterday);
  completedSession2StartTime.setHours(14, 0, 0, 0);
  const completedSession2EndTime = new Date(yesterday);
  completedSession2EndTime.setHours(15, 30, 0, 0);

  const completedSession2 = await prisma.session.create({
    data: {
      title: 'HTML Fundamentals',
      description: 'Basic HTML structure and elements',
      provider: 'ZOOM',
      joinUrl: 'https://zoom.us/j/111222333',
      startTime: completedSession2StartTime,
      endTime: completedSession2EndTime,
      status: 'COMPLETED',
      recordingUrl: 'https://example.com/recordings/session2.mp4',
      lessonId: lesson2_1_1.id,
      tutorId: teacher1.id,
    },
  });

  const completedSession3StartTime = new Date(lastWeek);
  completedSession3StartTime.setHours(16, 0, 0, 0);
  const completedSession3EndTime = new Date(lastWeek);
  completedSession3EndTime.setHours(17, 0, 0, 0);

  const completedSession3 = await prisma.session.create({
    data: {
      title: 'Algebraic Expressions Workshop',
      description: 'Practice with algebraic expressions',
      provider: 'TEAMS',
      joinUrl: 'https://teams.microsoft.com/join/old789',
      startTime: completedSession3StartTime,
      endTime: completedSession3EndTime,
      status: 'COMPLETED',
      recordingUrl: 'https://example.com/recordings/session3.mp4',
      lessonId: lesson3_1_1.id,
      tutorId: teacher2.id,
    },
  });

  console.log('✅ Sessions created');

  // Create Session Attendance
  await prisma.sessionAttendance.createMany({
    data: [
      // Completed session 1 - high attendance
      {
        sessionId: completedSession1.id,
        userId: student1.id,
        attended: true,
        joinedAt: new Date(completedSession1.startTime.getTime() + 2 * 60 * 1000),
        leftAt: new Date(completedSession1.endTime!.getTime() - 5 * 60 * 1000),
      },
      {
        sessionId: completedSession1.id,
        userId: student2.id,
        attended: true,
        joinedAt: new Date(completedSession1.startTime.getTime() + 5 * 60 * 1000),
        leftAt: completedSession1.endTime!,
      },
      {
        sessionId: completedSession1.id,
        userId: student3.id,
        attended: false,
      },
      // Completed session 2 - medium attendance
      {
        sessionId: completedSession2.id,
        userId: student1.id,
        attended: true,
        joinedAt: completedSession2.startTime,
        leftAt: completedSession2.endTime!,
      },
      {
        sessionId: completedSession2.id,
        userId: student2.id,
        attended: true,
        joinedAt: new Date(completedSession2.startTime.getTime() + 10 * 60 * 1000),
        leftAt: new Date(completedSession2.endTime!.getTime() - 15 * 60 * 1000),
      },
      {
        sessionId: completedSession2.id,
        userId: student4.id,
        attended: false,
      },
      // Completed session 3 - low attendance
      {
        sessionId: completedSession3.id,
        userId: student1.id,
        attended: true,
        joinedAt: completedSession3.startTime,
        leftAt: completedSession3.endTime!,
      },
      {
        sessionId: completedSession3.id,
        userId: student3.id,
        attended: false,
      },
      // Today's sessions - pre-registered
      {
        sessionId: todaySession1.id,
        userId: student1.id,
        attended: false,
      },
      {
        sessionId: todaySession1.id,
        userId: student2.id,
        attended: false,
      },
      {
        sessionId: todaySession1.id,
        userId: student3.id,
        attended: false,
      },
      {
        sessionId: todaySession2.id,
        userId: student1.id,
        attended: false,
      },
      {
        sessionId: todaySession2.id,
        userId: student2.id,
        attended: false,
      },
      {
        sessionId: todaySession2.id,
        userId: student4.id,
        attended: false,
      },
      {
        sessionId: todaySession3.id,
        userId: student1.id,
        attended: false,
      },
      {
        sessionId: todaySession3.id,
        userId: student3.id,
        attended: false,
      },
      // Tomorrow's sessions - pre-registered
      {
        sessionId: tomorrowSession1.id,
        userId: student1.id,
        attended: false,
      },
      {
        sessionId: tomorrowSession1.id,
        userId: student2.id,
        attended: false,
      },
      {
        sessionId: tomorrowSession2.id,
        userId: student1.id,
        attended: false,
      },
      {
        sessionId: tomorrowSession2.id,
        userId: student4.id,
        attended: false,
      },
    ],
  });

  console.log('✅ Session attendance created');

  // Create Financial Transactions
  await prisma.financialTransaction.createMany({
    data: [
      // Student fees
      {
        type: 'STUDENT_FEE',
        amount: 500.00,
        status: 'completed',
        description: 'Course enrollment fee - Introduction to Programming',
        userId: student1.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - NINETY_DAYS_MS),
      },
      {
        type: 'STUDENT_FEE',
        amount: 450.00,
        status: 'completed',
        description: 'Course enrollment fee - Web Development Basics',
        userId: student1.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - SIXTY_DAYS_MS),
      },
      {
        type: 'STUDENT_FEE',
        amount: 500.00,
        status: 'completed',
        description: 'Course enrollment fee - Introduction to Programming',
        userId: student2.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - SEVENTY_DAYS_MS),
      },
      {
        type: 'STUDENT_FEE',
        amount: 450.00,
        status: 'pending',
        description: 'Course enrollment fee - Web Development Basics',
        userId: student2.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - TWENTY_DAYS_MS),
      },
      {
        type: 'STUDENT_FEE',
        amount: 500.00,
        status: 'pending',
        description: 'Course enrollment fee - Introduction to Programming',
        userId: student3.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - EIGHTY_DAYS_MS),
      },
      {
        type: 'STUDENT_FEE',
        amount: 450.00,
        status: 'completed',
        description: 'Course enrollment fee - Web Development Basics',
        userId: student4.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - TWO_DAYS_MS),
      },
      // Student payments
      {
        type: 'STUDENT_PAYMENT',
        amount: 500.00,
        status: 'completed',
        description: 'Payment received for Introduction to Programming',
        userId: student1.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'STUDENT_PAYMENT',
        amount: 450.00,
        status: 'completed',
        description: 'Payment received for Web Development Basics',
        userId: student1.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - TWENTYEIGHT_DAYS_MS),
      },
      {
        type: 'STUDENT_PAYMENT',
        amount: 500.00,
        status: 'completed',
        description: 'Payment received for Introduction to Programming',
        userId: student2.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'STUDENT_PAYMENT',
        amount: 450.00,
        status: 'completed',
        description: 'Payment received for Web Development Basics',
        userId: student4.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - ONE_DAY_MS),
      },
      // Tutor payments
      {
        type: 'TUTOR_PAYMENT',
        amount: 1200.00,
        status: 'completed',
        description: 'Monthly payment - January',
        userId: teacher1.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - THIRTY_DAYS_MS),
      },
      {
        type: 'TUTOR_PAYMENT',
        amount: 1200.00,
        status: 'completed',
        description: 'Monthly payment - February',
        userId: teacher1.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - ONE_DAY_MS),
      },
      {
        type: 'TUTOR_PAYMENT',
        amount: 1100.00,
        status: 'completed',
        description: 'Monthly payment - January',
        userId: teacher2.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - THIRTY_DAYS_MS),
      },
      {
        type: 'TUTOR_PAYMENT',
        amount: 1100.00,
        status: 'completed',
        description: 'Monthly payment - February',
        userId: teacher2.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - ONE_DAY_MS),
      },
      // Operational costs
      {
        type: 'OPERATIONAL_COST',
        amount: 250.00,
        status: 'completed',
        description: 'Office supplies and materials',
        userId: centerAdmin.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - FIFTEEN_DAYS_MS),
      },
      {
        type: 'OPERATIONAL_COST',
        amount: 150.00,
        status: 'completed',
        description: 'Software licenses',
        userId: centerAdmin.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - TEN_DAYS_MS),
      },
      {
        type: 'OPERATIONAL_COST',
        amount: 300.00,
        status: 'completed',
        description: 'Facility maintenance',
        userId: centerAdmin.id,
        centerId: center1.id,
        createdAt: new Date(Date.now() - FIVE_DAYS_MS),
      },
    ],
  });

  console.log('✅ Financial transactions created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📝 Login credentials:');
  console.log('\n🔧 Administrators:');
  console.log('  Super Admin: admin@lms.com / admin123');
  console.log('  Centre Head: centeradmin@lms.com / admin123');
  console.log('  Supervisor: supervisor@lms.com / admin123');
  console.log('  Finance Admin: finance@lms.com / admin123');
  console.log('\n👨‍🏫 Teachers:');
  console.log('  Teacher 1 (Programming): teacher@lms.com / teacher123');
  console.log('  Teacher 2 (Mathematics): teacher2@lms.com / teacher123');
  console.log('\n👪 Parents:');
  console.log('  Parent 1 (2 children): parent1@lms.com / admin123');
  console.log('  Parent 2 (1 child): parent2@lms.com / admin123');
  console.log('  Parent 3 (1 child): parent3@lms.com / admin123');
  console.log('\n👦 Students:');
  console.log('  Student 1 - Jane (High performer, Parent 1): student@lms.com / student123');
  console.log('  Student 2 - Alex (Average, Parent 2): student2@lms.com / student123');
  console.log('  Student 3 - Michael (Needs attention, Parent 3): student3@lms.com / student123');
  console.log('  Student 4 - Sophia (New student, Parent 1): student4@lms.com / student123');
  console.log('\n📊 Database includes (3-month history):');
  console.log('- 2 centres (Main Campus, Online Campus)');
  console.log('- 14 users total:');
  console.log('  • 1 super admin');
  console.log('  • 1 centre admin (head)');
  console.log('  • 1 supervisor');
  console.log('  • 1 finance admin');
  console.log('  • 2 teachers');
  console.log('  • 3 parents');
  console.log('  • 4 students');
  console.log('- 4 courses with modules and lessons');
  console.log('- 9 enrollments with varying progress (spanning 90 days)');
  console.log('- Progress records for realistic tracking');
  console.log('- 8 sessions (3 today, 2 tomorrow, 3 completed)');
  console.log('- Session attendance records for all sessions');
  console.log('- 17 financial transactions (spanning 90 days)');
  console.log('- Gamification profiles, badges, and achievements');
  console.log('- Academic profiles for all 4 students');
  console.log('- Parent-student relationships:');
  console.log('  • Parent 1 → Student 1 (Jane) + Student 4 (Sophia)');
  console.log('  • Parent 2 → Student 2 (Alex)');
  console.log('  • Parent 3 → Student 3 (Michael)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
