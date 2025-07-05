import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { CertificatesController } from './certificate.controller';
import { CertificatesService } from './certificate.service';

@Module({
  imports: [PrismaModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, JwtStrategy],
  exports: [CertificatesService],
})
export class CertificatesModule {}
