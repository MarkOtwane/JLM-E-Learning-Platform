import * as winston from 'winston';

/**
 * Winston Logger Configuration
 * Provides structured logging for development and production environments
 */
export const loggerConfig = {
  // Transport configuration
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.ms(),
        // Color for console output
        winston.format.colorize(),
        // Custom format
        winston.format.printf(({ timestamp, level, message, context, ms }) => {
          return `[${timestamp}] [${context}] ${level}: ${message} ${ms || ''}`;
        }),
      ),
    }),
    // Error file output
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.ms(),
        winston.format.json(),
      ),
    }),
    // All log levels to file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.ms(),
        winston.format.json(),
      ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
};

/**
 * Create Winston Logger for NestJS
 * Can be injected via Inject(WINSTON_MODULE_PROVIDER)
 */
export function createWinstonLogger() {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'jlm-elearning-backend' },
    ...loggerConfig,
  });
}
