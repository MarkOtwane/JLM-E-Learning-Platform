import { SetMetadata } from '@nestjs/common';

export const NO_CACHE_KEY = 'no-cache';

/**
 * Decorator to disable caching on specific endpoints
 * Useful for dynamic or sensitive data that should never be cached
 * 
 * @example
 * @NoCache()
 * @Get('my-profile')
 * getProfile() { ... }
 */
export const NoCache = () => SetMetadata(NO_CACHE_KEY, true);
