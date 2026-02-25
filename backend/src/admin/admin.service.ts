import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { PlatformStats } from './types/platform-stats.type';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUserRole(dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: dto.userId },
      data: { role: dto.role },
    });
  }

  async listUsers(filter?: FilterUsersDto) {
    if (filter?.role === 'INSTRUCTOR') {
      // For instructors, include course and enrollment counts
      const instructors = await this.prisma.user.findMany({
        where: { role: 'INSTRUCTOR' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          courses: {
            select: {
              id: true,
              enrollments: { select: { id: true } },
            },
          },
        },
      });
      // Map to include courseCount and totalStudentsEnrolled
      return instructors.map((inst) => ({
        id: inst.id,
        name: inst.name,
        email: inst.email,
        courseCount: inst.courses.length,
        totalStudentsEnrolled: inst.courses.reduce(
          (sum, c) => sum + c.enrollments.length,
          0,
        ),
      }));
    }
    if (filter?.role === 'STUDENT') {
      // For students, include enrollment date
      return this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
    }
    // Default for other roles
    return this.prisma.user.findMany({
      where: {
        ...(filter?.role && { role: filter.role }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const [
      totalUsers,
      totalInstructors,
      totalStudents,
      totalCourses,
      totalEnrollments,
      totalContentItems,
      totalQuizzes,
      totalCertificatesIssued,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.course.count(),
      this.prisma.enrollment.count(),
      this.prisma.content.count(),
      this.prisma.quiz.count(),
      this.prisma.certificate.count(),
    ]);

    return {
      totalUsers,
      totalInstructors,
      totalStudents,
      totalCourses,
      totalEnrollments,
      totalContentItems,
      totalQuizzes,
      totalCertificatesIssued,
    };
  }

  async deleteUser(userId: string) {
    // Remove user and all related data (enrollments, courses if instructor, etc.)
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  }

  async deleteCourse(courseId: string) {
    // First verify the course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Delete in proper order to handle relations without cascade
    // Using a transaction to ensure atomicity
    
    await this.prisma.$transaction(async (tx) => {
      // Delete quiz attempts and questions/options
      const quizzes = await tx.quiz.findMany({
        where: { courseId },
        select: { id: true },
      });
      const quizIds = quizzes.map(q => q.id);

      if (quizIds.length > 0) {
        // Delete quiz attempts
        await tx.quizAttempt.deleteMany({
          where: { quizId: { in: quizIds } },
        });

        // Delete questions and options
        const questions = await tx.question.findMany({
          where: { quizId: { in: quizIds } },
          select: { id: true },
        });
        const questionIds = questions.map(q => q.id);

        if (questionIds.length > 0) {
          await tx.option.deleteMany({
            where: { questionId: { in: questionIds } },
          });
          await tx.question.deleteMany({
            where: { id: { in: questionIds } },
          });
        }

        // Delete quizzes
        await tx.quiz.deleteMany({
          where: { id: { in: quizIds } },
        });
      }

      // Delete lesson-related data
      const modules = await tx.module.findMany({
        where: { courseId },
        select: { id: true },
      });
      const moduleIds = modules.map(m => m.id);

      if (moduleIds.length > 0) {
        const lessons = await tx.lesson.findMany({
          where: { moduleId: { in: moduleIds } },
          select: { id: true },
        });
        const lessonIds = lessons.map(l => l.id);

        if (lessonIds.length > 0) {
          // Delete lesson attachments
          await tx.lessonAttachment.deleteMany({
            where: { lessonId: { in: lessonIds } },
          });

          // Delete lesson progress
          await tx.lessonProgress.deleteMany({
            where: { lessonId: { in: lessonIds } },
          });

          // Delete lesson questions
          await tx.lessonQuestion.deleteMany({
            where: { lessonId: { in: lessonIds } },
          });

          // Delete lessons
          await tx.lesson.deleteMany({
            where: { id: { in: lessonIds } },
          });
        }

        // Delete content items
        const contentModules = await tx.content.findMany({
          where: { moduleId: { in: moduleIds } },
          select: { id: true },
        });
        const contentIds = contentModules.map(c => c.id);

        if (contentIds.length > 0) {
          await tx.content.deleteMany({
            where: { id: { in: contentIds } },
          });
        }

        // Delete progress records
        await tx.progress.deleteMany({
          where: { moduleId: { in: moduleIds } },
        });

        // Delete modules
        await tx.module.deleteMany({
          where: { id: { in: moduleIds } },
        });
      }

      // Delete announcements
      await tx.announcement.deleteMany({
        where: { courseId },
      });

      // Delete assignments and submissions
      const assignments = await tx.assignment.findMany({
        where: { courseId },
        select: { id: true },
      });
      const assignmentIds = assignments.map(a => a.id);

      if (assignmentIds.length > 0) {
        await tx.assignmentSubmission.deleteMany({
          where: { assignmentId: { in: assignmentIds } },
        });
        await tx.assignment.deleteMany({
          where: { id: { in: assignmentIds } },
        });
      }

      // Delete gradebook entries
      await tx.gradebookEntry.deleteMany({
        where: { courseId },
      });

      // Delete course versions
      await tx.courseVersion.deleteMany({
        where: { courseId },
      });

      // Finally delete the course (enrollments, certificates, payments have cascade)
      await tx.course.delete({
        where: { id: courseId },
      });
    });

    return { message: 'Course deleted successfully' };
  }

  async listCertificates() {
    return this.prisma.certificate.findMany({
      orderBy: { issuedAt: 'desc' },
    });
  }

  async listCourses() {
    return this.prisma.course.findMany({
      include: {
        instructor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveInstructor(instructorId: string) {
    return this.prisma.user.update({
      where: { id: instructorId },
      data: { isApproved: true },
    });
  }

  async rejectInstructor(instructorId: string) {
    return this.prisma.user.delete({
      where: { id: instructorId },
    });
  }

  async listPendingInstructors() {
    return this.prisma.user.findMany({
      where: { role: 'INSTRUCTOR', isApproved: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }
}
