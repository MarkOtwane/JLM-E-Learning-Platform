import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollDto } from './dto/enroll.dto';
import { StudentCourseView } from './types/student-course-view.type';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async enroll(
    studentId: string,
    dto: EnrollDto,
  ): Promise<{ message: string }> {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    // Use transaction for data consistency
    try {
      const enrollment = await this.prisma.$transaction(async (tx) => {
        // Check for duplicate
        const existing = await tx.enrollment.findFirst({
          where: { userId: studentId, courseId: dto.courseId },
        });

        if (existing) {
          throw new BadRequestException('Already enrolled in this course');
        }

        // For premium courses, payment should be verified before this call
        if (course.isPremium) {
          const payment = await tx.payment.findFirst({
            where: {
              userId: studentId,
              courseId: dto.courseId,
              status: 'completed',
            },
          });

          if (!payment) {
            throw new ForbiddenException('Payment required for this course');
          }
        }

        // Create enrollment
        return await tx.enrollment.create({
          data: { userId: studentId, courseId: dto.courseId },
        });
      });

      return { message: 'Enrolled successfully' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Unique constraint violation
        throw new BadRequestException('Already enrolled in this course');
      }
      throw error;
    }
  }

  async getEnrolledCourses(
    studentId: string,
    pagination: PaginationDto,
  ): Promise<{ courses: StudentCourseView[]; total: number }> {
    const total = await this.prisma.enrollment.count({
      where: { userId: studentId },
    });

    // Optimized query with select to reduce data transfer
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: studentId },
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { enrolledAt: 'desc' },
      select: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            level: true,
            category: true,
            duration: true,
            isPremium: true,
            price: true,
            currency: true,
            createdAt: true,
            updatedAt: true,
            instructorId: true,
            modules: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                createdAt: true,
                contents: {
                  select: {
                    id: true,
                    type: true,
                    url: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return { courses: enrollments.map((e) => e.course), total };
  }

  async getCourseContent(studentId: string, courseId: string): Promise<any> {
    // changed from StudentCourseView to any for custom return
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId,
      },
    });

    if (!enrollment)
      throw new ForbiddenException('You are not enrolled in this course');

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            contents: true,
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    // Add final exam/project info if present
    // Adjust these fields based on your actual schema
    return {
      ...course,
      // Removed hasFinalExam, finalExamQuestions, finalExamProject as they do not exist on the Course model
    };
  }

  async dropCourse(studentId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId: studentId, courseId },
    });
    if (!enrollment) throw new NotFoundException('Not enrolled in this course');
    await this.prisma.enrollment.delete({ where: { id: enrollment.id } });
    return { message: 'Dropped course successfully' };
  }
}
