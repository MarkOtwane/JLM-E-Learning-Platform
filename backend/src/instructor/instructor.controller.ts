/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { InstructorAnalyticsDto } from './dto/instructor-analytics';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';
import { InstructorsService } from './instructor.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  // ==================== DASHBOARD ====================
  @Get('dashboard')
  @Roles(UserRole.INSTRUCTOR)
  async getInstructorMetrics(
    @User('id') userId: string,
    @Query() dto: InstructorAnalyticsDto,
  ) {
    return this.instructorsService.getMetrics(userId, dto);
  }

  @Get('courses')
  @Roles(UserRole.INSTRUCTOR)
  async getInstructorCourses(@User('id') userId: string) {
    return this.instructorsService.getInstructorCourses(userId);
  }

  // ==================== LESSONS ====================
  @Post('modules/:moduleId/lessons')
  @Roles(UserRole.INSTRUCTOR)
  async createLesson(
    @User('id') userId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.instructorsService.createLesson(userId, moduleId, dto);
  }

  @Put('lessons/:lessonId')
  @Roles(UserRole.INSTRUCTOR)
  async updateLesson(
    @User('id') userId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: Partial<CreateLessonDto>,
  ) {
    return this.instructorsService.updateLesson(userId, lessonId, dto);
  }

  @Delete('lessons/:lessonId')
  @Roles(UserRole.INSTRUCTOR)
  async deleteLesson(
    @User('id') userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.instructorsService.deleteLesson(userId, lessonId);
  }

  @Post('modules/:moduleId/lessons/reorder')
  @Roles(UserRole.INSTRUCTOR)
  async reorderLessons(
    @User('id') userId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: ReorderLessonsDto,
  ) {
    return this.instructorsService.reorderLessons(userId, moduleId, dto);
  }

  @Get('modules/:moduleId/lessons')
  @Roles(UserRole.INSTRUCTOR)
  async getModuleLessons(@Param('moduleId') moduleId: string) {
    return this.instructorsService.getModuleLessons(moduleId);
  }

  // ==================== ASSIGNMENTS ====================
  @Post('assignments')
  @Roles(UserRole.INSTRUCTOR)
  async createAssignment(
    @User('id') userId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.instructorsService.createAssignment(userId, dto);
  }

  @Get('courses/:courseId/assignments')
  @Roles(UserRole.INSTRUCTOR)
  async getCourseAssignments(
    @User('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.instructorsService.getCourseAssignments(courseId, userId);
  }

  @Get('assignments/:assignmentId/submissions')
  @Roles(UserRole.INSTRUCTOR)
  async getAssignmentSubmissions(
    @User('id') userId: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.instructorsService.getAssignmentSubmissions(
      assignmentId,
      userId,
    );
  }

  @Put('submissions/:submissionId/grade')
  @Roles(UserRole.INSTRUCTOR)
  async gradeSubmission(
    @User('id') userId: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.instructorsService.gradeSubmission(submissionId, userId, dto);
  }

  // ==================== ANNOUNCEMENTS ====================
  @Post('announcements')
  @Roles(UserRole.INSTRUCTOR)
  async createAnnouncement(
    @User('id') userId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.instructorsService.createAnnouncement(userId, dto);
  }

  @Get('courses/:courseId/announcements')
  @Roles(UserRole.INSTRUCTOR)
  async getCourseAnnouncements(@Param('courseId') courseId: string) {
    return this.instructorsService.getCourseAnnouncements(courseId);
  }

  @Delete('announcements/:announcementId')
  @Roles(UserRole.INSTRUCTOR)
  async deleteAnnouncement(
    @User('id') userId: string,
    @Param('announcementId') announcementId: string,
  ) {
    return this.instructorsService.deleteAnnouncement(announcementId, userId);
  }

  // ==================== STUDENTS ====================
  @Get('courses/:courseId/students')
  @Roles(UserRole.INSTRUCTOR)
  async getCourseStudents(
    @User('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.instructorsService.getCourseStudents(courseId, userId);
  }

  // ==================== Q&A ====================
  @Get('lessons/:lessonId/questions')
  @Roles(UserRole.INSTRUCTOR)
  async getLessonQuestions(
    @User('id') userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.instructorsService.getLessonQuestions(lessonId, userId);
  }

  @Put('questions/:questionId/answer')
  @Roles(UserRole.INSTRUCTOR)
  async answerQuestion(
    @User('id') userId: string,
    @Param('questionId') questionId: string,
    @Body('answer') answer: string,
  ) {
    return this.instructorsService.answerQuestion(questionId, userId, answer);
  }

  // ==================== ANALYTICS ====================
  @Get('courses/:courseId/analytics')
  @Roles(UserRole.INSTRUCTOR)
  async getCourseAnalytics(
    @User('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.instructorsService.getCourseAnalytics(courseId, userId);
  }

  // ==================== GRADEBOOK ====================
  @Get('courses/:courseId/gradebook')
  @Roles(UserRole.INSTRUCTOR)
  async getCourseGradebook(
    @User('id') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.instructorsService.getCourseGradebook(courseId, userId);
  }
}
