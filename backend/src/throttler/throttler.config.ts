import { minutes, seconds } from '@nestjs/throttler';

export const throttlerConfig = {
  ttl: seconds(60),
  limit: 100, // global default (100 requests per 60 seconds)
};

// Route-specific rate limits
export const routeThrottles = {
  login: {
    ttl: minutes(15),
    limit: 5, // 5 attempts per 15 minutes
  },
  register: {
    ttl: minutes(60),
    limit: 3, // 3 registrations per hour (prevent spam)
  },
  public: {
    ttl: minutes(1),
    limit: 60, // 60 requests per minute for public endpoints
  },
  auth: {
    ttl: minutes(15),
    limit: 10, // 10 auth requests per 15 minutes
  },
};
