import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ProgressStatus } from '../entities/enrollment.entity';

export class UpdateProgressDto {
  @IsUUID()
  contentId: string;

  @IsEnum(ProgressStatus)
  @IsOptional()
  status?: ProgressStatus;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  completionPercentage?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  timeSpent?: number;

  @IsOptional()
  metadata?: any;
}
