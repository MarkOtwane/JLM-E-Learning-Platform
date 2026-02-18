import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  body: string;
}
