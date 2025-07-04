import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CertificatesModule } from './certificate/certificate.module';
import { ContentModule } from './content/content.module';
import { CoursesModule } from './courses/courses.module';
import { InstructorsModule } from './instructor/instructor.module';
import { NotificationsModule } from './notification/notification.module';
import { PaymentsModule } from './payment/payment.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { StudentsModule } from './student/student.module';
import { UsersModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
    PaymentsModule,
    InstructorsModule,
    AdminModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
