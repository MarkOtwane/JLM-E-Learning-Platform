import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { MetricsService } from '../common/services/metrics.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
    private metricsService: MetricsService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health check
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return {
            database: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            database: {
              status: 'down',
              error: error.message,
            },
          };
        }
      },
      // Memory health check (heap should not exceed 512MB)
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      // Disk health check (50GB threshold)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('metrics')
  getMetrics() {
    return this.metricsService.getMetrics();
  }

  @Get('queries')
  getQueryStats() {
    // Query statistics available via diagnostics endpoint
    return {
      message: 'Query statistics available at GET /api/diagnostics/query-stats',
    };
  }
}
