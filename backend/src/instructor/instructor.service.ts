import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorAnalyticsDto } from './dto/instructor-analytics';
import { InstructorMetricsResponse } from './types/instructor-metrics.type';

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
          include: { QuizAttempt: true },
        },
      },
    });

    const results = courses.map((course) => {
      const studentIds = course.enrollments.map((e) => e.userId);
      const contentIds = course.modules.flatMap((m) =>
        m.contents.map((c) => c.id),
      );
      const quizAttempts = course.quizzes.flatMap((q) => q.QuizAttempt);

      const avgProgress = studentIds.length
        ? studentIds
            .map((studentId) => {
              const completed = quizAttempts.filter(
                (a) => a.userId === studentId,
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
