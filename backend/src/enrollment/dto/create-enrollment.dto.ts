/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
  IsString,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EnrollmentStatus,
  ProgressStatus,
} from '../entities/enrollment.entity';

export class EnrollDto {
  @IsUUID()
  courseId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  amountPaid?: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;
}
