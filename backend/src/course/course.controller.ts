/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CoursesService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateContentDto } from './dto/create.content.dto';
import { CreateModuleDto } from './dto/create.module.dto';
import { CourseQueryDto } from './dto/create.query.dto';
import { CreateReviewDto } from './dto/create.review.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateContentDto } from './dto/update.content.dto';
import { UpdateModuleDto } from './dto/update.module.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

 
  @Get()
  async findAllCourses(@Query() query: CourseQueryDto) {
    return await this.coursesService.findAllCourses(query);
  }

  @Get('featured')
  async getFeaturedCourses(@Query('limit') limit?: number) {
    return await this.coursesService.getFeaturedCourses(limit);
  }

  @Get('popular')
  async getPopularCourses(@Query('limit') limit?: number) {
    return await this.coursesService.getPopularCourses(limit);
  }

  @Get('recent')
  async getRecentCourses(@Query('limit') limit?: number) {
    return await this.coursesService.getRecentCourses(limit);
  }

  @Get(':id')
  async findCourseById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.coursesService.findCourseById(id);
  }

  // Protected course endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createCourse(@Body() createCourseDto: CreateCourseDto, @Request() req) {
    return await this.coursesService.createCourse(createCourseDto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req,
  ) {
    return await this.coursesService.updateCourse(
      id,
      updateCourseDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.coursesService.deleteCourse(id, req.user.id, req.user.role);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async publishCourse(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return await this.coursesService.publishCourse(
      id,
      req.user.id,
      req.user.role,
    );
  }

  // Module endpoints
  @Post(':id/modules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createModule(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() createModuleDto: CreateModuleDto,
    @Request() req,
  ) {
    return await this.coursesService.createModule(
      courseId,
      createModuleDto,
      req.user.id,
      req.user.role,
    );
  }

  @Put('modules/:moduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateModule(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() updateModuleDto: UpdateModuleDto,
    @Request() req,
  ) {
    return await this.coursesService.updateModule(
      moduleId,
      updateModuleDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('modules/:moduleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteModule(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Request() req,
  ) {
    await this.coursesService.deleteModule(
      moduleId,
      req.user.id,
      req.user.role,
    );
  }

  // Content endpoints
  @Post('modules/:moduleId/contents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createContent(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() createContentDto: CreateContentDto,
    @Request() req,
  ) {
    return await this.coursesService.createContent(
      moduleId,
      createContentDto,
      req.user.id,
      req.user.role,
    );
  }

  @Put('contents/:contentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateContent(
    @Param('contentId', ParseUUIDPipe) contentId: string,
    @Body() updateContentDto: UpdateContentDto,
    @Request() req,
  ) {
    return await this.coursesService.updateContent(
      contentId,
      updateContentDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('contents/:contentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContent(
    @Param('contentId', ParseUUIDPipe) contentId: string,
    @Request() req,
  ) {
    await this.coursesService.deleteContent(
      contentId,
      req.user.id,
      req.user.role,
    );
  }

  // Review endpoints
  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async createReview(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req,
  ) {
    createReviewDto.courseId = courseId;
    return await this.coursesService.createReview(createReviewDto, req.user.id);
  }

  // Instructor-specific endpoints
  @Get('instructor/my-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getInstructorCourses(@Request() req) {
    return await this.coursesService.findCoursesByInstructor(req.user.id);
  }
}
