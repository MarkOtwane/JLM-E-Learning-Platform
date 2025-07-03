/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/entities/user.entity';
import {
  BulkEnrollDto,
  EnrollDto,
  EnrollmentQueryDto,
  UpdateEnrollmentDto,
  UpdateProgressDto,
} from '../dto/enrollment.dto';
import { EnrollmentService } from './enrollment.service';

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiResponse({ status: 201, description: 'Successfully enrolled in course' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'Already enrolled' })
  async enroll(@Body() enrollDto: EnrollDto, @Req() req) {
    return this.enrollmentService.enrollStudent(enrollDto, req.user.id);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk enroll students in a course (Admin only)' })
  @ApiResponse({ status: 201, description: 'Bulk enrollment completed' })
  async bulkEnroll(@Body() bulkEnrollDto: BulkEnrollDto) {
    return this.enrollmentService.bulkEnroll(bulkEnrollDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all enrollments (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of enrollments' })
  async findAll(@Query() query: EnrollmentQueryDto) {
    return this.enrollmentService.getCourseEnrollments(query.courseId, query);
  }

  @Get('my-enrollments')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my enrollments' })
  @ApiResponse({ status: 200, description: 'List of my enrollments' })
  async findMyEnrollments(@Query() query: EnrollmentQueryDto, @Req() req) {
    return this.enrollmentService.getStudentEnrollments(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment details' })
  @ApiResponse({ status: 200, description: 'Enrollment details' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    return this.enrollmentService.getEnrollmentById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update enrollment' })
  @ApiResponse({ status: 200, description: 'Enrollment updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
    @Req() req,
  ) {
    return this.enrollmentService.updateEnrollment(
      id,
      updateEnrollmentDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Unenroll from course' })
  @ApiResponse({ status: 200, description: 'Successfully unenrolled' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async remove(@Param('id') id: string, @Req() req) {
    return this.enrollmentService.unenrollStudent(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get enrollment progress' })
  @ApiResponse({ status: 200, description: 'Progress records' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async getProgress(@Param('id') id: string, @Req() req) {
    return this.enrollmentService.getEnrollmentProgress(id, req.user.id);
  }

  @Put(':id/progress')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Update progress for content' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Enrollment or content not found' })
  async updateProgress(
    @Param('id') enrollmentId: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @Req() req,
  ) {
    return this.enrollmentService.updateProgress(
      enrollmentId,
      updateProgressDto,
      req.user.id,
    );
  }

  @Get(':enrollmentId/progress/:contentId')
  @ApiOperation({ summary: 'Get specific content progress' })
  @ApiResponse({ status: 200, description: 'Content progress' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Progress record not found' })
  async getContentProgress(
    @Param('enrollmentId') enrollmentId: string,
    @Param('contentId') contentId: string,
    @Req() req,
  ) {
    return this.enrollmentService.getEnrollmentWithContentProgress(
      enrollmentId,
      contentId,
      req.user.id,
    );
  }
}
