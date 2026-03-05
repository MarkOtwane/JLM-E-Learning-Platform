/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Logger } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';

// NotificationEvent import removed - frozen for future implementation
// JobsService removed - frozen for future implementation

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('Notifications');

  constructor() {}

  async sendNotification(
    dto: SendNotificationDto,
  ): Promise<{ success: boolean }> {
    // Email staff frozen - notifications disabled
    this.logger.log(
      `Notification of type ${dto.event} to ${dto.recipient} but emails disabled`,
    );
    return { success: true };

    // Original email logic commented out for future implementation:
    // try {
    //   let subject = dto.subject;
    //   let template = '';

    //   switch (dto.event) {
    //     case NotificationEvent.SIGNUP:
    //       subject ||= '🎉 Welcome to JLM E-Learning Platform!';
    //       template = 'welcome-user';
    //       break;
    //     case NotificationEvent.INSTRUCTOR_APPROVED:
    //       subject ||= '✅ Your Instructor Application Has Been Approved';
    //       template = 'instructor-approved';
    //       break;
    //     case NotificationEvent.CERTIFICATE_ISSUED:
    //       subject ||= '🎓 Your Course Certificate is Ready!';
    //       template = 'certificate-complete';
    //       break;
    //     case NotificationEvent.QUIZ_GRADED:
    //       subject ||= '📊 Your Quiz Results Are In';
    //       template = 'quiz-result';
    //       break;
    //     default:
    //       throw new InternalServerErrorException(
    //         'Unhandled notification event',
    //       );
    //   }

    //   await this.jobsService.enqueueEmail({
    //     to: dto.recipient,
    //     subject,
    //     template,
    //     context: dto.payload,
    //   });

    //   return { success: true };
    // } catch (error) {
    //   throw new InternalServerErrorException('Failed to send notification');
    // }
  }
}
