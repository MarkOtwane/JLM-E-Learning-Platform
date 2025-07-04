import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { MarkProgressDto } from './dto/mark-progress.dto';
import { ProgressService } from './progress.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('mark')
  @Roles(UserRole.STUDENT)
  async markContentCompleted(
    @User('id') studentId: string,
    @Body() dto: MarkProgressDto,
  ) {
    return this.progressService.markCompleted(studentId, dto);
  }

  @Get('completed')
  @Roles(UserRole.STUDENT)
  async getCompletedContent(@User('id') studentId: string) {
    return this.progressService.getCompletedContentIds(studentId);
  }

  @Get('status/:moduleId')
  @Roles(UserRole.STUDENT)
  async getModuleProgress(
    @User('id') studentId: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.progressService.getProgressStatus(studentId, moduleId);
  }
}
