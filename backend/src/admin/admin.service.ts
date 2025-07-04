import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
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
}
