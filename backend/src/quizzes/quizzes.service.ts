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
import { QuizResult } from './types/quiz-result.type';

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

  async submitQuiz(userId: string, dto: SubmitQuizDto): Promise<QuizResult> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: dto.quizId },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const attempt = await this.prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId: dto.quizId,
      },
    });

    if (attempt)
      throw new ForbiddenException('You have already attempted this quiz');

    const breakdown = quiz.questions.map((q) => {
      const answer = dto.answers.find((a) => a.questionId === q.id);
      const isCorrect = answer?.selectedAnswer === q.correct;
      return {
        questionId: q.id,
        isCorrect,
        selectedAnswer: answer?.selectedAnswer || '',
        correctAnswer: q.correct,
      };
    });

    const correctAnswers = breakdown.filter((b) => b.isCorrect).length;
    const score = (correctAnswers / quiz.questions.length) * 100;

    await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId: quiz.id,
        score,
      },
    });

    return {
      totalQuestions: quiz.questions.length,
      correctAnswers,
      score,
      breakdown,
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
}
