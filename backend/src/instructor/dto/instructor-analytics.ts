import { IsOptional, IsString } from 'class-validator';

export class InstructorAnalyticsDto {
  @IsOptional()
  @IsString()
  courseId?: string;
}
