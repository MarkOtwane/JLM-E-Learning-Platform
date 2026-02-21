/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { InstructorAnalyticsDto } from './dto/instructor-analytics';
import { ReorderLessonsDto } from './dto/reorder-lessons.dto';
import { InstructorMetricsResponse } from './types/instructor-metrics.type';

@Injectable()
export class InstructorsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== DASHBOARD METRICS ====================
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
          include: {
            contents: true,
            lessons: {
              include: {
                progress: true,
                questions: true,
              },
            },
          },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
                createdAt: true,
              },
            },
          },
        },
        quizzes: {
          include: { QuizAttempt: true },
        },
        assignments: {
          include: {
            submissions: true,
          },
        },
        announcements: true,
      },
    });

    const results = courses.map((course) => {
      const studentIds = course.enrollments.map((e) => e.userId);
      const contentIds = course.modules.flatMap((m) =>
        m.contents.map((c) => c.id),
      );
      const lessonIds = course.modules.flatMap((m) =>
        m.lessons.map((l) => l.id),
      );
      const quizAttempts = course.quizzes.flatMap((q) => q.QuizAttempt);

      // Calculate average progress
      const avgProgress = studentIds.length
        ? studentIds
            .map((studentId) => {
              const completed = quizAttempts.filter(
                (a) => a.userId === studentId,
              );
              return contentIds.length > 0
                ? (completed.length / contentIds.length) * 100
                : 0;
            })
            .reduce((a, b) => a + b, 0) / studentIds.length
        : 0;

      // Calculate average quiz score
      const avgQuizScore = quizAttempts.length
        ? quizAttempts.reduce((a, b) => a + (b.score || 0), 0) /
          quizAttempts.length
        : 0;

      // Calculate completion rate
      const completionRate =
        studentIds.length > 0 ? Math.round(avgProgress) : 0;

      // Count pending assignments
      const pendingAssignments = course.assignments.reduce(
        (sum, assignment) => {
          return (
            sum +
            assignment.submissions.filter(
              (s) => s.status === 'submitted' && !s.score,
            ).length
          );
        },
        0,
      );

      // Get last activity
      const lastActivity = course.updatedAt;

      return {
        courseId: course.id,
        courseTitle: course.title,
        totalStudents: studentIds.length,
        avgProgress: Math.round(avgProgress),
        avgQuizScore: Math.round(avgQuizScore),
        completionRate,
        pendingAssignments,
        lastActivity,
        enrollmentCount: studentIds.length,
      };
    });

    return {
      totalCourses: results.length,
      totalStudents: results.reduce((sum, r) => sum + r.totalStudents, 0),
      courses: results,
    };
  }

  // ==================== COURSE MANAGEMENT ====================
  async getInstructorCourses(userId: string) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId: userId },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { lessons: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      category: course.category,
      duration: course.duration,
      isPremium: course.isPremium,
      price: course.price,
      currency: course.currency,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      totalStudents: course._count.enrollments,
      totalModules: course._count.modules,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        order: m.order,
        lessonCount: m._count.lessons,
      })),
    }));
  }

  // ==================== LESSON MANAGEMENT ====================
  async createLesson(userId: string, moduleId: string, dto: CreateLessonDto) {
    // Verify module belongs to instructor's course
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    if (module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only add lessons to your own courses',
      );
    }

    // Get the next order number
    const lastLesson = await this.prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = lastLesson ? lastLesson.order + 1 : 1;

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        description: dto.description,
        content: dto.content,
        videoUrl: dto.videoUrl,
        videoFile: dto.videoFile,
        duration: dto.duration || 0,
        isLocked: dto.isLocked || false,
        releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
        order: nextOrder,
        moduleId,
      },
    });
  }

  async updateLesson(
    userId: string,
    lessonId: string,
    dto: Partial<CreateLessonDto>,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.module.course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own lessons');
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
        ...(dto.videoFile !== undefined && { videoFile: dto.videoFile }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.isLocked !== undefined && { isLocked: dto.isLocked }),
        ...(dto.releaseDate !== undefined && {
          releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : null,
        }),
      },
    });
  }

  async deleteLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.module.course.instructorId !== userId) {
      throw new ForbiddenException('You can only delete your own lessons');
    }

    await this.prisma.lesson.delete({ where: { id: lessonId } });
    return { message: 'Lesson deleted successfully' };
  }

  async reorderLessons(
    userId: string,
    moduleId: string,
    dto: ReorderLessonsDto,
  ) {
    // Verify module belongs to instructor
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException('Module not found');
    }

    if (module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only reorder lessons in your own courses',
      );
    }

    // Update lesson orders in a transaction
    const updates = dto.lessons.map((item) =>
      this.prisma.lesson.update({
        where: { id: item.lessonId },
        data: { order: item.order },
      }),
    );

    await this.prisma.$transaction(updates);
    return { message: 'Lessons reordered successfully' };
  }

  async getModuleLessons(moduleId: string) {
    return this.prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
      include: {
        attachments: true,
        _count: {
          select: { progress: true, questions: true },
        },
      },
    });
  }

  // ==================== ASSIGNMENT MANAGEMENT ====================
  async createAssignment(userId: string, dto: CreateAssignmentDto) {
    // Verify course belongs to instructor
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only create assignments for your own courses',
      );
    }

    return this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        maxScore: dto.maxScore || 100,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        allowLateSubmission: dto.allowLateSubmission || false,
        courseId: dto.courseId,
      },
    });
  }

  async getCourseAssignments(courseId: string, userId: string) {
    // Verify course belongs to instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view assignments for your own courses',
      );
    }

    return this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssignmentSubmissions(assignmentId: string, userId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (assignment.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view submissions for your own assignments',
      );
    }

    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { id: true, name: true, email: true, profilePicture: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async gradeSubmission(
    submissionId: string,
    userId: string,
    dto: GradeSubmissionDto,
  ) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: true } } },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.assignment.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only grade submissions for your own courses',
      );
    }

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        gradedAt: new Date(),
        status: 'graded',
      },
    });
  }

  // ==================== ANNOUNCEMENT MANAGEMENT ====================
  async createAnnouncement(userId: string, dto: CreateAnnouncementDto) {
    // Verify course belongs to instructor
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only create announcements for your own courses',
      );
    }

    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        isPinned: dto.isPinned || false,
        courseId: dto.courseId,
        authorId: userId,
      },
    });
  }

  async getCourseAnnouncements(courseId: string) {
    return this.prisma.announcement.findMany({
      where: { courseId },
      include: {
        author: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async deleteAnnouncement(announcementId: string, userId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { course: true },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own announcements',
      );
    }

    await this.prisma.announcement.delete({ where: { id: announcementId } });
    return { message: 'Announcement deleted successfully' };
  }

  // ==================== STUDENT MANAGEMENT ====================
  async getCourseStudents(courseId: string, userId: string) {
    // Verify course belongs to instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view students in your own courses',
      );
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Get progress for each student
    const studentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get lesson progress
        const lessonProgress = await this.prisma.lessonProgress.findMany({
          where: { userId: enrollment.userId },
          include: { lesson: { include: { module: true } } },
        });

        const completedLessons = lessonProgress.filter(
          (lp) => lp.completed,
        ).length;
        const totalLessons = await this.prisma.lesson.count({
          where: {
            module: { courseId },
          },
        });

        const progressPercentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        // Check if inactive (no login for 7+ days)
        const lastActivity = enrollment.user.updatedAt;
        const daysSinceLastActivity = Math.floor(
          (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
        );
        const isInactive = daysSinceLastActivity > 7;

        return {
          id: enrollment.user.id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          profilePicture: enrollment.user.profilePicture,
          enrolledAt: enrollment.enrolledAt,
          progressPercentage,
          completedLessons,
          totalLessons,
          lastActivity,
          isInactive,
          daysSinceLastActivity,
        };
      }),
    );

    return studentsWithProgress;
  }

  // ==================== Q&A MANAGEMENT ====================
  async getLessonQuestions(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view questions for your own lessons',
      );
    }

    return this.prisma.lessonQuestion.findMany({
      where: { lessonId },
      include: {
        user: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async answerQuestion(questionId: string, userId: string, answer: string) {
    const question = await this.prisma.lessonQuestion.findUnique({
      where: { id: questionId },
      include: {
        lesson: { include: { module: { include: { course: true } } } },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.lesson.module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only answer questions for your own lessons',
      );
    }

    return this.prisma.lessonQuestion.update({
      where: { id: questionId },
      data: {
        answer,
        isAnswered: true,
      },
    });
  }

  // ==================== ANALYTICS ====================
  async getCourseAnalytics(courseId: string, userId: string) {
    // Verify course belongs to instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view analytics for your own courses',
      );
    }

    // Get enrollment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId,
        enrolledAt: { gte: sixMonthsAgo },
      },
      orderBy: { enrolledAt: 'asc' },
    });

    // Group by month
    const enrollmentTrends = enrollments.reduce(
      (acc, enrollment) => {
        const month = enrollment.enrolledAt.toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get quiz performance distribution
    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: {
        quiz: { courseId },
      },
      select: { score: true },
    });

    const scoreRanges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    quizAttempts.forEach((attempt) => {
      const score = attempt.score;
      if (score <= 20) scoreRanges['0-20']++;
      else if (score <= 40) scoreRanges['21-40']++;
      else if (score <= 60) scoreRanges['41-60']++;
      else if (score <= 80) scoreRanges['61-80']++;
      else scoreRanges['81-100']++;
    });

    // Get lesson drop-off analysis
    const lessons = await this.prisma.lesson.findMany({
      where: { module: { courseId } },
      include: {
        _count: { select: { progress: true } },
        progress: { where: { completed: true } },
      },
      orderBy: { order: 'asc' },
    });

    const lessonDropOff = lessons.map((lesson) => ({
      lessonId: lesson.id,
      title: lesson.title,
      order: lesson.order,
      totalViews: lesson._count.progress,
      completions: lesson.progress.length,
      dropOffRate:
        lesson._count.progress > 0
          ? Math.round(
              (1 - lesson.progress.length / lesson._count.progress) * 100,
            )
          : 0,
    }));

    // Calculate overall completion rate
    const totalEnrollments = await this.prisma.enrollment.count({
      where: { courseId },
    });

    const completedCertificates = await this.prisma.certificate.count({
      where: { courseId },
    });

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedCertificates / totalEnrollments) * 100)
        : 0;

    return {
      enrollmentTrends: Object.entries(enrollmentTrends).map(
        ([month, count]) => ({
          month,
          count,
        }),
      ),
      quizPerformanceDistribution: Object.entries(scoreRanges).map(
        ([range, count]) => ({
          range,
          count,
        }),
      ),
      lessonDropOff,
      completionRate,
      totalEnrollments,
      totalCompletions: completedCertificates,
    };
  }

  // ==================== GRADEBOOK ====================
  async getCourseGradebook(courseId: string, userId: string) {
    // Verify course belongs to instructor
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view gradebook for your own courses',
      );
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const assignments = await this.prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: true,
      },
    });

    const gradebook = enrollments.map((enrollment) => {
      const studentSubmissions = assignments.map((assignment) => {
        const submission = assignment.submissions.find(
          (s) => s.studentId === enrollment.userId,
        );
        return {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          maxScore: assignment.maxScore,
          score: submission?.score || null,
          status: submission?.status || 'not_submitted',
          submittedAt: submission?.submittedAt || null,
        };
      });

      const totalScore = studentSubmissions.reduce(
        (sum, s) => sum + (s.score || 0),
        0,
      );
      const maxPossibleScore = studentSubmissions.reduce(
        (sum, s) => sum + s.maxScore,
        0,
      );
      const overallGrade =
        maxPossibleScore > 0
          ? Math.round((totalScore / maxPossibleScore) * 100)
          : 0;

      return {
        studentId: enrollment.user.id,
        studentName: enrollment.user.name,
        studentEmail: enrollment.user.email,
        submissions: studentSubmissions,
        totalScore,
        maxPossibleScore,
        overallGrade,
      };
    });

    return {
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        maxScore: a.maxScore,
        dueDate: a.dueDate,
      })),
      gradebook,
    };
  }
}
