import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateCertificate } from './utils/generate-certificate.util';
import { Response } from 'express';
import { RequestCertificateDto } from './dto/request-certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  async issueCertificate(
    studentId: string,
    dto: RequestCertificateDto,
    res: Response,
  ) {
    const { courseId } = dto;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: { contents: true },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (!enrollment)
      throw new ForbiddenException('Not enrolled in this course');

    const allContentIds = course.modules.flatMap((m) =>
      m.contents.map((c) => c.id),
    );

    const completed = await this.prisma.progress.findMany({
      where: {
        studentId,
        contentId: { in: allContentIds },
      },
    });

    if (completed.length < allContentIds.length) {
      throw new ForbiddenException('You must complete all course content');
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    return generateCertificate(res, student.name, course.title, new Date());
  }
}
