import { IsBoolean } from 'class-validator';

export class UpdateMessageReadDto {
  @IsBoolean()
  isRead: boolean;
}
