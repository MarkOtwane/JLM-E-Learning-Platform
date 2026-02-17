import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { CACHE_CONTROL_KEY } from '../decorators/cache-control.decorator';
import {
  CacheControlInterceptor,
  CacheControlOptions,
} from './cache-control.interceptor';

/**
 * Dynamic Cache Control Interceptor
 * Applies cache control headers based on @CacheControl() decorator metadata
 */
@Injectable()
export class DynamicCacheControlInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cacheOptions = this.reflector.get<CacheControlOptions>(
      CACHE_CONTROL_KEY,
      context.getHandler(),
    );

    if (!cacheOptions) {
      return next.handle();
    }

    const cacheInterceptor = new CacheControlInterceptor(cacheOptions);
    return cacheInterceptor.intercept(context, next);
  }
}
