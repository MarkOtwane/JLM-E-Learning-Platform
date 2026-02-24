import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

export interface QuizSubmissionResult {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  projectLink: string;
  linkType: string;
  notes?: string;
  submittedAt: Date;
}

export interface QuizSubmissionStatus {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  projectLink?: string;
  linkType?: string;
  notes?: string;
  certificateUrl?: string;
  feedback?: string;
}

@Injectable()
export class QuizzesService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuiz(userId: string, role: UserRole, dto: CreateQuizDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
      include: { course: true },
    });

    if (!module) throw new NotFoundException('Module not found');
    if (role !== 'ADMIN' && module.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Not allowed to create quiz for this module',
      );
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        title: `Quiz for Module ${dto.moduleId}`,
        courseId: module.courseId,
        questions: {
          create: dto.questions.map((q) => ({
            text: q.question,
            type: 'MCQ',
            correct: q.correctAnswer,
          })),
        },
      },
      include: { questions: true },
    });

    return quiz;
  }

  async submitQuiz(userId: string, dto: SubmitQuizDto): Promise<QuizSubmissionResult> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: dto.quizId },
    });
    
    if (!quiz) throw new NotFoundException('Quiz not found');

    // Check if user already has a submission
    const existingSubmission = await this.prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId: dto.quizId,
      },
    });

    if (existingSubmission) {
      // Update existing submission
      const updated = await this.prisma.quizAttempt.update({
        where: { id: existingSubmission.id },
        data: {
          score: 0, // Will be updated when instructor approves
          attemptDate: new Date(),
          projectLink: dto.projectLink,
          linkType: dto.linkType,
          notes: dto.notes,
        },
      });
      return {
        id: updated.id,
        status: 'pending',
        projectLink: dto.projectLink,
        linkType: dto.linkType,
        notes: dto.notes,
        submittedAt: updated.attemptDate,
      };
    }

    // Create new submission with link
    const submission = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId: quiz.id,
        score: 0, // Pending review - will be updated by instructor
        projectLink: dto.projectLink,
        linkType: dto.linkType,
        notes: dto.notes,
      },
    });

    return {
      id: submission.id,
      status: 'pending',
      projectLink: dto.projectLink,
      linkType: dto.linkType,
      notes: dto.notes,
      submittedAt: submission.attemptDate,
    };
  }

  async getSubmissionStatus(
    userId: string,
    quizId: string,
  ): Promise<QuizSubmissionStatus> {
    const submission = await this.prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId,
      },
    });

    if (!submission) {
      return { status: 'not_submitted' };
    }

    // Map score to status: 0 = pending, 100 = approved, -1 = rejected
    let status: 'pending' | 'approved' | 'rejected' = 'pending';
    if (submission.score === 100) {
      status = 'approved';
    } else if (submission.score === -1) {
      status = 'rejected';
    }

    // If approved, check for certificate
    let certificateUrl: string | undefined;
    if (status === 'approved') {
      const certificate = await this.prisma.certificate.findFirst({
        where: {
          userId,
          courseId: (await this.prisma.quiz.findUnique({ where: { id: quizId } }))?.courseId,
        },
      });
      certificateUrl = certificate?.certificateUrl;
    }

    return {
      status,
      projectLink: submission.projectLink || undefined,
      linkType: submission.linkType || undefined,
      notes: submission.notes || undefined,
      feedback: submission.feedback || undefined,
      certificateUrl,
    };
  }

  async getQuizByModule(moduleId: string) {
    return this.prisma.quiz.findFirst({
      where: { courseId: moduleId },
      include: { questions: true },
    });
  }

  async updateQuiz(quizId: string, dto: UpdateQuizDto) {
    return this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        questions: {
          deleteMany: {},
          create:
            dto.questions?.map((q) => ({
              text: q.question,
              type: 'MCQ',
              correct: q.correctAnswer,
            })) || [],
        },
      },
      include: { questions: true },
    });
  }

  // Instructor methods for reviewing submissions
  async getSubmissionsForQuiz(quizId: string) {
    return this.prisma.quizAttempt.findMany({
      where: { quizId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { attemptDate: 'desc' },
    });
  }

  async reviewSubmission(
    quizId: string,
    submissionId: string,
    status: 'approved' | 'rejected',
    feedback?: string,
  ) {
    const score = status === 'approved' ? 100 : -1;

    return this.prisma.quizAttempt.update({
      where: { id: submissionId },
      data: {
        score,
        feedback,
      },
    });
  }
}
