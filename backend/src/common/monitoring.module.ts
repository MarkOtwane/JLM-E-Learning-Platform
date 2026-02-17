import { Global, Module } from '@nestjs/common';
import { CustomLoggerService } from './logger/logger.service';
import { MetricsService } from './services/metrics.service';

@Global()
@Module({
  providers: [CustomLoggerService, MetricsService],
  exports: [CustomLoggerService, MetricsService],
})
export class MonitoringModule {}
