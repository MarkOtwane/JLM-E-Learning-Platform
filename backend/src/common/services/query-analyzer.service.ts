import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class QueryAnalyzerService implements OnModuleInit {
  private queryLogs: Array<{
    query: string;
    duration: number;
    timestamp: Date;
    model: string;
  }> = [];

  constructor(private readonly prisma: PrismaClient) {}

  onModuleInit() {
    if (process.env.QUERY_LOGGING_ENABLED === 'true') {
      this.enableQueryLogging();
    }
  }

  private enableQueryLogging() {
    // Prisma middleware for query logging
    this.prisma.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      const duration = after - before;

      // Log slow queries (>100ms)
      if (duration > 100) {
        this.queryLogs.push({
          query: `${params.model}.${params.action}`,
          duration,
          timestamp: new Date(),
          model: params.model || 'unknown',
        });

        console.warn(`[Slow Query] ${params.model}.${params.action} - ${duration}ms`, {
          args: JSON.stringify(params.args).substring(0, 200),
        });
      }

      return result;
    });
  }

  getSlowQueries(limit = 20) {
    return this.queryLogs
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getQueryStats() {
    const byModel = this.queryLogs.reduce(
      (acc, log) => {
        if (!acc[log.model]) {
          acc[log.model] = { count: 0, totalDuration: 0, avgDuration: 0 };
        }
        acc[log.model].count++;
        acc[log.model].totalDuration += log.duration;
        acc[log.model].avgDuration =
          acc[log.model].totalDuration / acc[log.model].count;
        return acc;
      },
      {} as Record<string, { count: number; totalDuration: number; avgDuration: number }>,
    );

    return {
      totalQueries: this.queryLogs.length,
      slowestQuery:
        this.queryLogs.length > 0
          ? this.queryLogs.reduce((prev, curr) =>
              curr.duration > prev.duration ? curr : prev,
            )
          : null,
      byModel,
    };
  }

  clearLogs() {
    this.queryLogs = [];
  }
}
