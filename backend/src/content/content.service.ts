import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { cloudinary } from './cloudinary.provider';
import { UpdateContentDto } from './dto/update-content.dto';
import { UploadContentDto } from './dto/upload-content.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadContent(
    userId: string,
    role: UserRole,
    dto: UploadContentDto,
    file?: Express.Multer.File,
  ) {
    if (!dto.moduleId) throw new NotFoundException('Module ID is required');

    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
      include: { course: true },
    });

    if (!module) throw new NotFoundException('Module not found');
    if (role !== 'ADMIN' && module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Unauthorized to add content to this module',
      );
    }

    let url = dto.url;

    if (file) {
      const upload = await cloudinary.uploader.upload(file.path, {
        resource_type: 'auto',
        folder: 'eLearning/Content',
        public_id: `${Date.now()}-${file.originalname}`,
      });
      url = upload.secure_url;
    }

    if (!url) {
      throw new NotFoundException('Content URL is required');
    }

    return this.prisma.content.create({
      data: {
        title: dto.title,
        type: dto.type,
        url,
        moduleId: dto.moduleId,
      },
    });
  }

  async getContentByModule(moduleId: string) {
    return this.prisma.content.findMany({
      where: { moduleId },
      orderBy: { id: 'asc' },
    });
  }

  async updateContent(
    userId: string,
    role: UserRole,
    contentId: string,
    dto: UpdateContentDto,
  ) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: { module: { include: { course: true } } },
    });

    if (!content) throw new NotFoundException('Content not found');
    if (role !== 'ADMIN' && content.module.course.instructorId !== userId) {
      throw new ForbiddenException('You do not own this content');
    }

    return this.prisma.content.update({
      where: { id: contentId },
      data: dto,
    });
  }

  async deleteContent(userId: string, role: UserRole, contentId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: { module: { include: { course: true } } },
    });

    if (!content) throw new NotFoundException('Content not found');
    if (role !== 'ADMIN' && content.module.course.instructorId !== userId) {
      throw new ForbiddenException('You do not own this content');
    }

    await this.prisma.content.delete({ where: { id: contentId } });
    return { message: 'Content deleted successfully' };
  }
}
