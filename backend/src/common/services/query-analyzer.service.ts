import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QueryAnalyzerService implements OnModuleInit {
  private queryLogs: Array<{
    query: string;
    duration: number;
    timestamp: Date;
    model: string;
  }> = [];

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.QUERY_LOGGING_ENABLED === 'true') {
      this.enableQueryLogging();
    }
  }

  private enableQueryLogging() {
    const threshold = Number(process.env.QUERY_LOGGING_THRESHOLD_MS || 100);

    // Note: Direct middleware on PrismaClient requires extending PrismaClient
    // For now, query logging is handled at the logging interceptor level
    // and slow queries can be monitored via the metrics service
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

  addQueryLog(query: string, duration: number, model: string) {
    this.queryLogs.push({
      query,
      duration,
      timestamp: new Date(),
      model,
    });
  }
}
