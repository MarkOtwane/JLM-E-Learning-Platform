import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationEvent } from '../types/notification-event.type';

export class SendNotificationDto {
  @IsEnum(NotificationEvent)
  event: NotificationEvent;

  @IsEmail()
  recipient: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsObject()
  payload: Record<string, any>; // dynamic data for template rendering
}
