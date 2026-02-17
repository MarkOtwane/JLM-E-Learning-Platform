import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import axios from 'axios';
import { Request, Response } from 'express';
import { Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ContentService } from './content.service';
import { UpdateContentDto } from './dto/update-content.dto';
import { UploadContentDto } from './dto/upload-content.dto';

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

  @Get('stream/:contentId')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  async streamContent(
    @User('id') userId: string,
    @User('role') role: UserRole,
    @Param('contentId') contentId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const content = await this.contentService.getSignedContentUrl(
      userId,
      role,
      contentId,
    );

    const range = req.headers.range;
    const headers: Record<string, string> = {};
    if (range) {
      headers.Range = range;
    }

    const upstream = await axios.get(content.url, {
      responseType: 'stream',
      headers,
    });

    if (upstream.headers['content-type']) {
      res.setHeader('Content-Type', upstream.headers['content-type']);
    }
    if (upstream.headers['content-length']) {
      res.setHeader('Content-Length', upstream.headers['content-length']);
    }
    if (upstream.headers['content-range']) {
      res.setHeader('Content-Range', upstream.headers['content-range']);
      res.setHeader('Accept-Ranges', 'bytes');
      res.status(HttpStatus.PARTIAL_CONTENT);
    } else {
      res.setHeader('Accept-Ranges', 'bytes');
      res.status(HttpStatus.OK);
    }

    upstream.data.pipe(res);
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
