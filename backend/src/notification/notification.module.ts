import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationsController } from './notification.controller';
import { NotificationsService } from './notification.service';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [MailerModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
