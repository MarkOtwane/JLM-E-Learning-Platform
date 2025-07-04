import { IsOptional, IsString } from 'class-validator';

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  title?: string;
}
