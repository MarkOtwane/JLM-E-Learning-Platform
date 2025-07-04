/* eslint-disable @typescript-eslint/no-unsafe-return */
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
    });
    if (!content) throw new NotFoundException('Content not found');

    await this.prisma.progress.upsert({
      where: {
        studentId_contentId: {
          studentId,
          contentId: dto.contentId,
        },
      },
      update: {
        completedAt: new Date(),
      },
      create: {
        studentId,
        contentId: dto.contentId,
        completedAt: new Date(),
      },
    });

    return { message: 'Progress marked as completed' };
  }

  async getCompletedContentIds(studentId: string): Promise<string[]> {
    const progress = await this.prisma.progress.findMany({
      where: { studentId },
      select: { contentId: true },
    });
    return progress.map((p) => p.contentId);
  }

  async getProgressStatus(
    studentId: string,
    moduleId: string,
  ): Promise<ProgressStatus[]> {
    const contents = await this.prisma.content.findMany({
      where: { moduleId },
    });
    const completed = await this.prisma.progress.findMany({
      where: {
        studentId,
        contentId: { in: contents.map((c) => c.id) },
      },
    });

    const completedMap = new Map(
      completed.map((p) => [p.contentId, p.completedAt]),
    );

    return contents.map((content) => ({
      contentId: content.id,
      completed: completedMap.has(content.id),
      completedAt: completedMap.get(content.id),
    }));
  }
}
