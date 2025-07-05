import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { MailerModule } from '../mailer/mailer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsController } from './notification.controller';
import { NotificationsService } from './notification.service';

@Module({
  imports: [PrismaModule, MailerModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, JwtStrategy],
  exports: [NotificationsService],
})
export class NotificationsModule {}
