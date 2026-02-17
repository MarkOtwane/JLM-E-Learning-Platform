import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Capture response finish event
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const userId = (req as any).user?.id;

      this.logger.logRequest(
        req.method,
        req.originalUrl,
        res.statusCode,
        duration,
        userId,
      );

      // Log slow requests (>1 second)
      if (duration > 1000) {
        this.logger.warn(
          `Slow request detected: ${req.method} ${req.originalUrl}`,
          'Performance',
        );
      }
    });

    next();
  }
}
