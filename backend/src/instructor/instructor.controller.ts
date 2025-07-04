// src/instructors/instructors.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, User } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import { InstructorAnalyticsDto } from './dto/instructor-analytics';
import { InstructorsService } from './instructor.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instructors')
export class InstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Get('dashboard')
  @Roles(UserRole.INSTRUCTOR)
  async getInstructorMetrics(
    @User('id') userId: string,
    @Query() dto: InstructorAnalyticsDto,
  ) {
    return this.instructorsService.getMetrics(userId, dto);
  }
}
