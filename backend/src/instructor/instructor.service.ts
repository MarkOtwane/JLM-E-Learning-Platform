/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorMetricsResponse } from './types/instructor-metrics.type';
import { InstructorAnalyticsDto } from './dto/instructor-analytics';

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(
    userId: string,
    dto: InstructorAnalyticsDto,
  ): Promise<InstructorMetricsResponse> {
    const courses = await this.prisma.course.findMany({
      where: {
        instructorId: userId,
        ...(dto.courseId && { id: dto.courseId }),
      },
      include: {
        modules: {
          include: { contents: true },
        },
        enrollments: true,
        quizzes: {
          include: { attempts: true },
        },
      },
    });

    const results = courses.map((course) => {
      const studentIds = course.enrollments.map((e) => e.studentId);
      const contentIds = course.modules.flatMap((m) =>
        m.contents.map((c) => c.id),
      );
      const quizAttempts = course.quizzes.flatMap((q) => q.attempts);

      const avgProgress = studentIds.length
        ? studentIds
            .map((studentId) => {
              const completed = quizAttempts.filter(
                (a) => a.studentId === studentId,
              );
              return contentIds.length
                ? (completed.length / contentIds.length) * 100
                : 0;
            })
            .reduce((a, b) => a + b, 0) / studentIds.length
        : 0;

      const avgQuizScore = quizAttempts.length
        ? quizAttempts.reduce((a, b) => a + (b.score || 0), 0) /
          quizAttempts.length
        : 0;

      return {
        courseId: course.id,
        courseTitle: course.title,
        totalStudents: studentIds.length,
        avgProgress: Math.round(avgProgress),
        avgQuizScore: Math.round(avgQuizScore),
      };
    });

    return {
      totalCourses: results.length,
      totalStudents: results.reduce((sum, r) => sum + r.totalStudents, 0),
      courses: results,
    };
  }
}
