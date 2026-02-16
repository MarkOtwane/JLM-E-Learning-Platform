import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { EnrollDto } from './dto/enroll.dto';
import { StudentsService } from './student.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly paginationService: PaginationService,
  ) {}

  @Post('enroll')
  @Roles(UserRole.STUDENT)
  async enroll(@User('id') studentId: string, @Body() dto: EnrollDto) {
    return this.studentsService.enroll(studentId, dto);
  }

  @Get('courses')
  @Roles(UserRole.STUDENT)
  async getMyCourses(
    @User('id') studentId: string,
    @Query() pagination: PaginationDto,
  ) {
    const { courses, total } = await this.studentsService.getEnrolledCourses(
      studentId,
      pagination,
    );
    return this.paginationService.paginate(courses, total, pagination);
  }

  @Get('courses/:courseId')
  @Roles(UserRole.STUDENT)
  async getMyCourseContent(
    @User('id') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.studentsService.getCourseContent(studentId, courseId);
  }

  @Delete('courses/:courseId')
  @Roles(UserRole.STUDENT)
  async dropCourse(
    @User('id') studentId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.studentsService.dropCourse(studentId, courseId);
  }
}
