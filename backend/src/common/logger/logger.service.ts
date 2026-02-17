import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    const transports: winston.transport[] = [
      // Console transport with colorization for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, context, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta)
                : '';
              return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${metaStr}`;
            },
          ),
        ),
      }),

      // Daily rotating file for all logs
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
      }),

      // Daily rotating file for errors only
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: logFormat,
      }),
    ];

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Custom methods for structured logging
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
  ) {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId,
    });
  }

  logDatabaseQuery(query: string, duration: number, params?: any) {
    this.logger.debug('Database Query', {
      context: 'Database',
      query,
      duration: `${duration}ms`,
      params,
    });
  }

  logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>,
  ) {
    this.logger.info('Performance Metric', {
      context: 'Performance',
      operation,
      duration: `${duration}ms`,
      ...metadata,
    });
  }

  logPayment(
    event: string,
    amount: number,
    currency: string,
    userId: string,
    metadata?: Record<string, any>,
  ) {
    this.logger.info('Payment Event', {
      context: 'Payment',
      event,
      amount,
      currency,
      userId,
      ...metadata,
    });
  }

  logAuth(
    event: string,
    userId: string,
    success: boolean,
    metadata?: Record<string, any>,
  ) {
    this.logger.info('Authentication Event', {
      context: 'Auth',
      event,
      userId,
      success,
      ...metadata,
    });
  }
}
