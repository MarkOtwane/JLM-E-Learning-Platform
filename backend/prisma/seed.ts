/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create admin
  await prisma.user.create({
    data: {
      name: 'Mark Otwane',
      email: 'otwanemark254@gmail.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      isApproved: true,
    },
  });

  // Create instructor
  const instructor = await prisma.user.create({
    data: {
      name: 'Jane Instructor',
      email: 'instructor@elearning.com',
      password: passwordHash,
      role: UserRole.INSTRUCTOR,
      isApproved: true,
    },
  });

  // Create student
  const student = await prisma.user.create({
    data: {
      name: 'John Student',
      email: 'student@elearning.com',
      password: passwordHash,
      role: UserRole.STUDENT,
      isApproved: true,
    },
  });

  // Create a course
  const course = await prisma.course.create({
    data: {
      title: 'Introduction to JavaScript',
      description: 'Beginner-friendly JS course',
      level: 'Beginner',
      category: 'Programming',
      duration: 180,
      instructorId: instructor.id,
      isPremium: false,
    },
  });

  // Create modules & content
  const module1 = await prisma.module.create({
    data: {
      title: 'Getting Started with JS',
      order: 1,
      courseId: course.id,
      contents: {
        create: [
          {
            type: 'VIDEO',
            url: 'https://example.com/js-intro.mp4',
            title: 'Intro to JavaScript',
          },
          {
            type: 'PDF',
            url: 'https://example.com/handout.pdf',
            title: 'JS Notes',
          },
        ],
      },
    },
  });

  // Enroll student
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course.id,
    },
  });

  // Create quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: 'JS Basics Quiz',
      courseId: course.id,
      questions: {
        create: [
          {
            text: 'What is the keyword for declaring a variable?',
            type: 'MCQ',
            correct: 'let',
            options: {
              create: [{ text: 'let' }, { text: 'var' }, { text: 'const' }],
            },
          },
        ],
      },
    },
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
