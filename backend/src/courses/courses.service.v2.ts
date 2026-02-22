import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CourseStatus, CreateCourseDto } from './dto/create-course-v2.dto';
import { SaveCourseDraftDto } from './dto/update-course-v2.dto';

/**
 * Course Service - Production-ready implementation
 * Handles all course lifecycle operations: creation, updates, publishing, archiving
 * Includes proper validation, authorization, and versioning
 */
@Injectable()
export class CoursesServiceV2 {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new course (saves as DRAFT by default)
   */
  async createCourse(userId: string, dto: CreateCourseDto) {
    try {
      // Generate URL slug if not provided
      const urlSlug = dto.urlSlug || this.generateSlug(dto.title);

      // Check if URL slug is already taken
      const existingSlug = await this.prisma.course.findFirst({
        where: {
          urlSlug: urlSlug,
          isDeleted: false,
        },
      });

      if (existingSlug) {
        throw new ConflictException('URL slug is already in use');
      }

      // Create the course
      const course = await this.prisma.course.create({
        data: {
          ...dto,
          instructorId: userId,
          status: CourseStatus.DRAFT,
          urlSlug: urlSlug,
          seoTitle: dto.seoTitle || dto.title,
          seoDescription:
            dto.seoDescription || dto.description.substring(0, 160),
        },
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
        },
      });

      // Log version history
      await this.createCourseVersion(userId, course.id, 1, 'created', {
        action: 'Course created',
      });

      return {
        success: true,
        message: 'Course created successfully as draft',
        course,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create course', error.message);
    }
  }

  /**
   * Save course as draft (partial update)
   */
  async saveDraft(userId: string, courseId: string, dto: SaveCourseDraftDto) {
    const course = await this.validateCourseOwnership(userId, courseId);

    try {
      const updateData: any = { ...dto };

      // Only generate slug if provided and not already used
      if (dto.urlSlug && dto.urlSlug !== course.urlSlug) {
        const existing = await this.prisma.course.findFirst({
          where: {
            urlSlug: dto.urlSlug,
            isDeleted: false,
            NOT: { id: courseId },
          },
        });
        if (existing) {
          throw new ConflictException('URL slug is already in use');
        }
        updateData.urlSlug = dto.urlSlug;
      }

      const updated = await this.prisma.course.update({
        where: { id: courseId },
        data: updateData,
        include: {
          instructor: {
            select: { id: true, name: true },
          },
        },
      });

      // Log version history
      const changes = this.getChanges(course, updated);
      if (Object.keys(changes).length > 0) {
        await this.createCourseVersion(
          userId,
          courseId,
          await this.getNextVersionNumber(courseId),
          'updated',
          changes,
        );
      }

      return {
        success: true,
        message: 'Draft saved successfully',
        course: updated,
      };
    } catch (error) {
      throw new BadRequestException('Failed to save draft', error.message);
    }
  }

  /**
   * Publish course
   */
  async publishCourse(userId: string, courseId: string) {
    const course = await this.validateCourseOwnership(userId, courseId);

    // Validate course has required fields for publishing
    if (!course.title || !course.description || !course.category) {
      throw new BadRequestException(
        'Course must have title, description, and category to publish',
      );
    }

    try {
      const updated = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          status: CourseStatus.PUBLISHED,
        },
        include: {
          instructor: { select: { id: true, name: true } },
          modules: true,
        },
      });

      await this.createCourseVersion(
        userId,
        courseId,
        await this.getNextVersionNumber(courseId),
        'published',
        { action: 'Course published' },
      );

      return {
        success: true,
        message: 'Course published successfully',
        course: updated,
      };
    } catch (error) {
      throw new BadRequestException('Failed to publish course', error.message);
    }
  }

  /**
   * Schedule course for future publication
   */
  async scheduleCourse(
    userId: string,
    courseId: string,
    scheduledPublishDate: Date,
  ) {
    const course = await this.validateCourseOwnership(userId, courseId);

    if (scheduledPublishDate <= new Date()) {
      throw new BadRequestException('Scheduled date must be in the future');
    }

    try {
      const updated = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          status: CourseStatus.SCHEDULED,
          scheduledPublishDate,
        },
      });

      await this.createCourseVersion(
        userId,
        courseId,
        await this.getNextVersionNumber(courseId),
        'updated',
        { scheduledPublishDate: scheduledPublishDate.toISOString() },
      );

      return {
        success: true,
        message: 'Course scheduled for publication',
        course: updated,
      };
    } catch (error) {
      throw new BadRequestException('Failed to schedule course', error.message);
    }
  }

  /**
   * Archive (soft delete) course
   */
  async archiveCourse(userId: string, courseId: string) {
    const course = await this.validateCourseOwnership(userId, courseId);

    try {
      const updated = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      await this.createCourseVersion(
        userId,
        courseId,
        await this.getNextVersionNumber(courseId),
        'archived',
        { action: 'Course archived' },
      );

      return {
        success: true,
        message: 'Course archived successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to archive course', error.message);
    }
  }

  /**
   * Restore archived course
   */
  async restoreCourse(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException('You can only restore your own courses');
    }

    try {
      const updated = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });

      await this.createCourseVersion(
        userId,
        courseId,
        await this.getNextVersionNumber(courseId),
        'updated',
        { action: 'Course restored' },
      );

      return {
        success: true,
        message: 'Course restored successfully',
        course: updated,
      };
    } catch (error) {
      throw new BadRequestException('Failed to restore course', error.message);
    }
  }

  /**
   * Duplicate course with all its content
   */
  async duplicateCourse(userId: string, courseId: string) {
    const course = await this.validateCourseOwnership(userId, courseId);

    try {
      const newSlug = `${this.generateSlug(course.title)}-copy-${Date.now()}`;

      const duplicated = await this.prisma.course.create({
        data: {
          title: `${course.title} (Copy)`,
          subtitle: course.subtitle,
          description: course.description,
          level: course.level,
          category: course.category,
          language: course.language,
          duration: course.duration,
          thumbnailUrl: course.thumbnailUrl,
          introVideoUrl: course.introVideoUrl,
          isPremium: course.isPremium,
          price: course.price,
          currency: course.currency,
          tags: course.tags,
          instructorId: userId,
          status: CourseStatus.DRAFT,
          urlSlug: newSlug,
          seoTitle: course.seoTitle,
          seoDescription: course.seoDescription,
        },
        include: {
          instructor: { select: { id: true, name: true } },
        },
      });

      await this.createCourseVersion(userId, duplicated.id, 1, 'created', {
        action: `Duplicated from course ${courseId}`,
      });

      return {
        success: true,
        message: 'Course duplicated successfully',
        course: duplicated,
      };
    } catch (error) {
      throw new BadRequestException(
        'Failed to duplicate course',
        error.message,
      );
    }
  }

  /**
   * Get course version history
   */
  async getCourseVersionHistory(userId: string, courseId: string) {
    const course = await this.validateCourseOwnership(userId, courseId);

    const versions = await this.prisma.courseVersion.findMany({
      where: { courseId },
      include: {
        changedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      courseId,
      versions: versions.map((v) => ({
        ...v,
        changes: JSON.parse(v.changes),
      })),
    };
  }

  /**
   * Get instructor's courses (excluding deleted by default)
   */
  async getInstructorCourses(userId: string, includeDeleted = false) {
    const courses = await this.prisma.course.findMany({
      where: {
        instructorId: userId,
        ...(includeDeleted ? {} : { isDeleted: false }),
      },
      include: {
        modules: { select: { id: true } },
        enrollments: true,
        _count: {
          select: {
            modules: true,
            enrollments: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => ({
      ...course,
      totalStudents: course._count.enrollments,
      totalModules: course._count.modules,
      totalAssignments: course._count.assignments,
    }));
  }

  /**
   * Get course by ID for instructor
   */
  async getCourseById(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        instructor: {
          select: { id: true, name: true, profilePicture: true },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException('You can only view your own courses');
    }

    return {
      ...course,
      totalStudents: course._count.enrollments,
      totalModules: course._count.modules,
    };
  }

  /**
   * Get published course details (for students/public)
   */
  async getPublishedCourse(courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        status: CourseStatus.PUBLISHED,
        isDeleted: false,
      },
      include: {
        instructor: {
          select: { id: true, name: true, profilePicture: true },
        },
        modules: {
          select: { id: true, title: true, order: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found or not published');
    }

    return course;
  }

  /**
   * Helper: Validate course ownership
   */
  private async validateCourseOwnership(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException('You can only manage your own courses');
    }

    return course;
  }

  /**
   * Helper: Generate URL slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  /**
   * Helper: Get next version number
   */
  private async getNextVersionNumber(courseId: string): Promise<number> {
    const lastVersion = await this.prisma.courseVersion.findFirst({
      where: { courseId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    return (lastVersion?.versionNumber || 0) + 1;
  }

  /**
   * Helper: Create version history entry
   */
  private async createCourseVersion(
    userId: string,
    courseId: string,
    versionNumber: number,
    changeType: string,
    changes: any,
  ) {
    return this.prisma.courseVersion.create({
      data: {
        courseId,
        versionNumber,
        changeType,
        changes: JSON.stringify(changes),
        changedById: userId,
      },
    });
  }

  /**
   * Helper: Get changes between two objects
   */
  private getChanges(oldObj: any, newObj: any): Record<string, any> {
    const changes: Record<string, any> = {};

    for (const key in newObj) {
      if (oldObj[key] !== newObj[key]) {
        changes[key] = {
          old: oldObj[key],
          new: newObj[key],
        };
      }
    }

    return changes;
  }
}
