import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContentType } from '../types/content-type.enum';

export class UploadContentDto {
  @IsEnum(ContentType)
  type: ContentType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @IsString()
  @IsOptional()
  url?: string; // For external links
}
