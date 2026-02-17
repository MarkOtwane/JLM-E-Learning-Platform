/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CacheService } from '../common/services/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { FilterCoursesDto } from './dto/filter-courses.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

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
    const cacheKey = `course:byId:${courseId}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    await this.cacheService.set(cacheKey, course, 300);
    return course;
  }

  async getPublicCourses(filter: FilterCoursesDto, pagination: PaginationDto) {
    const cacheKey = `courses:public:${JSON.stringify({ filter, pagination })}`;
    const cached = await this.cacheService.get<{ courses: any[]; total: number }>(
      cacheKey,
    );
    if (cached) return cached;

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

    const total = await this.prisma.course.count({ where });

    const courses = await this.prisma.course.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
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
        instructor: {
          select: { id: true, name: true, profilePicture: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    const result = { courses, total };
    await this.cacheService.set(cacheKey, result, 300);
    return result;
  }

  async listCourses(
    filter: FilterCoursesDto,
    role: UserRole,
    userId: string,
    pagination: PaginationDto,
  ) {
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

    const total = await this.prisma.course.count({ where });

    const courses = await this.prisma.course.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
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
        instructor: {
          select: { id: true, name: true, profilePicture: true },
        },
        _count: {
          select: { enrollments: true, modules: true },
        },
      },
    });

    return { courses, total };
  }

  async createModule(userId: string, courseId: string, dto: CreateModuleDto) {
    // Check if course exists and user is the instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'Access denied: You can only add modules to your own courses',
      );
    }

    // Get the next order number for this course
    const lastModule = await this.prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = lastModule ? lastModule.order + 1 : 1;

    return this.prisma.module.create({
      data: {
        ...dto,
        courseId,
        order: nextOrder,
      },
    });
  }

  async getCourseContent(courseId: string) {
    // Get all modules for the course, including their content
    const modules = await this.prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        contents: {
          orderBy: { id: 'asc' },
        },
      },
    });
    return modules;
  }
}
