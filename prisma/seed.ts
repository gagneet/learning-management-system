import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
      settings: {
        timezone: 'UTC',
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
      settings: {
        timezone: 'UTC',
        language: 'en',
      },
    },
  });

  console.log('✅ Centers created');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

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

  const centerAdmin = await prisma.user.upsert({
    where: { email: 'centeradmin@lms.com' },
    update: {},
    create: {
      email: 'centeradmin@lms.com',
      name: 'Center Administrator',
      password: adminPassword,
      role: 'CENTER_ADMIN',
      centerId: center1.id,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@lms.com' },
    update: {},
    create: {
      email: 'teacher@lms.com',
      name: 'John Teacher',
      password: teacherPassword,
      role: 'TEACHER',
      centerId: center1.id,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@lms.com' },
    update: {},
    create: {
      email: 'student@lms.com',
      name: 'Jane Student',
      password: studentPassword,
      role: 'STUDENT',
      centerId: center1.id,
    },
  });

  console.log('✅ Users created');

  // Create sample courses
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
      teacherId: teacher.id,
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
      teacherId: teacher.id,
    },
  });

  console.log('✅ Courses created');

  // Create modules for course 1
  const module1 = await prisma.module.create({
    data: {
      title: 'Getting Started',
      description: 'Introduction to programming concepts',
      order: 1,
      courseId: course1.id,
    },
  });

  const module2 = await prisma.module.create({
    data: {
      title: 'Variables and Data Types',
      description: 'Understanding variables and basic data types',
      order: 2,
      courseId: course1.id,
    },
  });

  console.log('✅ Modules created');

  // Create lessons
  const lesson1 = await prisma.lesson.create({
    data: {
      title: 'What is Programming?',
      description: 'Overview of programming and its applications',
      order: 1,
      moduleId: module1.id,
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      title: 'Setting Up Your Environment',
      description: 'Installing and configuring development tools',
      order: 2,
      moduleId: module1.id,
    },
  });

  console.log('✅ Lessons created');

  // Create content
  await prisma.content.create({
    data: {
      title: 'Introduction Video',
      type: 'VIDEO',
      url: 'https://example.com/videos/intro.mp4',
      duration: 15,
      lessonId: lesson1.id,
    },
  });

  await prisma.content.create({
    data: {
      title: 'Course Materials PDF',
      type: 'DOCUMENT',
      url: 'https://example.com/docs/materials.pdf',
      lessonId: lesson1.id,
    },
  });

  console.log('✅ Content created');

  // Enroll student in course
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course1.id,
      progress: 0,
    },
  });

  console.log('✅ Enrollment created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📝 Login credentials:');
  console.log('Super Admin: admin@lms.com / admin123');
  console.log('Center Admin: centeradmin@lms.com / admin123');
  console.log('Teacher: teacher@lms.com / teacher123');
  console.log('Student: student@lms.com / student123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
