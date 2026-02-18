import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { CertificatesModule } from './certificate/certificate.module';
import { DynamicCacheControlInterceptor } from './common/interceptors/dynamic-cache-control.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PerformanceMiddleware } from './common/middleware/performance.middleware';
import { MonitoringModule } from './common/monitoring.module';
import { TokenCleanupModule } from './common/token-cleanup.module';
import { validationSchema } from './config/validation.schema';
import { ContentModule } from './content/content.module';
import { CoursesModule } from './courses/courses.module';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { HealthModule } from './health/health.module';
import { InstructorsModule } from './instructor/instructor.module';
import { JobsModule } from './jobs/jobs.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notification/notification.module';
import { PaymentModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { StudentsModule } from './student/student.module';
import { throttlerConfig } from './throttler/throttler.config';
import { UsersModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: throttlerConfig.ttl,
        limit: throttlerConfig.limit,
      },
    ]),
    MonitoringModule,
    HealthModule,
    DiagnosticsModule,
    TokenCleanupModule,
    PrismaModule,
    AuthModule,
    CoursesModule,
    UsersModule,
    CoursesModule,
    ContentModule,
    StudentsModule,
    ProgressModule,
    QuizzesModule,
    CertificatesModule,
    PaymentModule,
    InstructorsModule,
    AdminModule,
    MessagingModule,
    NotificationsModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DynamicCacheControlInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PerformanceMiddleware).forRoutes('*');
  }
}
