import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CourseLevel } from './create-course.dto';

export class FilterCoursesDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(CourseLevel)
  @IsOptional()
  level?: CourseLevel;
}
