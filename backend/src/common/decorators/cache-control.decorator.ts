import { SetMetadata } from '@nestjs/common';
import { CacheControlOptions } from '../interceptors/cache-control.interceptor';

export const CACHE_CONTROL_KEY = 'cache-control';

/**
 * Decorator to set Cache-Control headers on controller methods
 *
 * @example
 * // Public endpoint with 5-minute cache
 * @CacheControl({ public: true, maxAge: 300 })
 * @Get('public-courses')
 * getPublicCourses() { ... }
 *
 * @example
 * // Private endpoint with 1-minute cache
 * @CacheControl({ private: true, maxAge: 60 })
 * @Get('my-enrollments')
 * getMyEnrollments() { ... }
 *
 * @example
 * // Immutable static content
 * @CacheControl({ public: true, maxAge: 31536000, immutable: true })
 * @Get('static/:id')
 * getStaticContent() { ... }
 */
export const CacheControl = (options: CacheControlOptions) =>
  SetMetadata(CACHE_CONTROL_KEY, options);
