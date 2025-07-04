import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { CertificatesController } from './certificate.controller';
import { CertificatesService } from './certificate.service';

@Module({
  imports: [PrismaModule],
  controllers: [CertificatesController],
  providers: [
    CertificatesService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class CertificatesModule {}
