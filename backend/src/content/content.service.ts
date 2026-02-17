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

  async uploadBulkCourseContent(
    userId: string,
    role: UserRole,
    body: Record<string, unknown>,
    files: Array<Express.Multer.File>,
  ) {
    // Parse body fields
    const courseId = body.courseId as string;
    const modulesRaw = body.modules as string | object;
    if (!courseId || !modulesRaw) {
      throw new NotFoundException('Missing courseId or modules');
    }
    // Check instructor ownership or admin
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (role !== 'ADMIN' && course.instructorId !== userId) {
      throw new ForbiddenException('You do not own this course');
    }
    let parsedModules: Array<{ title: string; topics: Array<any> }> = [];
    try {
      parsedModules =
        typeof modulesRaw === 'string'
          ? (JSON.parse(modulesRaw) as Array<{
              title: string;
              topics: Array<any>;
            }>)
          : (modulesRaw as Array<{ title: string; topics: Array<any> }>);
    } catch (err) {
      throw new NotFoundException('Invalid modules format');
    }
    // Create modules and topics
    const createdModules: Array<{
      id: string;
      title: string;
      order: number;
      courseId: string;
      createdAt: Date;
    }> = [];
    await this.prisma.$transaction(async (tx) => {
      for (let m = 0; m < parsedModules.length; m++) {
        const mod = parsedModules[m];
        // Create module
        const dbModule = await tx.module.create({
          data: {
            title: mod.title,
            courseId,
            order: m + 1,
          },
        });

        const contentData: Array<{
          title: string;
          type: string;
          url: string;
          moduleId: string;
        }> = [];

        // Prepare topics/content
        for (let t = 0; t < (mod.topics || []).length; t++) {
          const topic = mod.topics[t] as {
            title: string;
            url?: string;
            fileName?: string;
            contentType?: string;
          };
          let url = topic.url || '';
          let file: Express.Multer.File | undefined = undefined;
          // Find file for this topic if any
          if (topic.fileName) {
            file = files.find((f) => f.originalname === topic.fileName);
          }
          if (topic.fileName && !file) {
            continue; // skip this topic if file is missing
          }
          // Upload file if present
          if (file && file.path) {
            const upload = await cloudinary.uploader.upload(file.path, {
              resource_type: 'auto',
              folder: 'eLearning/Content',
              public_id: `${Date.now()}-${file.originalname}`,
            });
            url = upload.secure_url;
          } else if (file) {
            // Defensive: file object exists but path is missing
            continue; // skip this topic
          }

          contentData.push({
            title: topic.title,
            type: topic.contentType
              ? topic.contentType.toUpperCase()
              : 'TEXT',
            url,
            moduleId: dbModule.id,
          });
          // TODO: Save quiz questions if needed
        }

        if (contentData.length > 0) {
          await tx.content.createMany({ data: contentData });
        }

        createdModules.push(dbModule);
      }
    });
    // TODO: Save final exam questions if needed
    return {
      message: 'Course content created',
      modules: createdModules.length,
    };
  }
}
