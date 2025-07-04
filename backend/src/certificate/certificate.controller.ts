import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { Roles, User } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CertificatesService } from './certificate.service';
import { RequestCertificateDto } from './dto/request-certificate.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('download')
  @Roles(UserRole.STUDENT)
  async downloadCertificate(
    @User('id') studentId: string,
    @Body() dto: RequestCertificateDto,
    @Res() res: Response,
  ) {
    return this.certificatesService.issueCertificate(studentId, dto, res);
  }
}
