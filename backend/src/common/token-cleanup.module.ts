import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../prisma/prisma.module';
import { TokenCleanupService } from './services/token-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [TokenCleanupService],
  exports: [TokenCleanupService],
})
export class TokenCleanupModule {}
