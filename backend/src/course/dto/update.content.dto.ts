import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  @Length(1, 255)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  contentType?: string;

  @IsString()
  @IsOptional()
  contentUrl?: string;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  orderIndex?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  duration?: number;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @IsBoolean()
  @IsOptional()
  isDownloadable?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
