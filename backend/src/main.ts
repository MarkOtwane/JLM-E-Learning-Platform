/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { CustomLoggerService } from './common/logger/logger.service';

async function bootstrap() {
  // Use custom Winston logger with daily rotation
  const customLogger = new CustomLoggerService();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // Disable default body parsing for Stripe webhooks
    logger: customLogger,
  });

  // Middleware to capture raw body for Stripe signature verification
  app.use(
    express.json({
      verify: (req: any, res: any, buf: Buffer) => {
        if (
          req.path === '/api/webhooks/stripe' ||
          req.path === '/api/jobs/process'
        ) {
          req.rawBody = buf;
        }
      },
    }),
  );

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'https://jlm-e-learning-platform.vercel.app',
    ],
    credentials: true,
  });

  // Enable Helmet for security headers (XSS, clickjacking, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: ["'self'", 'https:', 'http:'],
          fontSrc: ["'self'", 'fonts.gstatic.com'],
        },
      },
      frameguard: {
        action: 'deny', // Prevents clickjacking
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Serve static files from uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'));

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  customLogger.log(`🚀 Application is running on: http://localhost:${port}/api`, 'Bootstrap');
  customLogger.log(`📊 Health check available at: http://localhost:${port}/api/health`, 'Bootstrap');
  customLogger.log(`📈 Metrics available at: http://localhost:${port}/api/health/metrics`, 'Bootstrap');
}

bootstrap();
