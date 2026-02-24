import {
  Body,
  Controller,
  Get,
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
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizzesService } from './quizzes.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createQuiz(
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizzesService.createQuiz(userId, role, dto);
  }

  @Patch(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateQuiz(@Param('id') quizId: string, @Body() dto: UpdateQuizDto) {
    return this.quizzesService.updateQuiz(quizId, dto);
  }

  @Post('submit')
  @Roles(UserRole.STUDENT)
  async submitQuiz(@User('id') userId: string, @Body() dto: SubmitQuizDto) {
    return this.quizzesService.submitQuiz(userId, dto);
  }

  @Get('submission/status')
  @Roles(UserRole.STUDENT)
  async getSubmissionStatus(
    @User('id') userId: string,
    @Query('quizId') quizId: string,
  ) {
    return this.quizzesService.getSubmissionStatus(userId, quizId);
  }

  @Get('module/:moduleId')
  async getQuiz(@Param('moduleId') moduleId: string) {
    return this.quizzesService.getQuizByModule(moduleId);
  }

  // Instructor endpoints for reviewing submissions
  @Get(':quizId/submissions')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getSubmissions(@Param('quizId') quizId: string) {
    return this.quizzesService.getSubmissionsForQuiz(quizId);
  }

  @Patch(':quizId/submissions/:submissionId/review')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async reviewSubmission(
    @Param('quizId') quizId: string,
    @Param('submissionId') submissionId: string,
    @Body('status') status: 'approved' | 'rejected',
    @Body('feedback') feedback?: string,
  ) {
    return this.quizzesService.reviewSubmission(
      quizId,
      submissionId,
      status,
      feedback,
    );
  }
}
