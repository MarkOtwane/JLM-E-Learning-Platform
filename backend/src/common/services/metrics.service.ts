import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '../logger/logger.service';

export interface PerformanceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
  };
  database: {
    queries: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  payments: {
    total: number;
    successful: number;
    failed: number;
  };
}

@Injectable()
export class MetricsService {
  private metrics: {
    requests: Array<{ duration: number; success: boolean }>;
    databaseQueries: Array<{ duration: number }>;
    cacheHits: number;
    cacheMisses: number;
    payments: Array<{ success: boolean }>;
  } = {
    requests: [],
    databaseQueries: [],
    cacheHits: 0,
    cacheMisses: 0,
    payments: [],
  };

  constructor(private readonly logger: CustomLoggerService) {
    // Reset metrics every hour
    setInterval(() => this.resetMetrics(), 60 * 60 * 1000);
  }

  trackRequest(duration: number, success: boolean) {
    this.metrics.requests.push({ duration, success });

    // Log if request is slow (>2 seconds)
    if (duration > 2000) {
      this.logger.warn(
        `Slow request tracked: ${duration}ms`,
        'MetricsService',
      );
    }
  }

  trackDatabaseQuery(duration: number) {
    this.metrics.databaseQueries.push({ duration });

    // Log slow database queries (>500ms)
    if (duration > 500) {
      this.logger.warn(
        `Slow database query: ${duration}ms`,
        'MetricsService',
      );
    }
  }

  trackCacheHit() {
    this.metrics.cacheHits++;
  }

  trackCacheMiss() {
    this.metrics.cacheMisses++;
  }

  trackPayment(success: boolean) {
    this.metrics.payments.push({ success });
  }

  getMetrics(): PerformanceMetrics {
    const totalRequests = this.metrics.requests.length;
    const successfulRequests = this.metrics.requests.filter(
      (r) => r.success,
    ).length;
    const averageRequestDuration =
      totalRequests > 0
        ? this.metrics.requests.reduce((sum, r) => sum + r.duration, 0) /
          totalRequests
        : 0;

    const totalQueries = this.metrics.databaseQueries.length;
    const averageQueryTime =
      totalQueries > 0
        ? this.metrics.databaseQueries.reduce((sum, q) => sum + q.duration, 0) /
          totalQueries
        : 0;
    const slowQueries = this.metrics.databaseQueries.filter(
      (q) => q.duration > 500,
    ).length;

    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate =
      totalCacheRequests > 0
        ? (this.metrics.cacheHits / totalCacheRequests) * 100
        : 0;

    const totalPayments = this.metrics.payments.length;
    const successfulPayments = this.metrics.payments.filter(
      (p) => p.success,
    ).length;

    return {
      requests: {
        total: totalRequests,
        successful: successfulRequests,
        failed: totalRequests - successfulRequests,
        averageDuration: Math.round(averageRequestDuration),
      },
      database: {
        queries: totalQueries,
        averageQueryTime: Math.round(averageQueryTime),
        slowQueries,
      },
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: Math.round(cacheHitRate * 100) / 100,
      },
      payments: {
        total: totalPayments,
        successful: successfulPayments,
        failed: totalPayments - successfulPayments,
      },
    };
  }

  private resetMetrics() {
    this.logger.log('Resetting hourly metrics', 'MetricsService');
    const snapshot = this.getMetrics();
    this.logger.logPerformance('Hourly Metrics Snapshot', 0, snapshot);

    this.metrics = {
      requests: [],
      databaseQueries: [],
      cacheHits: 0,
      cacheMisses: 0,
      payments: [],
    };
  }
}
