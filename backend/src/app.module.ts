import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PaymentModule } from './payment/payment.module';
import { CertificateModule } from './certificate/certificate.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { ProgressModule } from './progress/progress.module';
import { StudentModule } from './student/student.module';
import { ContentModule } from './content/content.module';
import { CoursesModule } from './courses/courses.module';
import { CourseModule } from './course/course.module';
import { UserModule } from './user/user.module';
import { CourseModule } from './course/course.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CourseModule,
    EnrollmentModule,
    UserModule,
    CoursesModule,
    ContentModule,
    StudentModule,
    ProgressModule,
    QuizzesModule,
    CertificateModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
