import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { Public, Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { ContentService } from '../content/content.service';
import { PrismaService } from '../prisma/prisma.service';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { FilterCoursesDto } from './dto/filter-courses.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly prisma: PrismaService,
    private readonly contentService: ContentService,
    private readonly paginationService: PaginationService,
  ) {}

  @Post()
  @Roles(UserRole.INSTRUCTOR)
  async createCourse(@User('id') userId: string, @Body() dto: CreateCourseDto) {
    // Check if the instructor is approved
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isApproved: true },
    });

    if (!user || !user.isApproved) {
      throw new ForbiddenException(
        'Access denied: Your instructor account is not yet approved. Please wait for admin approval.',
      );
    }

    return this.coursesService.createCourse(userId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateCourse(
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Param('id') courseId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    // Check if the instructor is approved (only for instructors, not admins)
    if (role === UserRole.INSTRUCTOR) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isApproved: true },
      });

      if (!user || !user.isApproved) {
        throw new ForbiddenException(
          'Access denied: Your instructor account is not yet approved. Please wait for admin approval.',
        );
      }
    }

    return this.coursesService.updateCourse(userId, courseId, dto, role);
  }

  @Delete(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Param('id') courseId: string,
  ) {
    // Check if the instructor is approved (only for instructors, not admins)
    if (role === UserRole.INSTRUCTOR) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isApproved: true },
      });

      if (!user || !user.isApproved) {
        throw new ForbiddenException(
          'Access denied: Your instructor account is not yet approved. Please wait for admin approval.',
        );
      }
    }

    await this.coursesService.deleteCourse(userId, courseId, role);
  }

  @Public()
  @Get('public')
  async getPublicCourses(
    @Query() filters: FilterCoursesDto,
    @Query() pagination: PaginationDto,
  ) {
    const { courses, total } = await this.coursesService.getPublicCourses(
      filters,
      pagination,
    );
    return this.paginationService.paginate(courses, total, pagination);
  }

  @Public()
  @Get(':id')
  async getCourseById(@Param('id') courseId: string) {
    return this.coursesService.getCourseById(courseId);
  }

  @Get()
  async listCourses(
    @Query() filters: FilterCoursesDto,
    @Query() pagination: PaginationDto,
    @User('role') role: UserRole,
    @User('id') userId: string,
  ) {
    const { courses, total } = await this.coursesService.listCourses(
      filters,
      role,
      userId,
      pagination,
    );
    return this.paginationService.paginate(courses, total, pagination);
  }

  @Post(':courseId/modules')
  @Roles(UserRole.INSTRUCTOR)
  async createModule(
    @User('id') userId: string,
    @Param('courseId') courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    // Check if the instructor is approved
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isApproved: true },
    });

    if (!user || !user.isApproved) {
      throw new ForbiddenException(
        'Access denied: Your instructor account is not yet approved. Please wait for admin approval.',
      );
    }

    return this.coursesService.createModule(userId, courseId, dto);
  }

  @Get(':courseId/content')
  async getCourseContent(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseContent(courseId);
  }

  @Post('content')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(AnyFilesInterceptor())
  async uploadBulkCourseContent(
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.contentService.uploadBulkCourseContent(
      userId,
      role,
      body,
      files,
    );
  }
}
