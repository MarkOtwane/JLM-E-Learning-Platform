import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkProgressDto } from './dto/mark-progress.dto';
import { ProgressStatus } from './types/progress-status.type';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async markCompleted(
    studentId: string,
    dto: MarkProgressDto,
  ): Promise<{ message: string }> {
    const content = await this.prisma.content.findUnique({
      where: { id: dto.contentId },
      include: { module: true },
    });
    if (!content) throw new NotFoundException('Content not found');

    // Check if progress already exists
    const existingProgress = await this.prisma.progress.findFirst({
      where: {
        userId: studentId,
        moduleId: content.moduleId,
      },
    });

    if (existingProgress) {
      await this.prisma.progress.update({
        where: { id: existingProgress.id },
        data: {
          completed: true,
          completedAt: new Date(),
        },
      });
    } else {
      await this.prisma.progress.create({
        data: {
          userId: studentId,
          moduleId: content.moduleId,
          completed: true,
          completedAt: new Date(),
        },
      });
    }

    return { message: 'Progress marked as completed' };
  }

  async getCompletedModuleIds(studentId: string): Promise<string[]> {
    const progress = await this.prisma.progress.findMany({
      where: { userId: studentId, completed: true },
      select: { moduleId: true },
    });
    return progress.map((p) => p.moduleId);
  }

  async getProgressStatus(
    studentId: string,
    moduleId: string,
  ): Promise<ProgressStatus[]> {
    const contents = await this.prisma.content.findMany({
      where: { moduleId },
    });
    const moduleProgress = await this.prisma.progress.findFirst({
      where: {
        userId: studentId,
        moduleId,
      },
    });

    const isModuleCompleted = moduleProgress?.completed ?? false;

    return contents.map((content) => ({
      contentId: content.id,
      completed: isModuleCompleted,
      completedAt: isModuleCompleted
        ? (moduleProgress?.completedAt ?? undefined)
        : undefined,
    }));
  }
}
