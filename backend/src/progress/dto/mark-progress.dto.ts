import { IsNotEmpty, IsString } from 'class-validator';

export class MarkProgressDto {
  @IsString()
  @IsNotEmpty()
  contentId: string;
}
