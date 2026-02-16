import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RequestCertificateDto } from './dto/request-certificate.dto';
import { generateCertificate } from './utils/generate-certificate.util';

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

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        courseId,
      },
    });

    if (!enrollment)
      throw new ForbiddenException('Not enrolled in this course');

    const allContentIds = course.modules.flatMap((m) =>
      m.contents.map((c) => c.id),
    );

    const completed = await this.prisma.progress.findMany({
      where: {
        userId: studentId,
        moduleId: { in: course.modules.map((m) => m.id) },
      },
    });

    if (completed.length < allContentIds.length) {
      throw new ForbiddenException('You must complete all course content');
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    // Check if certificate already exists
    const existingCertificate = await this.prisma.certificate.findFirst({
      where: {
        userId: studentId,
        courseId,
      },
    });

    if (existingCertificate) {
      // If certificate exists, generate and return it
      return generateCertificate(
        res,
        student.name,
        course.title,
        existingCertificate.issuedAt,
      );
    }

    // Create certificate record in database
    const certificate = await this.prisma.certificate.create({
      data: {
        userId: studentId,
        courseId,
        certificateUrl: `https://certs.example.com/${studentId}-${courseId}.pdf`,
      },
    });

    // Generate and return the PDF
    return generateCertificate(
      res,
      student.name,
      course.title,
      certificate.issuedAt,
    );
  }

  async getStudentCertificates(studentId: string, pagination: PaginationDto) {
    const total = await this.prisma.certificate.count({
      where: { userId: studentId },
    });

    const certificates = await this.prisma.certificate.findMany({
      where: { userId: studentId },
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        course: {
          select: {
            title: true,
            description: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return { certificates, total };
  }
}
