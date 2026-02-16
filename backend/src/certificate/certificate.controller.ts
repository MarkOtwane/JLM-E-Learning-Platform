import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationService } from '../common/services/pagination.service';
import { CertificatesService } from './certificate.service';
import { RequestCertificateDto } from './dto/request-certificate.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly paginationService: PaginationService,
  ) {}

  @Post('download')
  @Roles(UserRole.STUDENT)
  async downloadCertificate(
    @User('id') studentId: string,
    @Body() dto: RequestCertificateDto,
    @Res() res: Response,
  ) {
    return this.certificatesService.issueCertificate(studentId, dto, res);
  }

  @Get()
  @Roles(UserRole.STUDENT)
  async getMyCertificates(
    @User('id') studentId: string,
    @Query() pagination: PaginationDto,
  ) {
    const { certificates, total } =
      await this.certificatesService.getStudentCertificates(
        studentId,
        pagination,
      );
    return this.paginationService.paginate(certificates, total, pagination);
  }
}
