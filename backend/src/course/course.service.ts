/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateContentDto } from './dto/create.content.dto';
import { CreateModuleDto } from './dto/create.module.dto';
import { CourseQueryDto } from './dto/create.query.dto';
import { CreateReviewDto } from './dto/create.review.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateContentDto } from './dto/update.content.dto';
import { UpdateModuleDto } from './dto/update.module.dto';
import { CourseStatus } from './entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  // Course CRUD Operations
  async createCourse(createCourseDto: CreateCourseDto, instructorId: string) {
    return await this.prisma.course.create({
      data: {
        ...createCourseDto,
        instructorId,
      },
    });
  }

  async findAllCourses(
    query: CourseQueryDto,
  ): Promise<{ courses: any[]; total: number }> {
    const where: any = {
      isActive: true,
      status: CourseStatus.PUBLISHED,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.level) {
      where.level = query.level;
    }

    if (query.minPrice !== undefined) {
      where.price = { gte: query.minPrice };
    }

    if (query.maxPrice !== undefined) {
      where.price = { ...where.price, lte: query.maxPrice };
    }

    if (query.minRating !== undefined) {
      where.rating = { gte: query.minRating };
    }

    const orderBy = this.getOrderBy(query);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          instructor: true,
          modules: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    return { courses, total };
  }

  async findCourseById(id: string, includeInactive = false) {
    const where: any = { id };
    if (!includeInactive) {
      where.isActive = true;
    }

    const course = await this.prisma.course.findUnique({
      where,
      include: {
        instructor: true,
        modules: {
          include: {
            contents: true,
          },
        },
        reviews: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async updateCourse(
    id: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
    userRole: UserRole,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    // Recalculate duration if modules are present
    let duration = course.duration;
    if (updateCourseDto.modules) {
      const modules = await this.prisma.courseModule.findMany({
        where: { courseId: id },
      });
      duration = modules.reduce((total, module) => total + module.duration, 0);
    }

    return await this.prisma.course.update({
      where: { id },
      data: {
        ...updateCourseDto,
        duration,
      },
    });
  }

  async deleteCourse(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    await this.prisma.course.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async publishCourse(id: string, userId: string, userRole: UserRole) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException('You can only publish your own courses');
    }

    // Validate course has required content
    if (!course.modules || course.modules.length === 0) {
      throw new BadRequestException(
        'Course must have at least one module to be published',
      );
    }

    return await this.prisma.course.update({
      where: { id },
      data: { status: CourseStatus.PUBLISHED },
    });
  }

  // Module CRUD Operations
  async createModule(
    courseId: string,
    createModuleDto: CreateModuleDto,
    userId: string,
    userRole: UserRole,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only add modules to your own courses',
      );
    }

    const module = await this.prisma.courseModule.create({
      data: {
        ...createModuleDto,
        courseId,
      },
    });

    // Update course duration
    await this.updateCourseDuration(courseId);

    return module;
  }

  async updateModule(
    moduleId: string,
    updateModuleDto: UpdateModuleDto,
    userId: string,
    userRole: UserRole,
  ) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only update modules in your own courses',
      );
    }

    const updatedModule = await this.prisma.courseModule.update({
      where: { id: moduleId },
      data: updateModuleDto,
    });

    // Update course duration
    await this.updateCourseDuration(module.courseId);

    return updatedModule;
  }

  async deleteModule(
    moduleId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only delete modules from your own courses',
      );
    }

    await this.prisma.courseModule.delete({
      where: { id: moduleId },
    });

    // Update course duration
    await this.updateCourseDuration(module.courseId);
  }

  // Content CRUD Operations
  async createContent(
    moduleId: string,
    createContentDto: CreateContentDto,
    userId: string,
    userRole: UserRole,
  ) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only add content to your own courses',
      );
    }

    const content = await this.prisma.courseContent.create({
      data: {
        ...createContentDto,
        moduleId,
      },
    });

    // Update module and course duration
    await this.updateModuleDuration(moduleId);
    await this.updateCourseDuration(module.courseId);

    return content;
  }

  async updateContent(
    contentId: string,
    updateContentDto: UpdateContentDto,
    userId: string,
    userRole: UserRole,
  ) {
    const content = await this.prisma.courseContent.findUnique({
      where: { id: contentId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check permissions
    if (
      userRole !== UserRole.ADMIN &&
      content.module.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only update content in your own courses',
      );
    }

    const updatedContent = await this.prisma.courseContent.update({
      where: { id: contentId },
      data: updateContentDto,
    });

    // Update module and course duration
    await this.updateModuleDuration(content.moduleId);
    await this.updateCourseDuration(content.module.courseId);

    return updatedContent;
  }

  async deleteContent(
    contentId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const content = await this.prisma.courseContent.findUnique({
      where: { id: contentId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Check permissions
    if (
      userRole !== UserRole.ADMIN &&
      content.module.course.instructorId !== userId
    ) {
      throw new ForbiddenException(
        'You can only delete content from your own courses',
      );
    }

    await this.prisma.courseContent.delete({
      where: { id: contentId },
    });

    // Update module and course duration
    await this.updateModuleDuration(content.moduleId);
    await this.updateCourseDuration(content.module.courseId);
  }

  // Review Operations
  async createReview(createReviewDto: CreateReviewDto, studentId: string) {
    const { courseId, rating, comment } = createReviewDto;

    // Check if student is enrolled in the course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        courseId,
        studentId,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in the course to leave a review',
      );
    }

    // Check if review already exists
    const existingReview = await this.prisma.courseReview.findFirst({
      where: { courseId, studentId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this course');
    }

    const review = await this.prisma.courseReview.create({
      data: {
        courseId,
        studentId,
        rating,
        comment,
      },
    });

    // Update course rating
    await this.updateCourseRating(courseId);

    return review;
  }

  // Helper Methods
  private getOrderBy(query: CourseQueryDto) {
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    switch (sortBy) {
      case 'title':
        return { title: sortOrder };
      case 'price':
        return { price: sortOrder };
      case 'rating':
        return { rating: sortOrder };
      case 'enrollmentCount':
        return { enrollmentCount: sortOrder };
      default:
        return { createdAt: sortOrder };
    }
  }

  private async updateCourseDuration(courseId: string): Promise<void> {
    const modules = await this.prisma.courseModule.findMany({
      where: { courseId },
      include: { contents: true },
    });

    const totalDuration = modules.reduce((courseTotal, module) => {
      const moduleDuration = module.contents.reduce(
        (moduleTotal, content) => moduleTotal + (content.duration || 0),
        0,
      );
      return courseTotal + moduleDuration;
    }, 0);

    await this.prisma.course.update({
      where: { id: courseId },
      data: { duration: totalDuration },
    });
  }

  private async updateModuleDuration(moduleId: string): Promise<void> {
    const contents = await this.prisma.courseContent.findMany({
      where: { moduleId },
    });

    const totalDuration = contents.reduce(
      (total, content) => total + (content.duration || 0),
      0,
    );

    await this.prisma.courseModule.update({
      where: { id: moduleId },
      data: { duration: totalDuration },
    });
  }

  private async updateCourseRating(courseId: string): Promise<void> {
    const reviews = await this.prisma.courseReview.findMany({
      where: { courseId, isActive: true },
    });

    if (reviews.length === 0) {
      await this.prisma.course.update({
        where: { courseId },
        data: {
          rating: 0,
          totalReviews: 0,
        },
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        totalReviews: reviews.length,
      },
    });
  }

  // Additional utility methods
  async findCoursesByInstructor(instructorId: string) {
    return await this.prisma.course.findMany({
      where: { instructorId },
      include: {
        modules: true,
        enrollments: true,
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFeaturedCourses(limit = 6) {
    return await this.prisma.course.findMany({
      where: {
        isFeatured: true,
        isActive: true,
        status: CourseStatus.PUBLISHED,
      },
      include: {
        instructor: true,
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });
  }

  async getPopularCourses(limit = 6) {
    return await this.prisma.course.findMany({
      where: {
        isActive: true,
        status: CourseStatus.PUBLISHED,
      },
      include: {
        instructor: true,
      },
      orderBy: { enrollmentCount: 'desc' },
      take: limit,
    });
  }

  async getRecentCourses(limit = 6) {
    return await this.prisma.course.findMany({
      where: {
        isActive: true,
        status: CourseStatus.PUBLISHED,
      },
      include: {
        instructor: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
