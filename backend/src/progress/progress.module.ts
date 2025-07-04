import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from '../auth/jwt.strategy';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [ProgressService],
})
export class ProgressModule {}
