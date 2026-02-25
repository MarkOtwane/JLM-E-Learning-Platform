import { minutes, seconds } from '@nestjs/throttler';

export const throttlerConfig = {
  ttl: seconds(60),
  limit: 1000, // global default (1000 requests per 60 seconds) - increased for development
};

// Route-specific rate limits
export const routeThrottles = {
  login: {
    ttl: minutes(15),
    limit: 100, // 100 attempts per 15 minutes - development friendly
  },
  register: {
    ttl: minutes(60),
    limit: 50, // 50 registrations per hour - development friendly
  },
  public: {
    ttl: minutes(1),
    limit: 300, // 300 requests per minute for public endpoints
  },
  auth: {
    ttl: minutes(15),
    limit: 100, // 100 auth requests per 15 minutes
  },
};
