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

  // Clean up existing data in correct order (respecting foreign keys)
  console.log('🧹 Cleaning up existing data...');

  await prisma.ticketComment.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.catchUpPackage.deleteMany({});
  await prisma.studentSessionEnrollment.deleteMany({});
  await prisma.sessionAttendance.deleteMany({});
  await prisma.refund.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceLine.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.studentAccount.deleteMany({});
  await prisma.feePlan.deleteMany({});
  await prisma.sLAConfig.deleteMany({});
  await prisma.classMembership.deleteMany({});
  await prisma.classCohort.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  await prisma.auditEvent.deleteMany({});

  console.log('✅ Cleanup complete');

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
      tutorId: teacher2.id,
    },
  });

  console.log('✅ Sessions created');

  // Create Student Session Enrollments (multi-student model)
  // This demonstrates the MAJOR PIVOT: each student can work on different content in the same session
  await prisma.studentSessionEnrollment.createMany({
    data: [
      // Today's Session 1 - Programming Q&A (3 students, different lessons)
      {
        sessionId: todaySession1.id,
        studentId: student1.id,
        courseId: course1.id,
        lessonId: lesson1_1_1.id,
        completed: false,
        notes: 'Working on Introduction to Programming',
      },
      {
        sessionId: todaySession1.id,
        studentId: student2.id,
        courseId: course1.id,
        lessonId: lesson1_1_1.id,
        completed: false,
        notes: 'Reviewing programming basics',
      },
      {
        sessionId: todaySession1.id,
        studentId: student3.id,
        courseId: course1.id,
        lessonId: lesson1_1_1.id,
        completed: false,
        notes: 'Catching up on fundamentals',
      },

      // Today's Session 2 - HTML Workshop (3 students)
      {
        sessionId: todaySession2.id,
        studentId: student1.id,
        courseId: course2.id,
        lessonId: lesson2_1_1.id,
        completed: false,
        notes: 'HTML structure and tags',
      },
      {
        sessionId: todaySession2.id,
        studentId: student2.id,
        courseId: course2.id,
        lessonId: lesson2_1_1.id,
        completed: false,
        notes: 'Building first webpage',
      },
      {
        sessionId: todaySession2.id,
        studentId: student4.id,
        courseId: course2.id,
        lessonId: lesson2_1_1.id,
        completed: false,
        notes: 'Introduction to HTML',
      },

      // Today's Session 3 - Algebra Study Group (2 students, different levels)
      {
        sessionId: todaySession3.id,
        studentId: student1.id,
        courseId: course3.id,
        lessonId: lesson3_1_1.id,
        completed: false,
        notes: 'Advanced algebraic expressions',
      },
      {
        sessionId: todaySession3.id,
        studentId: student3.id,
        courseId: course3.id,
        lessonId: lesson3_1_1.id,
        completed: false,
        notes: 'Basic algebra review',
      },

      // Tomorrow's Session 1 - Variables Deep Dive
      {
        sessionId: tomorrowSession1.id,
        studentId: student1.id,
        courseId: course1.id,
        lessonId: lesson1_2_1.id,
        completed: false,
        notes: 'Advanced variable concepts',
      },
      {
        sessionId: tomorrowSession1.id,
        studentId: student2.id,
        courseId: course1.id,
        lessonId: lesson1_2_1.id,
        completed: false,
        notes: 'Variable practice exercises',
      },

      // Tomorrow's Session 2 - CSS Styling
      {
        sessionId: tomorrowSession2.id,
        studentId: student1.id,
        courseId: course2.id,
        lessonId: lesson2_1_2.id,
        completed: false,
        notes: 'CSS layout techniques',
      },
      {
        sessionId: tomorrowSession2.id,
        studentId: student2.id,
        courseId: course2.id,
        lessonId: lesson2_1_2.id,
        completed: false,
        notes: 'Styling basics',
      },
      {
        sessionId: tomorrowSession2.id,
        studentId: student4.id,
        courseId: course2.id,
        lessonId: lesson2_1_2.id,
        completed: false,
        notes: 'First CSS styles',
      },

      // Completed Session 1 (with completion status)
      {
        sessionId: completedSession1.id,
        studentId: student1.id,
        courseId: course1.id,
        lessonId: lesson1_1_1.id,
        completed: true,
        notes: 'Successfully completed introduction',
      },
      {
        sessionId: completedSession1.id,
        studentId: student2.id,
        courseId: course1.id,
        lessonId: lesson1_1_1.id,
        completed: true,
        notes: 'Good understanding of basics',
      },

      // Completed Session 2
      {
        sessionId: completedSession2.id,
        studentId: student1.id,
        courseId: course2.id,
        lessonId: lesson2_1_1.id,
        completed: true,
        notes: 'Excellent progress on HTML',
      },
      {
        sessionId: completedSession2.id,
        studentId: student2.id,
        courseId: course2.id,
        lessonId: lesson2_1_1.id,
        completed: false,
        notes: 'Needs more practice',
      },
      {
        sessionId: completedSession2.id,
        studentId: student4.id,
        courseId: course2.id,
        lessonId: lesson2_1_1.id,
        completed: true,
        notes: 'Quick learner',
      },

      // Completed Session 3
      {
        sessionId: completedSession3.id,
        studentId: student1.id,
        courseId: course3.id,
        lessonId: lesson3_1_1.id,
        completed: true,
        notes: 'Mastered algebraic expressions',
      },
      {
        sessionId: completedSession3.id,
        studentId: student3.id,
        courseId: course3.id,
        lessonId: lesson3_1_1.id,
        completed: false,
        notes: 'Struggled with concepts, needs follow-up',
      },
    ],
  });

  console.log('✅ Student session enrollments created (multi-student model)');

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

  // ============================================================================
  // PHASE 1 MODELS - Governance, Academic, Operations, Finance
  // ============================================================================

  // Create SLA Configs for all ticket type/priority combinations
  const slaConfigs = [
    // IT tickets
    { type: 'IT', priority: 'URGENT', responseHours: 1, resolutionHours: 4 },
    { type: 'IT', priority: 'HIGH', responseHours: 2, resolutionHours: 8 },
    { type: 'IT', priority: 'MEDIUM', responseHours: 4, resolutionHours: 24 },
    { type: 'IT', priority: 'LOW', responseHours: 8, resolutionHours: 48 },
    // INVENTORY tickets
    { type: 'INVENTORY', priority: 'URGENT', responseHours: 2, resolutionHours: 8 },
    { type: 'INVENTORY', priority: 'HIGH', responseHours: 4, resolutionHours: 16 },
    { type: 'INVENTORY', priority: 'MEDIUM', responseHours: 8, resolutionHours: 48 },
    { type: 'INVENTORY', priority: 'LOW', responseHours: 24, resolutionHours: 72 },
    // COMPLAINT tickets
    { type: 'COMPLAINT', priority: 'URGENT', responseHours: 1, resolutionHours: 24 },
    { type: 'COMPLAINT', priority: 'HIGH', responseHours: 2, resolutionHours: 48 },
    { type: 'COMPLAINT', priority: 'MEDIUM', responseHours: 4, resolutionHours: 72 },
    { type: 'COMPLAINT', priority: 'LOW', responseHours: 8, resolutionHours: 120 },
    // MAINTENANCE tickets
    { type: 'MAINTENANCE', priority: 'URGENT', responseHours: 1, resolutionHours: 8 },
    { type: 'MAINTENANCE', priority: 'HIGH', responseHours: 2, resolutionHours: 24 },
    { type: 'MAINTENANCE', priority: 'MEDIUM', responseHours: 4, resolutionHours: 48 },
    { type: 'MAINTENANCE', priority: 'LOW', responseHours: 8, resolutionHours: 96 },
    // GENERAL tickets
    { type: 'GENERAL', priority: 'URGENT', responseHours: 2, resolutionHours: 8 },
    { type: 'GENERAL', priority: 'HIGH', responseHours: 4, resolutionHours: 24 },
    { type: 'GENERAL', priority: 'MEDIUM', responseHours: 8, resolutionHours: 48 },
    { type: 'GENERAL', priority: 'LOW', responseHours: 24, resolutionHours: 96 },
  ];

  for (const config of slaConfigs) {
    await prisma.sLAConfig.upsert({
      where: {
        centreId_ticketType_priority: {
          centreId: center1.id,
          ticketType: config.type,
          priority: config.priority,
        },
      },
      update: {
        responseTimeHours: config.responseHours,
        resolutionTimeHours: config.resolutionHours,
      },
      create: {
        ticketType: config.type,
        priority: config.priority,
        responseTimeHours: config.responseHours,
        resolutionTimeHours: config.resolutionHours,
        centreId: center1.id,
      },
    });
  }

  console.log('✅ SLA configs created (20 configurations)');

  // Create Class Cohorts
  const class1 = await prisma.classCohort.create({
    data: {
      name: 'Introduction to Programming - Spring 2026',
      subject: 'Computer Science',
      description: 'Beginner-friendly programming course for ages 12-15',
      startDate: new Date(Date.now() - SIXTY_DAYS_MS),
      endDate: new Date(Date.now() + THIRTY_DAYS_MS),
      maxCapacity: 20,
      currentEnrollment: 3,
      status: 'ACTIVE',
      teacherId: teacher1.id,
      centreId: center1.id,
    },
  });

  const class2 = await prisma.classCohort.create({
    data: {
      name: 'Web Development Basics - Spring 2026',
      subject: 'Web Development',
      description: 'HTML, CSS, and JavaScript fundamentals',
      startDate: new Date(Date.now() - FORTY_DAYS_MS),
      endDate: new Date(Date.now() + FIFTY_DAYS_MS),
      maxCapacity: 15,
      currentEnrollment: 3,
      status: 'ACTIVE',
      teacherId: teacher1.id,
      centreId: center1.id,
    },
  });

  const class3 = await prisma.classCohort.create({
    data: {
      name: 'Algebra Fundamentals - Spring 2026',
      subject: 'Mathematics',
      description: 'Core algebraic concepts and problem-solving',
      startDate: new Date(Date.now() - THIRTY_DAYS_MS),
      endDate: new Date(Date.now() + SIXTY_DAYS_MS),
      maxCapacity: 18,
      currentEnrollment: 2,
      status: 'ACTIVE',
      teacherId: teacher2.id,
      centreId: center1.id,
    },
  });

  console.log('✅ Class cohorts created (3 classes)');

  // Create Class Memberships
  await prisma.classMembership.createMany({
    data: [
      // Class 1 - Programming
      {
        classId: class1.id,
        studentId: student1.id,
        status: 'ACTIVE',
        joinedAt: new Date(Date.now() - FIFTYEIGHT_DAYS_MS),
        centreId: center1.id,
      },
      {
        classId: class1.id,
        studentId: student2.id,
        status: 'ACTIVE',
        joinedAt: new Date(Date.now() - FIFTYEIGHT_DAYS_MS),
        centreId: center1.id,
      },
      {
        classId: class1.id,
        studentId: student3.id,
        status: 'ACTIVE',
        joinedAt: new Date(Date.now() - FIFTY_DAYS_MS),
        centreId: center1.id,
      },
      // Class 2 - Web Dev
      {
        classId: class2.id,
        studentId: student1.id,
        status: 'ACTIVE',
        joinedAt: new Date(Date.now() - THIRTYFIVE_DAYS_MS),
        centreId: center1.id,
      },
      {
        classId: class2.id,
        studentId: student2.id,
        status: 'ACTIVE',
        joinedAt: new Date(Date.now() - THIRTYFIVE_DAYS_MS),
        centreId: center1.id,
      },
      {
        classId: class2.id,
        studentId: student4.id,
        status: 'ACTIVE',
        joinedAt: new Date(Date.now() - FIVE_DAYS_MS),
        centreId: center1.id,
      },
      // Class 3 - Algebra
      {
        classId: class3.id,
        studentId: student1.id,
        status: 'ACTIVE',
        joinedAt: new Date(Date.now() - TWENTYEIGHT_DAYS_MS),
        centreId: center1.id,
      },
      {
        classId: class3.id,
        studentId: student3.id,
        status: 'ACTIVE',
        joinedAt: new Date(Date.now() - TWENTYEIGHT_DAYS_MS),
        centreId: center1.id,
      },
    ],
  });

  console.log('✅ Class memberships created (8 memberships)');

  // Link sessions to classes (update existing sessions)
  await prisma.session.update({
    where: { id: completedSession1.id },
    data: { classId: class1.id },
  });
  await prisma.session.update({
    where: { id: completedSession2.id },
    data: { classId: class2.id },
  });
  await prisma.session.update({
    where: { id: completedSession3.id },
    data: { classId: class3.id },
  });
  await prisma.session.update({
    where: { id: todaySession1.id },
    data: { classId: class1.id },
  });
  await prisma.session.update({
    where: { id: todaySession2.id },
    data: { classId: class2.id },
  });
  await prisma.session.update({
    where: { id: todaySession3.id },
    data: { classId: class3.id },
  });
  await prisma.session.update({
    where: { id: tomorrowSession1.id },
    data: { classId: class1.id },
  });
  await prisma.session.update({
    where: { id: tomorrowSession2.id },
    data: { classId: class2.id },
  });

  console.log('✅ Sessions linked to classes');

  // Update sessions with sessionMode and location details
  await prisma.session.update({
    where: { id: todaySession1.id },
    data: {
      sessionMode: 'ONLINE',
      meetingLink: 'https://teams.microsoft.com/join/abc123',
    },
  });
  await prisma.session.update({
    where: { id: todaySession2.id },
    data: {
      sessionMode: 'PHYSICAL',
      physicalLocation: 'Room 101, Main Campus Building',
    },
  });
  await prisma.session.update({
    where: { id: todaySession3.id },
    data: {
      sessionMode: 'ONLINE',
      meetingLink: 'https://teams.microsoft.com/join/def456',
    },
  });
  await prisma.session.update({
    where: { id: tomorrowSession1.id },
    data: {
      sessionMode: 'ONLINE',
      meetingLink: 'https://teams.microsoft.com/join/tomorrow1',
    },
  });
  await prisma.session.update({
    where: { id: tomorrowSession2.id },
    data: {
      sessionMode: 'PHYSICAL',
      physicalLocation: 'Room 205, Science Building',
    },
  });
  await prisma.session.update({
    where: { id: completedSession1.id },
    data: {
      sessionMode: 'ONLINE',
      meetingLink: 'https://zoom.us/j/completed1',
    },
  });
  await prisma.session.update({
    where: { id: completedSession2.id },
    data: {
      sessionMode: 'PHYSICAL',
      physicalLocation: 'Room 303, Arts Building',
    },
  });
  await prisma.session.update({
    where: { id: completedSession3.id },
    data: {
      sessionMode: 'ONLINE',
      meetingLink: 'https://teams.microsoft.com/join/completed3',
    },
  });

  console.log('✅ Sessions updated with mode and location details');

  // Create Attendance Records for completed sessions
  const attendance1 = await prisma.attendanceRecord.create({
    data: {
      sessionId: completedSession1.id,
      studentId: student1.id,
      status: 'PRESENT',
      markedAt: new Date(completedSession1.startTime.getTime() + 5 * 60 * 1000),
      markedById: teacher1.id,
      centreId: center1.id,
    },
  });

  const attendance2 = await prisma.attendanceRecord.create({
    data: {
      sessionId: completedSession1.id,
      studentId: student2.id,
      status: 'LATE',
      markedAt: new Date(completedSession1.startTime.getTime() + 15 * 60 * 1000),
      markedById: teacher1.id,
      notes: 'Arrived 15 minutes late',
      centreId: center1.id,
    },
  });

  const attendance3 = await prisma.attendanceRecord.create({
    data: {
      sessionId: completedSession1.id,
      studentId: student3.id,
      status: 'ABSENT',
      markedAt: new Date(completedSession1.startTime.getTime() + 30 * 60 * 1000),
      markedById: teacher1.id,
      notes: 'No notification received',
      centreId: center1.id,
    },
  });

  const attendance4 = await prisma.attendanceRecord.create({
    data: {
      sessionId: completedSession2.id,
      studentId: student1.id,
      status: 'PRESENT',
      markedAt: new Date(completedSession2.startTime.getTime() + 2 * 60 * 1000),
      markedById: teacher1.id,
      centreId: center1.id,
    },
  });

  const attendance5 = await prisma.attendanceRecord.create({
    data: {
      sessionId: completedSession2.id,
      studentId: student2.id,
      status: 'PRESENT',
      markedAt: new Date(completedSession2.startTime.getTime() + 2 * 60 * 1000),
      markedById: teacher1.id,
      centreId: center1.id,
    },
  });

  const attendance6 = await prisma.attendanceRecord.create({
    data: {
      sessionId: completedSession2.id,
      studentId: student4.id,
      status: 'ABSENT',
      markedAt: new Date(completedSession2.startTime.getTime() + 30 * 60 * 1000),
      markedById: teacher1.id,
      notes: 'Sick - parent notified',
      centreId: center1.id,
    },
  });

  const attendance7 = await prisma.attendanceRecord.create({
    data: {
      sessionId: completedSession3.id,
      studentId: student1.id,
      status: 'PRESENT',
      markedAt: new Date(completedSession3.startTime.getTime() + 2 * 60 * 1000),
      markedById: teacher2.id,
      centreId: center1.id,
    },
  });

  const attendance8 = await prisma.attendanceRecord.create({
    data: {
      sessionId: completedSession3.id,
      studentId: student3.id,
      status: 'EXCUSED',
      markedAt: new Date(completedSession3.startTime.getTime() + 2 * 60 * 1000),
      markedById: teacher2.id,
      notes: 'Medical appointment - advance notice provided',
      centreId: center1.id,
    },
  });

  console.log('✅ Attendance records created (8 records)');

  // Create Catch-up Packages for absent students
  await prisma.catchUpPackage.create({
    data: {
      studentId: student3.id,
      sessionId: completedSession1.id,
      attendanceId: attendance3.id,
      status: 'PENDING',
      dueDate: new Date(completedSession1.startTime.getTime() + 7 * ONE_DAY_MS),
      resources: {
        materials: [
          { type: 'VIDEO', url: 'https://example.com/recordings/session1.mp4', title: 'Session Recording', duration: 60 },
          { type: 'PDF', url: 'https://example.com/materials/lesson-notes.pdf', title: 'Lesson Notes' },
          { type: 'QUIZ', url: 'https://example.com/quiz/checkpoint-1', title: 'Checkpoint Quiz' },
        ],
      },
      notes: 'Complete recording review and checkpoint quiz by due date',
      centreId: center1.id,
    },
  });

  await prisma.catchUpPackage.create({
    data: {
      studentId: student4.id,
      sessionId: completedSession2.id,
      attendanceId: attendance6.id,
      status: 'COMPLETED',
      dueDate: new Date(completedSession2.startTime.getTime() + 7 * ONE_DAY_MS),
      completedAt: new Date(completedSession2.startTime.getTime() + 5 * ONE_DAY_MS),
      resources: {
        materials: [
          { type: 'VIDEO', url: 'https://example.com/recordings/session2.mp4', title: 'HTML Basics Recording', duration: 90 },
          { type: 'PDF', url: 'https://example.com/materials/html-guide.pdf', title: 'HTML Quick Guide' },
        ],
      },
      notes: 'Completed ahead of schedule - excellent work!',
      centreId: center1.id,
    },
  });

  console.log('✅ Catch-up packages created (2 packages)');

  // Create Tickets with various types and statuses
  const ticketNumber = (n: number) => `TICK-2026-${String(n).padStart(4, '0')}`;

  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: ticketNumber(1),
      type: 'IT',
      priority: 'URGENT',
      status: 'RESOLVED',
      subject: 'Projector not working in Room 301',
      description: 'The projector in Room 301 is not turning on. Need immediate fix as class starts in 1 hour.',
      createdById: teacher1.id,
      assignedToId: centerAdmin.id,
      resolution: 'Replaced HDMI cable. Tested and working.',
      slaDueAt: new Date(Date.now() - FIVE_DAYS_MS + 4 * 60 * 60 * 1000),
      centreId: center1.id,
      createdAt: new Date(Date.now() - FIVE_DAYS_MS),
      updatedAt: new Date(Date.now() - FIVE_DAYS_MS + 2 * 60 * 60 * 1000),
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: ticketNumber(2),
      type: 'INVENTORY',
      priority: 'MEDIUM',
      status: 'OPEN',
      subject: 'Low stock on whiteboard markers',
      description: 'We are running low on whiteboard markers. Need to order 50 more (assorted colors).',
      createdById: teacher2.id,
      assignedToId: centerAdmin.id,
      slaDueAt: new Date(Date.now() + 40 * 60 * 60 * 1000),
      centreId: center1.id,
      createdAt: new Date(Date.now() - TWO_DAYS_MS),
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: ticketNumber(3),
      type: 'COMPLAINT',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      subject: 'Noise disruption from adjacent room',
      description: 'There has been consistent noise disruption from the room next door during lesson time. This is affecting student concentration.',
      createdById: teacher1.id,
      assignedToId: supervisor.id,
      slaDueAt: new Date(Date.now() + 46 * 60 * 60 * 1000),
      centreId: center1.id,
      createdAt: new Date(Date.now() - TWO_DAYS_MS),
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      ticketNumber: ticketNumber(4),
      type: 'MAINTENANCE',
      priority: 'LOW',
      status: 'OPEN',
      subject: 'Air conditioning filter replacement',
      description: 'Scheduled maintenance: Replace air conditioning filters in all classrooms.',
      createdById: centerAdmin.id,
      slaDueAt: new Date(Date.now() + 88 * 60 * 60 * 1000),
      centreId: center1.id,
      createdAt: new Date(Date.now() - ONE_DAY_MS),
    },
  });

  const ticket5 = await prisma.ticket.create({
    data: {
      ticketNumber: ticketNumber(5),
      type: 'IT',
      priority: 'HIGH',
      status: 'ESCALATED',
      subject: 'Internet connectivity issues',
      description: 'Intermittent internet connection in Building B. Multiple teachers reported slow speeds and dropouts.',
      createdById: teacher2.id,
      assignedToId: centerAdmin.id,
      slaDueAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isOverdue: true,
      centreId: center1.id,
      createdAt: new Date(Date.now() - TEN_DAYS_MS),
    },
  });

  const ticket6 = await prisma.ticket.create({
    data: {
      ticketNumber: ticketNumber(6),
      type: 'GENERAL',
      priority: 'MEDIUM',
      status: 'CLOSED',
      subject: 'Request for additional storage cabinet',
      description: 'Need additional storage cabinet in staff room for teaching materials.',
      createdById: teacher1.id,
      assignedToId: centerAdmin.id,
      resolution: 'New storage cabinet ordered and installed in staff room.',
      slaDueAt: new Date(Date.now() - FORTY_DAYS_MS + 48 * 60 * 60 * 1000),
      centreId: center1.id,
      createdAt: new Date(Date.now() - FORTY_DAYS_MS),
      updatedAt: new Date(Date.now() - THIRTYFIVE_DAYS_MS),
    },
  });

  const ticket7 = await prisma.ticket.create({
    data: {
      ticketNumber: ticketNumber(7),
      type: 'COMPLAINT',
      priority: 'URGENT',
      status: 'RESOLVED',
      subject: 'Parent complaint about lesson pace',
      description: 'Parent (Robert Johnson) expressed concern that lessons are moving too quickly for their child (Jane).',
      createdById: supervisor.id,
      assignedToId: teacher1.id,
      resolution: 'Met with parent and student. Adjusted lesson pace and added supplementary materials. Parent satisfied with resolution.',
      slaDueAt: new Date(Date.now() - FIFTEEN_DAYS_MS + 24 * 60 * 60 * 1000),
      centreId: center1.id,
      createdAt: new Date(Date.now() - FIFTEEN_DAYS_MS),
      updatedAt: new Date(Date.now() - FIFTEEN_DAYS_MS + 20 * 60 * 60 * 1000),
    },
  });

  const ticket8 = await prisma.ticket.create({
    data: {
      ticketNumber: ticketNumber(8),
      type: 'IT',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      subject: 'Software update required for student tablets',
      description: 'Student tablets need software update to latest version for new curriculum compatibility.',
      createdById: centerAdmin.id,
      assignedToId: centerAdmin.id,
      slaDueAt: new Date(Date.now() + 16 * 60 * 60 * 1000),
      centreId: center1.id,
      createdAt: new Date(Date.now() - TWO_DAYS_MS),
    },
  });

  console.log('✅ Tickets created (8 tickets across various types and statuses)');

  // Create Ticket Comments
  await prisma.ticketComment.createMany({
    data: [
      {
        ticketId: ticket3.id,
        userId: supervisor.id,
        userName: supervisor.name,
        text: 'Investigating the source of noise. Will speak with the teacher in the adjacent room.',
        isInternal: true,
        createdAt: new Date(Date.now() - ONE_DAY_MS),
      },
      {
        ticketId: ticket3.id,
        userId: supervisor.id,
        userName: supervisor.name,
        text: 'Spoke with adjacent teacher. They will keep noise levels down during lesson hours.',
        isInternal: false,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        ticketId: ticket5.id,
        userId: centerAdmin.id,
        userName: centerAdmin.name,
        text: 'Contacted IT vendor. They will send technician tomorrow morning.',
        isInternal: true,
        createdAt: new Date(Date.now() - 8 * ONE_DAY_MS),
      },
      {
        ticketId: ticket5.id,
        userId: centerAdmin.id,
        userName: centerAdmin.name,
        text: 'ESCALATED: Issue persists after vendor visit. Need senior technician.',
        isInternal: true,
        isSystem: true,
        createdAt: new Date(Date.now() - 3 * ONE_DAY_MS),
      },
    ],
  });

  console.log('✅ Ticket comments created');

  // Create Fee Plans
  const feePlan1 = await prisma.feePlan.create({
    data: {
      name: 'Standard Weekly Tuition',
      description: 'Weekly tuition fee for regular courses',
      amount: 75.00,
      currency: 'USD',
      frequency: 'WEEKLY',
      status: 'ACTIVE',
      centreId: center1.id,
    },
  });

  const feePlan2 = await prisma.feePlan.create({
    data: {
      name: 'Monthly Subscription',
      description: 'Monthly unlimited access to all courses',
      amount: 250.00,
      currency: 'USD',
      frequency: 'MONTHLY',
      status: 'ACTIVE',
      centreId: center1.id,
    },
  });

  const feePlan3 = await prisma.feePlan.create({
    data: {
      name: 'Term Fee',
      description: 'One-time term fee (12 weeks)',
      amount: 850.00,
      currency: 'USD',
      frequency: 'TERM',
      status: 'ACTIVE',
      centreId: center1.id,
    },
  });

  const feePlan4 = await prisma.feePlan.create({
    data: {
      name: 'Annual Membership',
      description: 'Annual unlimited access with 15% discount',
      amount: 2550.00,
      currency: 'USD',
      frequency: 'ANNUAL',
      status: 'ACTIVE',
      centreId: center1.id,
    },
  });

  console.log('✅ Fee plans created (4 plans)');

  // Create Student Accounts
  const studentAccount1 = await prisma.studentAccount.create({
    data: {
      studentId: student1.id,
      totalBilled: 1200.00,
      totalPaid: 1200.00,
      totalRefunded: 0.00,
      balance: 0.00,
      centreId: center1.id,
    },
  });

  const studentAccount2 = await prisma.studentAccount.create({
    data: {
      studentId: student2.id,
      totalBilled: 950.00,
      totalPaid: 700.00,
      totalRefunded: 0.00,
      balance: 250.00,
      centreId: center1.id,
    },
  });

  const studentAccount3 = await prisma.studentAccount.create({
    data: {
      studentId: student3.id,
      totalBilled: 850.00,
      totalPaid: 350.00,
      totalRefunded: 0.00,
      balance: 500.00,
      centreId: center1.id,
    },
  });

  const studentAccount4 = await prisma.studentAccount.create({
    data: {
      studentId: student4.id,
      totalBilled: 250.00,
      totalPaid: 250.00,
      totalRefunded: 0.00,
      balance: 0.00,
      centreId: center1.id,
    },
  });

  console.log('✅ Student accounts created (4 accounts)');

  // Create Invoices
  const invoiceNumber = (n: number) => `INV-2026-${String(n).padStart(4, '0')}`;

  // Student 1 - All paid (high performer)
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNumber(1),
      studentAccountId: studentAccount1.id,
      studentId: student1.id,
      feePlanId: feePlan3.id,
      issueDate: new Date(Date.now() - NINETY_DAYS_MS),
      dueDate: new Date(Date.now() - EIGHTY_DAYS_MS),
      sentAt: new Date(Date.now() - NINETY_DAYS_MS),
      status: 'PAID',
      subtotal: 850.00,
      tax: 0.00,
      total: 850.00,
      paidAmount: 850.00,
      balance: 0.00,
      notes: 'Term fee for Spring 2026 - Programming course',
      centreId: center1.id,
      createdAt: new Date(Date.now() - NINETY_DAYS_MS),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice1.id,
      description: 'Introduction to Programming - Spring Term 2026',
      quantity: 1,
      unitPrice: 850.00,
      amount: 850.00,
      order: 1,
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNumber(2),
      studentAccountId: studentAccount1.id,
      studentId: student1.id,
      feePlanId: feePlan2.id,
      issueDate: new Date(Date.now() - THIRTY_DAYS_MS),
      dueDate: new Date(Date.now() - TWENTY_DAYS_MS),
      sentAt: new Date(Date.now() - THIRTY_DAYS_MS),
      status: 'PAID',
      subtotal: 250.00,
      tax: 0.00,
      total: 250.00,
      paidAmount: 250.00,
      balance: 0.00,
      notes: 'Monthly subscription - February 2026',
      centreId: center1.id,
      createdAt: new Date(Date.now() - THIRTY_DAYS_MS),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice2.id,
      description: 'Monthly Unlimited Access - February 2026',
      quantity: 1,
      unitPrice: 250.00,
      amount: 250.00,
      order: 1,
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNumber(3),
      studentAccountId: studentAccount1.id,
      studentId: student1.id,
      issueDate: new Date(Date.now() - FIVE_DAYS_MS),
      dueDate: new Date(Date.now() + TWENTYFIVE_DAYS_MS),
      sentAt: new Date(Date.now() - FIVE_DAYS_MS),
      status: 'SENT',
      subtotal: 100.00,
      tax: 0.00,
      total: 100.00,
      paidAmount: 0.00,
      balance: 100.00,
      notes: 'Additional materials fee',
      centreId: center1.id,
      createdAt: new Date(Date.now() - FIVE_DAYS_MS),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice3.id,
      description: 'Course materials and textbooks',
      quantity: 1,
      unitPrice: 100.00,
      amount: 100.00,
      order: 1,
    },
  });

  // Student 2 - Partial payment
  const invoice4 = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNumber(4),
      studentAccountId: studentAccount2.id,
      studentId: student2.id,
      feePlanId: feePlan2.id,
      issueDate: new Date(Date.now() - SEVENTY_DAYS_MS),
      dueDate: new Date(Date.now() - SIXTY_DAYS_MS),
      sentAt: new Date(Date.now() - SEVENTY_DAYS_MS),
      status: 'PAID',
      subtotal: 250.00,
      tax: 0.00,
      total: 250.00,
      paidAmount: 250.00,
      balance: 0.00,
      centreId: center1.id,
      createdAt: new Date(Date.now() - SEVENTY_DAYS_MS),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice4.id,
      description: 'Monthly Unlimited Access - December 2025',
      quantity: 1,
      unitPrice: 250.00,
      amount: 250.00,
      order: 1,
    },
  });

  const invoice5 = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNumber(5),
      studentAccountId: studentAccount2.id,
      studentId: student2.id,
      feePlanId: feePlan2.id,
      issueDate: new Date(Date.now() - FORTY_DAYS_MS),
      dueDate: new Date(Date.now() - THIRTY_DAYS_MS),
      sentAt: new Date(Date.now() - FORTY_DAYS_MS),
      status: 'PARTIAL',
      subtotal: 250.00,
      tax: 0.00,
      total: 250.00,
      paidAmount: 150.00,
      balance: 100.00,
      centreId: center1.id,
      createdAt: new Date(Date.now() - FORTY_DAYS_MS),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice5.id,
      description: 'Monthly Unlimited Access - January 2026',
      quantity: 1,
      unitPrice: 250.00,
      amount: 250.00,
      order: 1,
    },
  });

  const invoice6 = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNumber(6),
      studentAccountId: studentAccount2.id,
      studentId: student2.id,
      feePlanId: feePlan1.id,
      issueDate: new Date(Date.now() - TEN_DAYS_MS),
      dueDate: new Date(Date.now()),
      sentAt: new Date(Date.now() - TEN_DAYS_MS),
      status: 'OVERDUE',
      subtotal: 450.00,
      tax: 0.00,
      total: 450.00,
      paidAmount: 300.00,
      balance: 150.00,
      centreId: center1.id,
      createdAt: new Date(Date.now() - TEN_DAYS_MS),
    },
  });

  await prisma.invoiceLine.createMany({
    data: [
      {
        invoiceId: invoice6.id,
        description: 'Weekly Tuition - Week 1',
        quantity: 1,
        unitPrice: 75.00,
        amount: 75.00,
        order: 1,
      },
      {
        invoiceId: invoice6.id,
        description: 'Weekly Tuition - Week 2',
        quantity: 1,
        unitPrice: 75.00,
        amount: 75.00,
        order: 2,
      },
      {
        invoiceId: invoice6.id,
        description: 'Weekly Tuition - Week 3',
        quantity: 1,
        unitPrice: 75.00,
        amount: 75.00,
        order: 3,
      },
      {
        invoiceId: invoice6.id,
        description: 'Weekly Tuition - Week 4',
        quantity: 1,
        unitPrice: 75.00,
        amount: 75.00,
        order: 4,
      },
      {
        invoiceId: invoice6.id,
        description: 'Weekly Tuition - Week 5',
        quantity: 1,
        unitPrice: 75.00,
        amount: 75.00,
        order: 5,
      },
      {
        invoiceId: invoice6.id,
        description: 'Weekly Tuition - Week 6',
        quantity: 1,
        unitPrice: 75.00,
        amount: 75.00,
        order: 6,
      },
    ],
  });

  // Student 3 - Significant overdue
  const invoice7 = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNumber(7),
      studentAccountId: studentAccount3.id,
      studentId: student3.id,
      feePlanId: feePlan3.id,
      issueDate: new Date(Date.now() - EIGHTY_DAYS_MS),
      dueDate: new Date(Date.now() - SEVENTY_DAYS_MS),
      sentAt: new Date(Date.now() - EIGHTY_DAYS_MS),
      status: 'OVERDUE',
      subtotal: 850.00,
      tax: 0.00,
      total: 850.00,
      paidAmount: 350.00,
      balance: 500.00,
      notes: 'Multiple payment reminders sent',
      centreId: center1.id,
      createdAt: new Date(Date.now() - EIGHTY_DAYS_MS),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice7.id,
      description: 'Introduction to Programming - Spring Term 2026',
      quantity: 1,
      unitPrice: 850.00,
      amount: 850.00,
      order: 1,
    },
  });

  // Student 4 - New student, paid
  const invoice8 = await prisma.invoice.create({
    data: {
      invoiceNumber: invoiceNumber(8),
      studentAccountId: studentAccount4.id,
      studentId: student4.id,
      feePlanId: feePlan2.id,
      issueDate: new Date(Date.now() - FIVE_DAYS_MS),
      dueDate: new Date(Date.now() + TWENTYFIVE_DAYS_MS),
      sentAt: new Date(Date.now() - FIVE_DAYS_MS),
      status: 'PAID',
      subtotal: 250.00,
      tax: 0.00,
      total: 250.00,
      paidAmount: 250.00,
      balance: 0.00,
      centreId: center1.id,
      createdAt: new Date(Date.now() - FIVE_DAYS_MS),
    },
  });

  await prisma.invoiceLine.create({
    data: {
      invoiceId: invoice8.id,
      description: 'Monthly Unlimited Access - February 2026',
      quantity: 1,
      unitPrice: 250.00,
      amount: 250.00,
      order: 1,
    },
  });

  console.log('✅ Invoices created (8 invoices with line items)');

  // Create Payments
  const payment1 = await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 850.00,
      method: 'BANK_TRANSFER',
      paymentDate: new Date(Date.now() - EIGHTY_DAYS_MS + ONE_DAY_MS),
      reference: 'TXN-20260101-001',
      recordedById: financeAdmin.id,
      centreId: center1.id,
      createdAt: new Date(Date.now() - EIGHTY_DAYS_MS + ONE_DAY_MS),
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      amount: 250.00,
      method: 'CARD',
      paymentDate: new Date(Date.now() - TWENTY_DAYS_MS),
      reference: 'CARD-202601-456',
      recordedById: financeAdmin.id,
      centreId: center1.id,
      createdAt: new Date(Date.now() - TWENTY_DAYS_MS),
    },
  });

  const payment3 = await prisma.payment.create({
    data: {
      invoiceId: invoice4.id,
      amount: 250.00,
      method: 'CARD',
      paymentDate: new Date(Date.now() - SIXTY_DAYS_MS + TWO_DAYS_MS),
      reference: 'CARD-202512-789',
      recordedById: financeAdmin.id,
      centreId: center1.id,
      createdAt: new Date(Date.now() - SIXTY_DAYS_MS + TWO_DAYS_MS),
    },
  });

  const payment4 = await prisma.payment.create({
    data: {
      invoiceId: invoice5.id,
      amount: 150.00,
      method: 'CASH',
      paymentDate: new Date(Date.now() - TWENTYFIVE_DAYS_MS),
      notes: 'Partial payment - parent requested payment plan',
      recordedById: financeAdmin.id,
      centreId: center1.id,
      createdAt: new Date(Date.now() - TWENTYFIVE_DAYS_MS),
    },
  });

  const payment5 = await prisma.payment.create({
    data: {
      invoiceId: invoice6.id,
      amount: 300.00,
      method: 'CHECK',
      paymentDate: new Date(Date.now() - FIVE_DAYS_MS),
      reference: 'CHK-4567',
      notes: 'Partial payment - balance overdue',
      recordedById: financeAdmin.id,
      centreId: center1.id,
      createdAt: new Date(Date.now() - FIVE_DAYS_MS),
    },
  });

  const payment6 = await prisma.payment.create({
    data: {
      invoiceId: invoice7.id,
      amount: 350.00,
      method: 'CASH',
      paymentDate: new Date(Date.now() - SIXTY_DAYS_MS),
      notes: 'Initial payment - balance overdue',
      recordedById: financeAdmin.id,
      centreId: center1.id,
      createdAt: new Date(Date.now() - SIXTY_DAYS_MS),
    },
  });

  const payment7 = await prisma.payment.create({
    data: {
      invoiceId: invoice8.id,
      amount: 250.00,
      method: 'BANK_TRANSFER',
      paymentDate: new Date(Date.now() - FIVE_DAYS_MS + 6 * 60 * 60 * 1000),
      reference: 'TXN-20260206-123',
      recordedById: financeAdmin.id,
      centreId: center1.id,
      createdAt: new Date(Date.now() - FIVE_DAYS_MS + 6 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Payments created (7 payment records)');

  // Create Refunds
  const refundNumber = (n: number) => `REF-2026-${String(n).padStart(4, '0')}`;

  const refund1 = await prisma.refund.create({
    data: {
      refundNumber: refundNumber(1),
      paymentId: payment2.id,
      amount: 100.00,
      reason: 'Student cancelled one course mid-month. Prorated refund for unused portion.',
      status: 'APPROVED',
      refundMethod: 'ORIGINAL_METHOD',
      processedDate: new Date(Date.now() - TEN_DAYS_MS),
      processedReference: 'REF-CARD-456',
      requestedById: financeAdmin.id,
      approvedById: centerAdmin.id,
      approvedAt: new Date(Date.now() - TEN_DAYS_MS),
      centreId: center1.id,
      createdAt: new Date(Date.now() - FIFTEEN_DAYS_MS),
    },
  });

  const refund2 = await prisma.refund.create({
    data: {
      refundNumber: refundNumber(2),
      paymentId: payment6.id,
      amount: 75.00,
      reason: 'Duplicate charge - student was charged twice for the same week',
      status: 'PENDING',
      requestedById: financeAdmin.id,
      centreId: center1.id,
      createdAt: new Date(Date.now() - TWO_DAYS_MS),
    },
  });

  console.log('✅ Refunds created (2 refund requests)');

  // Create Approval Requests
  const approval1 = await prisma.approvalRequest.create({
    data: {
      type: 'REFUND',
      requestedById: financeAdmin.id,
      requestedByName: financeAdmin.name,
      status: 'PENDING',
      resourceType: 'Refund',
      resourceId: refund2.id,
      metadata: {
        amount: 75.00,
        reason: 'Duplicate charge - student was charged twice for the same week',
        studentName: student3.name,
        invoiceNumber: invoice7.invoiceNumber,
      },
      expiresAt: new Date(Date.now() + 7 * ONE_DAY_MS),
      centreId: center1.id,
      createdAt: new Date(Date.now() - TWO_DAYS_MS),
    },
  });

  // Link refund to approval
  await prisma.refund.update({
    where: { id: refund2.id },
    data: { approvalRequestId: approval1.id },
  });

  const approval2 = await prisma.approvalRequest.create({
    data: {
      type: 'FEE_WAIVER',
      requestedById: teacher1.id,
      requestedByName: teacher1.name,
      status: 'PENDING',
      resourceType: 'Invoice',
      resourceId: invoice7.id,
      metadata: {
        amount: 250.00,
        reason: 'Family experiencing financial hardship. Request partial waiver.',
        studentName: student3.name,
        invoiceNumber: invoice7.invoiceNumber,
      },
      expiresAt: new Date(Date.now() + 14 * ONE_DAY_MS),
      centreId: center1.id,
      createdAt: new Date(Date.now() - FIVE_DAYS_MS),
    },
  });

  const approval3 = await prisma.approvalRequest.create({
    data: {
      type: 'TUTOR_OVERRIDE',
      requestedById: supervisor.id,
      requestedByName: supervisor.name,
      status: 'APPROVED',
      approvedById: centerAdmin.id,
      approvedByName: centerAdmin.name,
      approvedAt: new Date(Date.now() - TWENTY_DAYS_MS),
      resourceType: 'ClassCohort',
      resourceId: class1.id,
      metadata: {
        originalTeacher: teacher2.name,
        newTeacher: teacher1.name,
        reason: 'Teacher 2 on medical leave. Reassigning class to Teacher 1.',
        classname: class1.name,
      },
      comment: 'Approved due to medical leave. Temporary reassignment.',
      expiresAt: new Date(Date.now() + 30 * ONE_DAY_MS),
      centreId: center1.id,
      createdAt: new Date(Date.now() - TWENTYFIVE_DAYS_MS),
    },
  });

  console.log('✅ Approval requests created (3 requests: 2 pending, 1 approved)');

  // Create Audit Events (historical logs for past 3 months)
  await prisma.auditEvent.createMany({
    data: [
      // Refund approval
      {
        userId: centerAdmin.id,
        userName: centerAdmin.name,
        userRole: 'CENTER_ADMIN',
        action: 'APPROVE',
        resourceType: 'Refund',
        resourceId: refund1.id,
        beforeState: { status: 'PENDING' },
        afterState: { status: 'APPROVED', approvedBy: centerAdmin.id },
        centreId: center1.id,
        createdAt: new Date(Date.now() - TEN_DAYS_MS),
      },
      // Invoice creation
      {
        userId: financeAdmin.id,
        userName: financeAdmin.name,
        userRole: 'FINANCE_ADMIN',
        action: 'CREATE',
        resourceType: 'Invoice',
        resourceId: invoice8.id,
        afterState: { invoiceNumber: invoice8.invoiceNumber, total: 250.00, status: 'SENT' },
        centreId: center1.id,
        createdAt: new Date(Date.now() - FIVE_DAYS_MS),
      },
      // Payment recorded
      {
        userId: financeAdmin.id,
        userName: financeAdmin.name,
        userRole: 'FINANCE_ADMIN',
        action: 'CREATE',
        resourceType: 'Payment',
        resourceId: payment7.id,
        afterState: { amount: 250.00, method: 'BANK_TRANSFER', invoiceId: invoice8.id },
        centreId: center1.id,
        createdAt: new Date(Date.now() - FIVE_DAYS_MS + 6 * 60 * 60 * 1000),
      },
      // Invoice status update
      {
        userId: financeAdmin.id,
        userName: financeAdmin.name,
        userRole: 'FINANCE_ADMIN',
        action: 'UPDATE',
        resourceType: 'Invoice',
        resourceId: invoice8.id,
        beforeState: { status: 'SENT', paidAmount: 0 },
        afterState: { status: 'PAID', paidAmount: 250.00 },
        centreId: center1.id,
        createdAt: new Date(Date.now() - FIVE_DAYS_MS + 7 * 60 * 60 * 1000),
      },
      // Ticket escalation
      {
        userId: centerAdmin.id,
        userName: centerAdmin.name,
        userRole: 'CENTER_ADMIN',
        action: 'ESCALATE',
        resourceType: 'Ticket',
        resourceId: ticket5.id,
        beforeState: { status: 'IN_PROGRESS', isOverdue: false },
        afterState: { status: 'ESCALATED', isOverdue: true },
        centreId: center1.id,
        createdAt: new Date(Date.now() - 3 * ONE_DAY_MS),
      },
      // Class cohort creation
      {
        userId: centerAdmin.id,
        userName: centerAdmin.name,
        userRole: 'CENTER_ADMIN',
        action: 'CREATE',
        resourceType: 'ClassCohort',
        resourceId: class1.id,
        afterState: { name: class1.name, teacherId: teacher1.id, maxCapacity: 20 },
        centreId: center1.id,
        createdAt: new Date(Date.now() - SIXTY_DAYS_MS),
      },
      // Approval request - Tutor override
      {
        userId: centerAdmin.id,
        userName: centerAdmin.name,
        userRole: 'CENTER_ADMIN',
        action: 'APPROVE',
        resourceType: 'ApprovalRequest',
        resourceId: approval3.id,
        beforeState: { status: 'PENDING' },
        afterState: { status: 'APPROVED', approvedBy: centerAdmin.id },
        centreId: center1.id,
        createdAt: new Date(Date.now() - TWENTY_DAYS_MS),
      },
      // Fee plan created
      {
        userId: financeAdmin.id,
        userName: financeAdmin.name,
        userRole: 'FINANCE_ADMIN',
        action: 'CREATE',
        resourceType: 'FeePlan',
        resourceId: feePlan1.id,
        afterState: { name: feePlan1.name, amount: 75.00, frequency: 'WEEKLY' },
        centreId: center1.id,
        createdAt: new Date(Date.now() - NINETY_DAYS_MS),
      },
      // Student account created
      {
        userId: financeAdmin.id,
        userName: financeAdmin.name,
        userRole: 'FINANCE_ADMIN',
        action: 'CREATE',
        resourceType: 'StudentAccount',
        resourceId: studentAccount1.id,
        afterState: { studentId: student1.id, balance: 0.00 },
        centreId: center1.id,
        createdAt: new Date(Date.now() - NINETY_DAYS_MS + ONE_DAY_MS),
      },
      // Attendance marked
      {
        userId: teacher1.id,
        userName: teacher1.name,
        userRole: 'TEACHER',
        action: 'CREATE',
        resourceType: 'AttendanceRecord',
        resourceId: attendance1.id,
        afterState: { sessionId: completedSession1.id, studentId: student1.id, status: 'PRESENT' },
        centreId: center1.id,
        createdAt: new Date(completedSession1.startTime.getTime() + 5 * 60 * 1000),
      },
      // Catch-up package generated
      {
        userId: teacher1.id,
        userName: teacher1.name,
        userRole: 'TEACHER',
        action: 'CREATE',
        resourceType: 'CatchUpPackage',
        resourceId: attendance3.id,
        afterState: { studentId: student3.id, sessionId: completedSession1.id, status: 'PENDING' },
        centreId: center1.id,
        metadata: { reason: 'Student absent - auto-generated catch-up package' },
        createdAt: new Date(completedSession1.endTime!.getTime() + 30 * 60 * 1000),
      },
      // Refund requested
      {
        userId: financeAdmin.id,
        userName: financeAdmin.name,
        userRole: 'FINANCE_ADMIN',
        action: 'CREATE',
        resourceType: 'Refund',
        resourceId: refund2.id,
        afterState: { refundNumber: refund2.refundNumber, amount: 75.00, status: 'PENDING' },
        centreId: center1.id,
        createdAt: new Date(Date.now() - TWO_DAYS_MS),
      },
    ],
  });

  console.log('✅ Audit events created (12 historical audit logs)');

  // =============================================================================
  // PHASE 1: INDIVIDUALIZED TUTORING PLATFORM SEED DATA
  // =============================================================================

  console.log('\n📚 Seeding Phase 1: Individualized Tutoring Platform data...');

  // Clean up Phase 1 data first
  await prisma.chatMessage.deleteMany({});
  await prisma.awardRedemption.deleteMany({});
  await prisma.award.deleteMany({});
  await prisma.sessionTemplate.deleteMany({});
  await prisma.studentStrengthWeakness.deleteMany({});
  await prisma.studentGoal.deleteMany({});
  await prisma.contentAssignment.deleteMany({});
  await prisma.tutorNote.deleteMany({});
  await prisma.helpRequest.deleteMany({});
  await prisma.studentSessionActivity.deleteMany({});
  await prisma.physicalWorkUpload.deleteMany({});
  await prisma.assessmentReview.deleteMany({});
  await prisma.assessmentRubric.deleteMany({});
  await prisma.homeworkAssignment.deleteMany({});
  await prisma.exerciseAttempt.deleteMany({});
  await prisma.exercise.deleteMany({});
  await prisma.academicProfileLog.deleteMany({});
  await prisma.subjectAssessment.deleteMany({});
  await prisma.contentUnit.deleteMany({});
  await prisma.gradeLevel.deleteMany({});

  console.log('✅ Phase 1 cleanup complete');

  // 1. Grade Levels (Class 1-10)
  const gradeLevels = [];
  for (let i = 1; i <= 10; i++) {
    const gradeLevel = await prisma.gradeLevel.create({
      data: {
        level: i,
        label: `Class ${i}`,
      },
    });
    gradeLevels.push(gradeLevel);
  }
  console.log(`✅ Grade levels created (10 levels: Class 1-10)`);

  // 2. Content Units (for English course at different levels)
  const englishCourse = await prisma.course.findFirst({
    where: { title: { contains: 'Programming' } },
  });

  const mathCourse = await prisma.course.findFirst({
    where: { title: { contains: 'Web Development' } },
  });

  const contentUnits = [];

  // English units for Grade 3, 4, 5
  if (englishCourse) {
    const englishUnit1 = await prisma.contentUnit.create({
      data: {
        courseId: englishCourse.id,
        gradeLevelId: gradeLevels[2].id, // Grade 3
        sequenceOrder: 1,
        title: 'Reading Comprehension Basics',
        description: 'Foundational reading skills for Grade 3',
        isActive: true,
      },
    });

    const englishUnit2 = await prisma.contentUnit.create({
      data: {
        courseId: englishCourse.id,
        gradeLevelId: gradeLevels[3].id, // Grade 4
        sequenceOrder: 1,
        title: 'Advanced Reading & Inference',
        description: 'Intermediate comprehension and inference skills',
        isActive: true,
      },
    });

    const englishUnit3 = await prisma.contentUnit.create({
      data: {
        courseId: englishCourse.id,
        gradeLevelId: gradeLevels[4].id, // Grade 5
        sequenceOrder: 1,
        title: 'Critical Analysis',
        description: 'Advanced analytical reading skills',
        isActive: true,
      },
    });

    contentUnits.push(englishUnit1, englishUnit2, englishUnit3);
  }

  // Math units for Grade 3, 4, 5
  if (mathCourse) {
    const mathUnit1 = await prisma.contentUnit.create({
      data: {
        courseId: mathCourse.id,
        gradeLevelId: gradeLevels[2].id, // Grade 3
        sequenceOrder: 1,
        title: 'Basic Fractions',
        description: 'Introduction to fractions and parts of a whole',
        isActive: true,
      },
    });

    const mathUnit2 = await prisma.contentUnit.create({
      data: {
        courseId: mathCourse.id,
        gradeLevelId: gradeLevels[3].id, // Grade 4
        sequenceOrder: 1,
        title: 'Operations with Fractions',
        description: 'Adding, subtracting fractions',
        isActive: true,
      },
    });

    const mathUnit3 = await prisma.contentUnit.create({
      data: {
        courseId: mathCourse.id,
        gradeLevelId: gradeLevels[4].id, // Grade 5
        sequenceOrder: 1,
        title: 'Decimals and Percentages',
        description: 'Working with decimals and converting to percentages',
        isActive: true,
      },
    });

    contentUnits.push(mathUnit1, mathUnit2, mathUnit3);
  }

  console.log(`✅ Content units created (${contentUnits.length} units across grade levels)`);

  // 3. Exercises (various types)
  const lessons = await prisma.lesson.findMany({ take: 6 });
  const exercises = [];

  if (lessons.length > 0) {
    // Multiple Choice Exercise
    const exercise1 = await prisma.exercise.create({
      data: {
        lessonId: lessons[0].id,
        unitId: contentUnits[0]?.id,
        sequenceOrder: 1,
        exerciseType: 'MULTIPLE_CHOICE',
        title: 'Reading Comprehension Quiz',
        instructions: 'Read the passage and answer the questions',
        questions: [
          {
            question: 'What is the main idea of the passage?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: 1,
          },
          {
            question: 'Who is the main character?',
            options: ['Alice', 'Bob', 'Charlie', 'Diana'],
            correctIndex: 0,
          },
        ],
        expectedAnswers: [
          { questionIndex: 0, answer: 1 },
          { questionIndex: 1, answer: 0 },
        ],
        maxScore: 20,
        timeLimit: 15,
        isAutoGradable: true,
        difficulty: 'MEDIUM',
      },
    });
    exercises.push(exercise1);

    // Fill in Blank Exercise
    const exercise2 = await prisma.exercise.create({
      data: {
        lessonId: lessons[1].id,
        unitId: contentUnits[1]?.id,
        sequenceOrder: 1,
        exerciseType: 'FILL_IN_BLANK',
        title: 'Vocabulary Practice',
        instructions: 'Fill in the blanks with the correct words',
        questions: [
          { question: 'The cat ___ on the mat.', blank: 0 },
          { question: 'She ___ to school every day.', blank: 0 },
        ],
        expectedAnswers: [
          { questionIndex: 0, answer: 'sat', acceptableVariants: ['sits', 'was sitting'] },
          { questionIndex: 1, answer: 'walks', acceptableVariants: ['goes', 'travels'] },
        ],
        maxScore: 10,
        timeLimit: 10,
        isAutoGradable: true,
        difficulty: 'EASY',
      },
    });
    exercises.push(exercise2);

    // Short Answer Exercise
    const exercise3 = await prisma.exercise.create({
      data: {
        lessonId: lessons[2].id,
        unitId: contentUnits[2]?.id,
        sequenceOrder: 1,
        exerciseType: 'SHORT_ANSWER',
        title: 'Comprehension Questions',
        instructions: 'Answer the following questions in complete sentences',
        questions: [
          { question: 'Why did the author use the word "transform"?' },
          { question: 'What do you think will happen next?' },
        ],
        expectedAnswers: null, // Manual grading required
        maxScore: 16,
        timeLimit: 20,
        isAutoGradable: false,
        difficulty: 'HARD',
      },
    });
    exercises.push(exercise3);

    // Numerical Exercise (Math)
    const exercise4 = await prisma.exercise.create({
      data: {
        lessonId: lessons[3].id,
        unitId: contentUnits[3]?.id,
        sequenceOrder: 1,
        exerciseType: 'NUMERICAL',
        title: 'Fraction Addition',
        instructions: 'Solve the following fraction problems',
        questions: [
          { question: '1/2 + 1/4 = ?', type: 'fraction' },
          { question: '3/5 - 1/5 = ?', type: 'fraction' },
        ],
        expectedAnswers: [
          { questionIndex: 0, answer: '3/4' },
          { questionIndex: 1, answer: '2/5' },
        ],
        maxScore: 10,
        timeLimit: 15,
        isAutoGradable: true,
        difficulty: 'MEDIUM',
      },
    });
    exercises.push(exercise4);

    // Worksheet (Physical)
    const exercise5 = await prisma.exercise.create({
      data: {
        lessonId: lessons[4].id,
        unitId: contentUnits[4]?.id,
        sequenceOrder: 1,
        exerciseType: 'WORKSHEET',
        title: 'Handwriting Practice',
        instructions: 'Complete the worksheet on paper and submit for review',
        questions: [
          { question: 'Practice writing the alphabet in cursive', type: 'handwriting' },
        ],
        expectedAnswers: null,
        maxScore: 20,
        timeLimit: null,
        isAutoGradable: false,
        difficulty: 'EASY',
      },
    });
    exercises.push(exercise5);
  }

  console.log(`✅ Exercises created (${exercises.length} exercises of various types)`);

  // 4. Subject Assessments (showing students at different levels)
  // Note: student1-4 and teacher1-2 variables already exist from earlier in seed file

  const subjectAssessments = [];

  if (student1 && englishCourse && teacher1) {
    // Student 1: Grade 7 student working at Grade 5 English (high performer)
    const assessment1 = await prisma.subjectAssessment.create({
      data: {
        studentId: student1.id,
        courseId: englishCourse.id,
        assessedGradeLevel: 5,
        readingAge: 11.5,
        comprehensionLevel: 82.0,
        writingLevel: 78.0,
        assessedById: teacher1.id,
        notes: 'Strong reader, excellent comprehension, needs work on creative writing',
      },
    });
    subjectAssessments.push(assessment1);
  }

  if (student1 && mathCourse && teacher1) {
    // Student 1: Math at Grade 6 (slightly above)
    const assessment2 = await prisma.subjectAssessment.create({
      data: {
        studentId: student1.id,
        courseId: mathCourse.id,
        assessedGradeLevel: 6,
        numeracyAge: 12.0,
        assessedById: teacher1.id,
        notes: 'Strong mathematical reasoning, good problem-solving skills',
      },
    });
    subjectAssessments.push(assessment2);
  }

  if (student2 && englishCourse && teacher1) {
    // Student 2: Grade 7 student working at Grade 4 English (below grade level)
    const assessment3 = await prisma.subjectAssessment.create({
      data: {
        studentId: student2.id,
        courseId: englishCourse.id,
        assessedGradeLevel: 4,
        readingAge: 9.2,
        comprehensionLevel: 65.0,
        writingLevel: 60.0,
        assessedById: teacher1.id,
        notes: 'Struggles with inference and complex texts. Benefits from additional support.',
      },
    });
    subjectAssessments.push(assessment3);
  }

  if (student3 && englishCourse && teacher1) {
    // Student 3: Grade 6 working at Grade 3 English (significantly behind)
    const assessment4 = await prisma.subjectAssessment.create({
      data: {
        studentId: student3.id,
        courseId: englishCourse.id,
        assessedGradeLevel: 3,
        readingAge: 7.8,
        comprehensionLevel: 52.0,
        writingLevel: 48.0,
        assessedById: teacher1.id,
        notes: 'Requires intensive intervention. Recommend additional 1-on-1 support.',
      },
    });
    subjectAssessments.push(assessment4);
  }

  console.log(`✅ Subject assessments created (${subjectAssessments.length} assessments showing multi-level learning)`);

  // 5. Academic Profile Logs (showing progression)
  if (subjectAssessments.length > 0 && teacher1) {
    await prisma.academicProfileLog.createMany({
      data: [
        {
          studentId: student1!.id,
          courseId: englishCourse!.id,
          subjectAssessmentId: subjectAssessments[0].id,
          previousLevel: 4,
          newLevel: 5,
          updateType: 'ASSESSMENT_RESULT',
          reason: 'Demonstrated consistent 85%+ scores on Grade 5 material',
          updatedById: teacher1.id,
          createdAt: new Date(Date.now() - THIRTY_DAYS_MS),
        },
        {
          studentId: student2!.id,
          courseId: englishCourse!.id,
          subjectAssessmentId: subjectAssessments[2].id,
          previousLevel: 3,
          newLevel: 4,
          updateType: 'DIAGNOSTIC_TEST',
          reason: 'Initial diagnostic assessment placed at Grade 4',
          updatedById: teacher1.id,
          createdAt: new Date(Date.now() - SIXTY_DAYS_MS),
        },
      ],
    });
    console.log('✅ Academic profile logs created (2 historical level changes)');
  }

  // 6. Exercise Attempts
  if (exercises.length > 0 && student1) {
    await prisma.exerciseAttempt.createMany({
      data: [
        {
          studentId: student1.id,
          exerciseId: exercises[0].id,
          answers: [{ questionIndex: 0, answer: 1, isCorrect: true }, { questionIndex: 1, answer: 0, isCorrect: true }],
          score: 20,
          maxScore: 20,
          status: 'GRADED',
          submittedAt: new Date(Date.now() - TWO_DAYS_MS),
          autoGraded: true,
          timeSpent: 720, // 12 minutes
        },
        {
          studentId: student2!.id,
          exerciseId: exercises[1].id,
          answers: [{ questionIndex: 0, answer: 'sat' }, { questionIndex: 1, answer: 'walks' }],
          score: 10,
          maxScore: 10,
          status: 'AUTO_GRADED',
          submittedAt: new Date(Date.now() - ONE_DAY_MS),
          autoGraded: true,
          timeSpent: 480, // 8 minutes
        },
        {
          studentId: student3!.id,
          exerciseId: exercises[2].id,
          answers: [
            { questionIndex: 0, answer: 'He used it to show change' },
            { questionIndex: 1, answer: 'The character will find the treasure' }
          ],
          score: null,
          maxScore: 16,
          status: 'UNDER_REVIEW',
          submittedAt: new Date(Date.now() - FIVE_DAYS_MS),
          autoGraded: false,
          timeSpent: 1200, // 20 minutes
        },
      ],
    });
    console.log('✅ Exercise attempts created (3 attempts with various statuses)');
  }

  // 7. Homework Assignments
  if (exercises.length > 1 && student1 && teacher1 && englishCourse) {
    await prisma.homeworkAssignment.createMany({
      data: [
        {
          centreId: center1.id,
          studentId: student1.id,
          courseId: englishCourse.id,
          exerciseId: exercises[0].id,
          assignedById: teacher1.id,
          dueDate: new Date(Date.now() + TWO_DAYS_MS),
          status: 'NOT_STARTED',
          notes: 'Complete before Friday session',
        },
        {
          centreId: center1.id,
          studentId: student2!.id,
          courseId: englishCourse.id,
          exerciseId: exercises[1].id,
          assignedById: teacher1.id,
          dueDate: new Date(Date.now() - ONE_DAY_MS),
          status: 'SUBMITTED',
          submittedAt: new Date(Date.now() - ONE_DAY_MS),
          notes: 'Review vocabulary words',
        },
      ],
    });
    console.log('✅ Homework assignments created (2 assignments: 1 pending, 1 submitted)');
  }

  // 8. Assessment Rubrics
  if (englishCourse && gradeLevels.length > 0) {
    await prisma.assessmentRubric.createMany({
      data: [
        {
          courseId: englishCourse.id,
          gradeLevelId: gradeLevels[3].id, // Grade 4
          exerciseType: 'SHORT_ANSWER',
          name: 'Reading Comprehension Rubric',
          description: 'Rubric for grading short answer reading comprehension questions',
          criteria: [
            {
              name: 'Content Understanding',
              description: 'Demonstrates understanding of the text',
              maxPoints: 5,
              levels: [
                { score: 5, description: 'Excellent understanding' },
                { score: 3, description: 'Good understanding' },
                { score: 1, description: 'Limited understanding' },
              ],
            },
            {
              name: 'Use of Evidence',
              description: 'Supports answer with evidence from text',
              maxPoints: 5,
              levels: [
                { score: 5, description: 'Strong evidence' },
                { score: 3, description: 'Some evidence' },
                { score: 1, description: 'Little evidence' },
              ],
            },
          ],
          maxScore: 10,
        },
      ],
    });
    console.log('✅ Assessment rubrics created (1 comprehensive rubric)');
  }

  // 9. Physical Work Uploads (with QR codes)
  if (exercises.length > 4 && student1 && teacher1) {
    await prisma.physicalWorkUpload.create({
      data: {
        studentId: student1.id,
        exerciseId: exercises[4].id,
        imageUrls: [
          'https://storage.example.com/uploads/student1_handwriting_page1.jpg',
          'https://storage.example.com/uploads/student1_handwriting_page2.jpg',
        ],
        qrCodeIdentifier: `AE-${student1.id.substring(0, 8)}-${exercises[4].id.substring(0, 8)}-${Date.now()}`,
        annotations: {
          objects: [
            { type: 'circle', left: 100, top: 150, radius: 20, stroke: 'red', fill: 'transparent' },
            { type: 'text', left: 130, top: 145, text: 'Good!', fill: 'green', fontSize: 16 },
          ],
        },
        uploadedById: teacher1.id,
        notes: 'Excellent progress on cursive writing',
      },
    });
    console.log('✅ Physical work upload created (1 scanned worksheet with annotations)');
  }

  // 10. Student Session Activities (real-time tracking)
  const sessionEnrollments = await prisma.studentSessionEnrollment.findMany({ take: 3 });
  if (sessionEnrollments.length > 0 && exercises.length > 0) {
    await prisma.studentSessionActivity.createMany({
      data: [
        {
          enrollmentId: sessionEnrollments[0].id,
          exerciseId: exercises[0].id,
          status: 'COMPLETED',
          startedAt: new Date(Date.now() - 3600000),
          completedAt: new Date(Date.now() - 1800000),
          progressPct: 100,
        },
        {
          enrollmentId: sessionEnrollments[1]?.id || sessionEnrollments[0].id,
          exerciseId: exercises[1].id,
          status: 'WORKING',
          startedAt: new Date(Date.now() - 1200000),
          progressPct: 65,
        },
      ],
    });
    console.log('✅ Student session activities created (2 real-time activity trackers)');
  }

  // 11. Help Requests
  const sessions = await prisma.session.findMany({ where: { status: 'LIVE' }, take: 1 });
  if (sessions.length > 0 && student2) {
    await prisma.helpRequest.createMany({
      data: [
        {
          studentId: student2.id,
          sessionId: sessions[0].id,
          enrollmentId: sessionEnrollments[1]?.id,
          message: 'I don\'t understand question 3',
          status: 'PENDING',
        },
      ],
    });
    console.log('✅ Help requests created (1 pending help request)');
  }

  // 12. Tutor Notes
  if (sessionEnrollments.length > 0 && student1 && englishCourse && teacher1) {
    await prisma.tutorNote.createMany({
      data: [
        {
          enrollmentId: sessionEnrollments[0].id,
          studentId: student1.id,
          courseId: englishCourse.id,
          tutorId: teacher1.id,
          content: 'Jane struggled with inference questions today. Plan more practice on this skill.',
          visibility: 'INTERNAL',
        },
        {
          studentId: student1.id,
          courseId: englishCourse.id,
          tutorId: teacher1.id,
          content: 'Jane showed excellent progress this week! Keep up the great work.',
          visibility: 'EXTERNAL', // Parents can see this
        },
      ],
    });
    console.log('✅ Tutor notes created (2 notes: 1 internal, 1 external)');
  }

  // 13. Content Assignments (tutor overrides)
  if (student2 && englishCourse && exercises.length > 0 && teacher1) {
    await prisma.contentAssignment.create({
      data: {
        tutorId: teacher1.id,
        studentId: student2.id,
        courseId: englishCourse.id,
        exerciseId: exercises[0].id,
        overridesAutoSequence: true,
        reason: 'Student needs extra practice on this concept before moving forward',
        isActive: true,
      },
    });
    console.log('✅ Content assignment created (1 tutor override)');
  }

  // 14. Student Goals
  if (student1) {
    await prisma.studentGoal.createMany({
      data: [
        {
          studentId: student1.id,
          goalText: 'Read 10 books this term',
          category: 'ACADEMIC',
          targetDate: new Date(Date.now() + NINETY_DAYS_MS),
          isAchieved: false,
        },
        {
          studentId: student1.id,
          goalText: 'Improve reading age by 1 year',
          category: 'SKILL',
          targetDate: new Date(Date.now() + NINETY_DAYS_MS),
          isAchieved: false,
        },
      ],
    });
    console.log('✅ Student goals created (2 goals)');
  }

  // 15. Student Strengths & Weaknesses
  if (student1 && student2 && englishCourse && teacher1) {
    await prisma.studentStrengthWeakness.createMany({
      data: [
        {
          studentId: student1.id,
          courseId: englishCourse.id,
          type: 'STRENGTH',
          description: 'Excellent vocabulary and word recognition',
          identifiedBy: teacher1.id,
        },
        {
          studentId: student1.id,
          courseId: englishCourse.id,
          type: 'WEAKNESS',
          description: 'Needs improvement in creative writing organization',
          identifiedBy: teacher1.id,
        },
        {
          studentId: student2.id,
          courseId: englishCourse.id,
          type: 'WEAKNESS',
          description: 'Struggles with reading comprehension inference questions',
          identifiedBy: teacher1.id,
        },
      ],
    });
    console.log('✅ Student strengths/weaknesses created (3 traits identified)');
  }

  // 16. Chat Messages
  if (sessions.length > 0 && student1 && teacher1) {
    await prisma.chatMessage.createMany({
      data: [
        {
          sessionId: sessions[0].id,
          senderId: student1.id,
          recipientId: teacher1.id,
          messageType: 'STUDENT_TO_TUTOR',
          content: 'Can you help me with question 5?',
          isRead: true,
        },
        {
          sessionId: sessions[0].id,
          senderId: teacher1.id,
          recipientId: student1.id,
          messageType: 'TUTOR_TO_STUDENT',
          content: 'Sure! Let me share a hint: think about what happened in the previous paragraph.',
          isRead: false,
        },
      ],
    });
    console.log('✅ Chat messages created (2 messages: student-tutor conversation)');
  }

  // 17. Awards
  await prisma.award.createMany({
    data: [
      {
        centreId: center1.id,
        name: 'Gold Star Sticker',
        description: 'Shiny gold star sticker for achievement',
        awardType: 'STICKER',
        xpCost: 50,
        stockQuantity: 100,
        imageUrl: 'https://cdn.example.com/awards/gold-star.png',
        isActive: true,
      },
      {
        centreId: center1.id,
        name: 'Bonus Math Course',
        description: 'Unlock an advanced mathematics course',
        awardType: 'COURSE_UNLOCK',
        xpCost: 500,
        stockQuantity: null, // Unlimited
        isActive: true,
      },
      {
        centreId: center1.id,
        name: 'Book Voucher',
        description: '$10 book voucher from local bookstore',
        awardType: 'GIFT',
        xpCost: 200,
        stockQuantity: 20,
        imageUrl: 'https://cdn.example.com/awards/book-voucher.png',
        isActive: true,
      },
    ],
  });

  const awards = await prisma.award.findMany({ where: { centreId: center1.id } });
  console.log(`✅ Awards created (${awards.length} redeemable awards)`);

  // 18. Award Redemptions
  if (student1 && awards.length > 0) {
    await prisma.awardRedemption.create({
      data: {
        studentId: student1.id,
        awardId: awards[0].id,
        xpSpent: 50,
        fulfilledAt: new Date(Date.now() - FIVE_DAYS_MS),
        notes: 'Redeemed for excellent performance on reading quiz',
      },
    });
    console.log('✅ Award redemption created (1 redemption)');
  }

  // 19. Session Templates (recurring sessions)
  if (teacher1) {
    await prisma.sessionTemplate.createMany({
      data: [
        {
          tutorId: teacher1.id,
          centreId: center1.id,
          dayOfWeek: 'MONDAY',
          startTime: '16:00',
          endTime: '17:00',
          sessionMode: 'ONLINE',
          maxCapacity: 10,
          title: 'Monday Afternoon Session',
          description: 'English and Math tutoring',
          isActive: true,
        },
        {
          tutorId: teacher1.id,
          centreId: center1.id,
          dayOfWeek: 'WEDNESDAY',
          startTime: '16:00',
          endTime: '17:00',
          sessionMode: 'PHYSICAL',
          maxCapacity: 12,
          title: 'Wednesday In-Person Session',
          description: 'Mixed subjects with hands-on activities',
          isActive: true,
        },
        {
          tutorId: teacher1.id,
          centreId: center1.id,
          dayOfWeek: 'FRIDAY',
          startTime: '15:00',
          endTime: '16:30',
          sessionMode: 'HYBRID',
          maxCapacity: 15,
          title: 'Friday Hybrid Session',
          description: 'Some students online, some in-person',
          isActive: true,
        },
      ],
    });
    console.log('✅ Session templates created (3 recurring weekly sessions)');
  }

  console.log('\n✨ Phase 1 seed data complete!\n');

  console.log('\n🎉 Database seeded successfully!');
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
  console.log('\n📊 Database includes (3-month history with Phase 1):');
  console.log('\n👥 USERS & STRUCTURE:');
  console.log('  • 2 centres (Main Campus, Online Campus)');
  console.log('  • 14 users: 1 super admin, 1 centre admin, 1 supervisor, 1 finance admin, 2 teachers, 3 parents, 4 students');
  console.log('  • Parent-student relationships maintained');
  console.log('\n📚 ACADEMIC DATA:');
  console.log('  • 4 courses with modules and lessons');
  console.log('  • 3 active class cohorts (Spring 2026)');
  console.log('  • 8 class memberships across 3 classes');
  console.log('  • 9 course enrollments with progress tracking (90-day history)');
  console.log('  • 8 live/completed sessions (3 today, 2 tomorrow, 3 completed)');
  console.log('  • 8 attendance records (PRESENT, LATE, ABSENT, EXCUSED)');
  console.log('  • 2 catch-up packages (1 pending, 1 completed)');
  console.log('  • Academic profiles with reading/numeracy ages');
  console.log('  • Gamification: XP, levels, badges, achievements');
  console.log('\n🎯 PHASE 1: INDIVIDUALIZED TUTORING PLATFORM:');
  console.log('  • 10 grade levels (Class 1-10 for content hierarchy)');
  console.log('  • 6 content units across grade levels (English & Math)');
  console.log('  • 5 exercises: MULTIPLE_CHOICE, FILL_IN_BLANK, SHORT_ANSWER, NUMERICAL, WORKSHEET');
  console.log('  • 4 subject assessments (students working at different levels per subject)');
  console.log('  • 2 academic profile logs (historical level progression)');
  console.log('  • 3 exercise attempts (auto-graded and manual review)');
  console.log('  • 2 homework assignments (1 pending, 1 submitted)');
  console.log('  • 1 assessment rubric (Reading Comprehension for Grade 4)');
  console.log('  • 1 physical work upload with QR code and annotations');
  console.log('  • 2 student session activities (real-time: WORKING, COMPLETED)');
  console.log('  • 1 help request (student needing assistance)');
  console.log('  • 2 tutor notes (1 internal, 1 external/parent-visible)');
  console.log('  • 1 content assignment (tutor override)');
  console.log('  • 2 student goals (academic targets)');
  console.log('  • 3 student strengths/weaknesses identified');
  console.log('  • 2 chat messages (student-tutor conversation)');
  console.log('  • 3 redeemable awards (stickers, course unlocks, gifts)');
  console.log('  • 1 award redemption (XP spent)');
  console.log('  • 3 session templates (recurring weekly schedule)');
  console.log('\n🎫 OPERATIONS DATA:');
  console.log('  • 20 SLA configurations (all ticket type/priority combinations)');
  console.log('  • 8 tickets: 3 IT, 1 INVENTORY, 2 COMPLAINT, 1 MAINTENANCE, 1 GENERAL');
  console.log('  • Ticket statuses: OPEN, IN_PROGRESS, RESOLVED, CLOSED, ESCALATED');
  console.log('  • 4 ticket comments (internal and public)');
  console.log('\n💰 FINANCE DATA:');
  console.log('  • 4 fee plans: WEEKLY ($75), MONTHLY ($250), TERM ($850), ANNUAL ($2,550)');
  console.log('  • 4 student accounts with realistic balances');
  console.log('  • 8 invoices with line items (PAID, PARTIAL, SENT, OVERDUE)');
  console.log('  • 7 payment records (CASH, CHECK, CARD, BANK_TRANSFER)');
  console.log('  • 2 refund requests (1 approved, 1 pending)');
  console.log('  • 17 legacy financial transactions (90-day history)');
  console.log('\n🔒 GOVERNANCE DATA:');
  console.log('  • 3 approval requests: REFUND (pending), FEE_WAIVER (pending), TUTOR_OVERRIDE (approved)');
  console.log('  • 12 audit events (CREATE, UPDATE, APPROVE, ESCALATE actions)');
  console.log('\n🎯 Test Scenarios Available:');
  console.log('  ✓ Student with perfect payment history (Student 1)');
  console.log('  ✓ Student with partial payments (Student 2)');
  console.log('  ✓ Student with overdue balance (Student 3)');
  console.log('  ✓ New student just enrolled (Student 4)');
  console.log('  ✓ Tickets in all statuses including overdue escalation');
  console.log('  ✓ Catch-up packages for absent students');
  console.log('  ✓ Pending approval workflows');
  console.log('  ✓ Complete audit trail for compliance');

  // Seed badge definitions (Phase 1 - Enhanced Gamification)
  console.log('🎖️  Seeding badge definitions...');

  const BADGE_DEFINITIONS = [
    // Completion badges
    { name: 'First Steps', description: 'Complete your first lesson', category: 'COMPLETION', tier: 'BRONZE', xpValue: 10, criteria: { type: 'lesson_count', count: 1 } },
    { name: 'Course Conqueror', description: 'Complete your first course', category: 'COMPLETION', tier: 'SILVER', xpValue: 100, criteria: { type: 'course_completion', count: 1 } },
    { name: 'Learning Legend', description: 'Complete 5 courses', category: 'COMPLETION', tier: 'GOLD', xpValue: 500, criteria: { type: 'course_completion', count: 5 } },
    // Streak badges
    { name: 'Week Warrior', description: '7-day attendance streak', category: 'STREAK', tier: 'BRONZE', xpValue: 50, criteria: { type: 'attendance_streak', days: 7 } },
    { name: 'Month Master', description: '30-day attendance streak', category: 'STREAK', tier: 'SILVER', xpValue: 200, criteria: { type: 'attendance_streak', days: 30 } },
    { name: 'Dedication Champion', description: '100-day attendance streak', category: 'STREAK', tier: 'PLATINUM', xpValue: 1000, criteria: { type: 'attendance_streak', days: 100 } },
    // Mastery badges
    { name: 'Perfect Score', description: 'Get 100% on a quiz', category: 'MASTERY', tier: 'GOLD', xpValue: 50, criteria: { type: 'quiz_perfect', count: 1 } },
    { name: 'Quiz Master', description: 'Get 100% on 10 quizzes', category: 'MASTERY', tier: 'PLATINUM', xpValue: 500, criteria: { type: 'quiz_perfect', count: 10 } },
    // Social badges
    { name: 'Helpful Friend', description: 'Help 5 classmates', category: 'SOCIAL', tier: 'SILVER', xpValue: 25, criteria: { type: 'peer_help', count: 5 } },
    { name: 'Team Player', description: 'Participate in 10 group activities', category: 'SOCIAL', tier: 'GOLD', xpValue: 100, criteria: { type: 'group_activity', count: 10 } },
    // Special badges
    { name: 'Early Adopter', description: 'One of the first 100 users', category: 'SPECIAL', tier: 'PLATINUM', xpValue: 100, criteria: { type: 'user_id_range', max: 100 } },
  ];

  for (const badge of BADGE_DEFINITIONS) {
    await prisma.badgeDefinition.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge,
    });
  }

  console.log(`✅ Seeded ${BADGE_DEFINITIONS.length} badge definitions`);

  // =============================================================================
  // COMPLEX EDGE CASES (Phase 3)
  // =============================================================================
  console.log('\n🏗️  Seeding Complex Edge Cases...');

  // 1. Overlapping sessions for Tutor 1
  const overlapStartTime = new Date(today);
  overlapStartTime.setHours(11, 30, 0, 0); // Overlaps with nothing yet, let's make it overlap with todaySession1 (10-11) - wait no.
  // todaySession1: 10:00 - 11:00
  // todaySession2: 14:00 - 15:30

  await prisma.session.create({
    data: {
      title: 'OVERLAP: Programming Workshop',
      description: 'Session that overlaps with another one for testing alerts',
      provider: 'ZOOM',
      startTime: new Date(today.getTime() + (10 * 60 + 30) * 60 * 1000), // 10:30 AM
      endTime: new Date(today.getTime() + (12 * 60) * 60 * 1000),      // 12:00 PM
      status: 'SCHEDULED',
      tutorId: teacher1.id,
      centerId: center1.id,
    }
  });

  // 2. Multiple overdue catch-ups for Student 3
  if (student3 && mathCourse) {
    await prisma.catchUpPackage.createMany({
      data: [
        {
          studentId: student3.id,
          sessionId: todaySession1.id,
          attendanceId: attendance3.id, // Reusing but usually it would be new
          status: 'PENDING',
          dueDate: new Date(Date.now() - TWO_DAYS_MS),
          slaDueAt: new Date(Date.now() - FIVE_DAYS_MS),
          resources: [],
          notes: 'Math Overdue Catchup 1',
          centreId: center1.id,
        },
        {
          studentId: student3.id,
          sessionId: todaySession3.id,
          attendanceId: attendance8.id,
          status: 'PENDING',
          dueDate: new Date(Date.now() - ONE_DAY_MS),
          slaDueAt: new Date(Date.now() - THREE_DAYS_MS),
          resources: [],
          notes: 'Math Overdue Catchup 2',
          centreId: center1.id,
        }
      ]
    });
  }

  // 3. Escalated and SLA breached help requests
  if (student2 && todaySession1) {
    await prisma.helpRequest.createMany({
      data: [
        {
          studentId: student2.id,
          sessionId: todaySession1.id,
          message: 'SLA BREACHED: I have been waiting for 2 hours!',
          priority: 'URGENT',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          slaDueAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // SLA was 1 hour ago
          centerId: center1.id,
        },
        {
          studentId: student1.id,
          sessionId: todaySession1.id,
          message: 'ESCALATED: Technical issue prevents me from submitting',
          priority: 'HIGH',
          status: 'ESCALATED',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
          centerId: center1.id,
        }
      ]
    });
  }

  console.log('✅ Complex edge cases seeded');

  // 4. Irregular Presence (Network Issues)
  const sessionForPresence = await prisma.session.findFirst({
    where: { title: { contains: 'Introduction to Programming' } }
  });

  if (sessionForPresence && student1) {
    const enrollment = await prisma.studentSessionEnrollment.findUnique({
      where: { sessionId_studentId: { sessionId: sessionForPresence.id, studentId: student1.id } }
    });

    if (enrollment) {
      await prisma.sessionPresenceLog.createMany({
        data: [
          { sessionId: sessionForPresence.id, studentId: student1.id, enrollmentId: enrollment.id, event: 'JOIN', timestamp: new Date(Date.now() - 60 * 60 * 1000) },
          { sessionId: sessionForPresence.id, studentId: student1.id, enrollmentId: enrollment.id, event: 'DISCONNECT', timestamp: new Date(Date.now() - 55 * 60 * 1000) },
          { sessionId: sessionForPresence.id, studentId: student1.id, enrollmentId: enrollment.id, event: 'RECONNECT', timestamp: new Date(Date.now() - 50 * 60 * 1000) },
          { sessionId: sessionForPresence.id, studentId: student1.id, enrollmentId: enrollment.id, event: 'HEARTBEAT', timestamp: new Date(Date.now() - 40 * 60 * 1000) },
          { sessionId: sessionForPresence.id, studentId: student1.id, enrollmentId: enrollment.id, event: 'LEAVE', timestamp: new Date(Date.now() - 10 * 60 * 1000) },
        ]
      });

      await prisma.studentSessionEnrollment.update({
        where: { id: enrollment.id },
        data: { activeMs: 45 * 60 * 1000 } // 45 mins total active
      });
    }
  }

  // 5. Exercise attempts with granular timing
  if (student1 && exercises.length > 0) {
    await prisma.exerciseAttempt.create({
      data: {
        studentId: student1.id,
        exerciseId: exercises[0].id,
        answers: [],
        score: 15,
        maxScore: 20,
        status: 'GRADED',
        timeSpent: 600, // 10 mins
        questionTimes: [
          { questionIndex: 0, timeSpentSeconds: 45 },
          { questionIndex: 1, timeSpentSeconds: 150 }, // Took too long on Q2
          { questionIndex: 2, timeSpentSeconds: 30 },
          { questionIndex: 3, timeSpentSeconds: 120 },
        ],
        submittedAt: new Date(),
        sessionEnrollmentId: sessionEnrollments[0].id
      }
    });
  }

  console.log('✅ Advanced time tracking seed data complete');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
