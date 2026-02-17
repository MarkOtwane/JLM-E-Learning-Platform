import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { MetricsService } from './metrics.service';

@Injectable()
export class CacheService {
  private readonly redis?: Redis;
  private readonly enabled: boolean;
  private readonly defaultTtl: number;

  constructor(
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService,
  ) {
    this.enabled = process.env.CACHE_ENABLED === 'true';
    this.defaultTtl = Number(process.env.CACHE_DEFAULT_TTL || 300);

    if (
      this.enabled &&
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null;
    const result = (await this.redis.get<T>(key)) ?? null;

    // Track cache hit/miss metrics
    if (result !== null) {
      this.metricsService.trackCacheHit();
    } else {
      this.metricsService.trackCacheMiss();
    }

    return result;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.enabled || !this.redis) return;
    const ttl = ttlSeconds ?? this.defaultTtl;
    await this.redis.set(key, value, { ex: ttl });
  }
}
