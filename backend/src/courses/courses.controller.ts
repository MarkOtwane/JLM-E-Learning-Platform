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
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
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

  @Get(':id')
  async getCourseById(@Param('id') courseId: string) {
    return this.coursesService.getCourseById(courseId);
  }

  @Get()
  async listCourses(
    @Query() filters: FilterCoursesDto,
    @User('role') role: UserRole,
    @User('id') userId: string,
  ) {
    return this.coursesService.listCourses(filters, role, userId);
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
}
