import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { CustomLoggerService } from '../common/logger/logger.service';
import { MetricsService } from '../common/services/metrics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [MetricsService, CustomLoggerService],
  exports: [MetricsService],
})
export class HealthModule {}
