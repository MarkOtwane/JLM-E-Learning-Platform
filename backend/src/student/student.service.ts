import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId: dto.courseId,
      },
    });

    if (existingEnrollment)
      throw new BadRequestException('Already enrolled in this course');

    // if (course.isPremium) {
    //   // In production you'd check payment validation
    //   throw new ForbiddenException('Course requires payment');
    // }

    await this.prisma.enrollment.create({
      data: {
        userId: studentId,
        courseId: dto.courseId,
      },
    });

    return { message: 'Enrolled successfully' };
  }

  async getEnrolledCourses(studentId: string): Promise<StudentCourseView[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: studentId },
      select: {
        course: {
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                contents: true,
              },
            },
          },
        },
      },
    });

    return enrollments.map((e) => e.course);
  }

  async getCourseContent(
    studentId: string,
    courseId: string,
  ): Promise<StudentCourseView> {
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
    return course;
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
