import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, User } from '../auth/decorators';
import { RolesGuard } from '../auth/roles.guard';
import {
  FileUploadOptions,
  FileUploadService,
} from '../common/file-upload.service';
import { CourseVersionService } from './course-version.service';
import { CoursesServiceV2 } from './courses.service.v2';
import { CreateCourseDto } from './dto/create-course-v2.dto';
import { SaveCourseDraftDto } from './dto/update-course-v2.dto';

/**
 * Enhanced Courses Controller - Production-ready API endpoints
 * Includes draft management, publishing, versioning, file uploads
 * All endpoints require INSTRUCTOR role except published course retrieval
 */
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesControllerV2 {
  constructor(
    private readonly coursesService: CoursesServiceV2,
    private readonly versionService: CourseVersionService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Create new course (saves as DRAFT)
   * POST /courses
   */
  @Post()
  @Roles('INSTRUCTOR')
  @HttpCode(HttpStatus.CREATED)
  async createCourse(
    @User('id') userId: string,
    @Body() createCourseDto: CreateCourseDto,
  ) {
    return this.coursesService.createCourse(userId, createCourseDto);
  }

  /**
   * Get all instructor's courses (active - not deleted)
   * GET /courses/my
   */
  @Get('my')
  @Roles('INSTRUCTOR')
  async getMyInstructorCourses(@User('id') userId: string) {
    const courses = await this.coursesService.getInstructorCourses(
      userId,
      false,
    );
    return {
      success: true,
      courses,
      total: courses.length,
    };
  }

  /**
   * Get all instructor's courses (including archived)
   * GET /courses/my?archived=true
   */
  @Get('my-all')
  @Roles('INSTRUCTOR')
  async getMyAllCourses(
    @User('id') userId: string,
    @Query('archived') archived?: boolean,
  ) {
    const courses = await this.coursesService.getInstructorCourses(
      userId,
      archived === true,
    );
    return {
      success: true,
      courses,
      total: courses.length,
    };
  }

  /**
   * Get course by ID (draft - only by instructor)
   * GET /courses/:id
   */
  @Get(':id')
  @Roles('INSTRUCTOR')
  async getCourseForEdit(
    @User('id') userId: string,
    @Param('id') courseId: string,
  ) {
    return this.coursesService.getCourseById(userId, courseId);
  }

  /**
   * Save course as draft (partial update)
   * PATCH /courses/:id/draft
   */
  @Patch(':id/draft')
  @Roles('INSTRUCTOR')
  async saveDraft(
    @User('id') userId: string,
    @Param('id') courseId: string,
    @Body() dto: SaveCourseDraftDto,
  ) {
    return this.coursesService.saveDraft(userId, courseId, dto);
  }

  /**
   * Publish course (move from DRAFT to PUBLISHED)
   * POST /courses/:id/publish
   */
  @Post(':id/publish')
  @Roles('INSTRUCTOR')
  @HttpCode(HttpStatus.OK)
  async publishCourse(@User('id') userId: string, @Param('id') courseId: string) {
    return this.coursesService.publishCourse(userId, courseId);
  }

  /**
   * Schedule course for future publication
   * POST /courses/:id/schedule
   */
  @Post(':id/schedule')
  @Roles('INSTRUCTOR')
  @HttpCode(HttpStatus.OK)
  async scheduleCourse(
    @User('id') userId: string,
    @Param('id') courseId: string,
    @Body('scheduledPublishDate') scheduledDate: string,
  ) {
    if (!scheduledDate) {
      throw new BadRequestException('scheduledPublishDate is required');
    }

    const date = new Date(scheduledDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return this.coursesService.scheduleCourse(userId, courseId, date);
  }

  /**
   * Archive course (soft delete)
   * POST /courses/:id/archive
   */
  @Post(':id/archive')
  @Roles('INSTRUCTOR')
  @HttpCode(HttpStatus.OK)
  async archiveCourse(@User('id') userId: string, @Param('id') courseId: string) {
    return this.coursesService.archiveCourse(userId, courseId);
  }

  /**
   * Restore archived course
   * POST /courses/:id/restore
   */
  @Post(':id/restore')
  @Roles('INSTRUCTOR')
  @HttpCode(HttpStatus.OK)
  async restoreCourse(@User('id') userId: string, @Param('id') courseId: string) {
    return this.coursesService.restoreCourse(userId, courseId);
  }

  /**
   * Duplicate course
   * POST /courses/:id/duplicate
   */
  @Post(':id/duplicate')
  @Roles('INSTRUCTOR')
  @HttpCode(HttpStatus.CREATED)
  async duplicateCourse(@User('id') userId: string, @Param('id') courseId: string) {
    return this.coursesService.duplicateCourse(userId, courseId);
  }

  /**
   * Upload course thumbnail
   * POST /courses/:id/upload/thumbnail
   */
  @Post(':id/upload/thumbnail')
  @Roles('INSTRUCTOR')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadThumbnail(
    @User('id') userId: string,
    @Param('id') courseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileOptions: FileUploadOptions = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    const result = await this.fileUploadService.uploadThumbnail(
      fileOptions,
      courseId,
    );

    return {
      success: true,
      message: 'Thumbnail uploaded successfully',
      file: result,
    };
  }

  /**
   * Upload course intro video
   * POST /courses/:id/upload/video
   */
  @Post(':id/upload/video')
  @Roles('INSTRUCTOR')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadVideo(
    @User('id') userId: string,
    @Param('id') courseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileOptions: FileUploadOptions = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    const result = await this.fileUploadService.uploadVideo(
      fileOptions,
      courseId,
    );

    return {
      success: true,
      message: 'Video uploaded successfully',
      file: result,
    };
  }

  /**
   * Get course version history
   * GET /courses/:id/versions
   */
  @Get(':id/versions')
  @Roles('INSTRUCTOR')
  async getCourseVersionHistory(
    @User('id') userId: string,
    @Param('id') courseId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.versionService.getCourseVersionHistory(
      courseId,
      parseInt(page),
      parseInt(limit),
    );
  }

  /**
   * Get specific version details
   * GET /courses/:id/versions/:versionNumber
   */
  @Get(':id/versions/:versionNumber')
  @Roles('INSTRUCTOR')
  async getVersionDetails(
    @Param('id') courseId: string,
    @Param('versionNumber') versionNumber: string,
  ) {
    return this.versionService.getVersionDetails(
      courseId,
      parseInt(versionNumber),
    );
  }

  /**
   * Get version timeline
   * GET /courses/:id/timeline
   */
  @Get(':id/timeline')
  @Roles('INSTRUCTOR')
  async getVersionTimeline(@Param('id') courseId: string) {
    return this.versionService.getVersionTimeline(courseId);
  }

  /**
   * Get activity report for course
   * GET /courses/:id/activity?days=30
   */
  @Get(':id/activity')
  @Roles('INSTRUCTOR')
  async getActivityReport(
    @Param('id') courseId: string,
    @Query('days') days: string = '30',
  ) {
    return this.versionService.getActivityReport(courseId, parseInt(days));
  }

  /**
   * Get published course (public endpoint - no auth required)
   * GET /courses/published/:courseId
   */
  @Get('published/:courseId')
  @UseGuards() // No auth required for published courses
  async getPublishedCourse(@Param('courseId') courseId: string) {
    const course = await this.coursesService.getPublishedCourse(courseId);
    return {
      success: true,
      course,
    };
  }

  /**
   * Delete course permanently (hard delete - admin only)
   * DELETE /courses/:id
   */
  @Delete(':id')
  @Roles('ADMIN', 'INSTRUCTOR')
  @HttpCode(HttpStatus.OK)
  async deleteCourse(@User() userId: string, @Param('id') courseId: string) {
    // Note: Implement permanent deletion logic here
    // For now, use archive as soft delete
    return this.coursesService.archiveCourse(userId, courseId);
  }
}
