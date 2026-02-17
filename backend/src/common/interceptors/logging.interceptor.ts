/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const userId = request.user?.id;
    const startTime = Date.now();

    // Log incoming request details
    this.logger.debug(`Incoming Request: ${method} ${url}`, 'HTTP');

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.debug(
            `Request completed: ${method} ${url} - ${duration}ms`,
            'HTTP',
          );

          // Log performance metrics for specific operations
          if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            this.logger.logPerformance(`${method} ${url}`, duration, {
              userId,
              bodySize: JSON.stringify(body).length,
            });
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Request failed: ${method} ${url} - ${duration}ms - ${error.message}`,
            error.stack,
            'HTTP',
          );
        },
      }),
    );
  }
}
