import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from 'src/mailer/mailer.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationEvent } from './types/notification-event.type';

@Injectable()
export class NotificationsService {
  constructor(private readonly mailerService: MailerService) {}

  async sendNotification(
    dto: SendNotificationDto,
  ): Promise<{ success: boolean }> {
    try {
      let subject = dto.subject;
      let template = '';

      switch (dto.event) {
        case NotificationEvent.SIGNUP:
          subject ||= '🎉 Welcome to JLM E-Learning Platform!';
          template = 'welcome-user';
          break;
        case NotificationEvent.INSTRUCTOR_APPROVED:
          subject ||= '✅ Your Instructor Application Has Been Approved';
          template = 'instructor-approved';
          break;
        case NotificationEvent.CERTIFICATE_ISSUED:
          subject ||= '🎓 Your Course Certificate is Ready!';
          template = 'certificate-complete';
          break;
        case NotificationEvent.QUIZ_GRADED:
          subject ||= '📊 Your Quiz Results Are In';
          template = 'quiz-result';
          break;
        default:
          throw new InternalServerErrorException(
            'Unhandled notification event',
          );
      }

      await this.mailerService.sendMail({
        to: dto.recipient,
        subject,
        template,
        context: dto.payload,
      });

      return { success: true };
    } catch (error) {
      console.error('Notification sending failed:', error);
      throw new InternalServerErrorException('Failed to send notification');
    }
  }
}
