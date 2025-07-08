import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { ContentService } from './content.service';
import { UploadContentDto } from './dto/upload-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, User } from '../auth/decorators';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('upload')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadContent(
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Body() dto: UploadContentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.contentService.uploadContent(userId, role, dto, file);
  }

  @Get('module/:moduleId')
  async getContentByModule(@Param('moduleId') moduleId: string) {
    return this.contentService.getContentByModule(moduleId);
  }

  @Patch(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateContent(
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Param('id') contentId: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentService.updateContent(userId, role, contentId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContent(
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Param('id') contentId: string,
  ) {
    await this.contentService.deleteContent(userId, role, contentId);
  }

  @Post('/courses/content')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(AnyFilesInterceptor())
  async uploadBulkCourseContent(
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.contentService.uploadBulkCourseContent(userId, role, body, files);
  }
}
