import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CacheControlOptions {
  public?: boolean;
  private?: boolean;
  maxAge?: number;
  sMaxAge?: number;
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  immutable?: boolean;
  staleWhileRevalidate?: number;
}

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly options: CacheControlOptions = {}) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap((data) => {
        // Only apply caching to successful GET requests
        if (request.method !== 'GET' || response.statusCode !== 200) {
          return;
        }

        // Build Cache-Control header
        const cacheControl = this.buildCacheControlHeader(this.options);
        if (cacheControl) {
          response.setHeader('Cache-Control', cacheControl);
        }

        // Add ETag for content validation
        if (data && !this.options.noStore) {
          const etag = this.generateETag(data);
          response.setHeader('ETag', etag);

          // Check If-None-Match header
          const ifNoneMatch = request.headers['if-none-match'];
          if (ifNoneMatch === etag) {
            response.status(304);
            return;
          }
        }

        // Add Vary header for content negotiation
        response.setHeader('Vary', 'Accept-Encoding, Accept-Language');

        // Add Last-Modified for time-based caching
        if (data && typeof data === 'object' && data.updatedAt) {
          const lastModified = new Date(data.updatedAt).toUTCString();
          response.setHeader('Last-Modified', lastModified);
        }
      }),
    );
  }

  private buildCacheControlHeader(options: CacheControlOptions): string {
    const directives: string[] = [];

    if (options.noStore) {
      return 'no-store';
    }

    if (options.noCache) {
      return 'no-cache';
    }

    if (options.public) {
      directives.push('public');
    } else if (options.private) {
      directives.push('private');
    }

    if (options.maxAge !== undefined) {
      directives.push(`max-age=${options.maxAge}`);
    }

    if (options.sMaxAge !== undefined) {
      directives.push(`s-maxage=${options.sMaxAge}`);
    }

    if (options.mustRevalidate) {
      directives.push('must-revalidate');
    }

    if (options.immutable) {
      directives.push('immutable');
    }

    if (options.staleWhileRevalidate !== undefined) {
      directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }

    return directives.length > 0 ? directives.join(', ') : '';
  }

  private generateETag(data: any): string {
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex')}"`;
  }
}
