/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { FilterCoursesDto } from './dto/filter-courses.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(userId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        ...dto,
        instructorId: userId,
      },
    });
  }

  async updateCourse(
    userId: string,
    courseId: string,
    dto: UpdateCourseDto,
    role: UserRole,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (role !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only update your own course',
      );
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: dto,
    });
  }

  async deleteCourse(userId: string, courseId: string, role: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (role !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only delete your own course',
      );
    }

    await this.prisma.course.delete({ where: { id: courseId } });
    return { message: 'Course deleted successfully' };
  }

  async getCourseById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async listCourses(filter: FilterCoursesDto, role: UserRole, userId: string) {
    const where: any = {};

    if (filter.keyword) {
      where.title = { contains: filter.keyword, mode: 'insensitive' };
    }
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.level) {
      where.level = filter.level;
    }

    if (role === 'INSTRUCTOR') {
      where.instructorId = userId;
    }

    return this.prisma.course.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        instructor: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
    });
  }
}
