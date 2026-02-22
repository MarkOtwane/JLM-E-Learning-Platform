import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseStatus, CreateCourseDto } from './create-course-v2.dto';

/**
 * Update course - includes all fields from CreateCourseDto as optional
 * Plus additional update-specific fields
 */
export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}

/**
 * For saving course as draft
 */
export class SaveCourseDraftDto extends PartialType(CreateCourseDto) {
  // All fields are optional when saving draft
}

/**
 * For publishing course
 */
export class PublishCourseDto {
  @IsEnum(CourseStatus)
  status: CourseStatus;
}

/**
 * For archiving course
 */
export class ArchiveCourseDto {
  softDelete: boolean;
}
