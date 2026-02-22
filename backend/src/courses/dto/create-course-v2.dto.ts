import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum CourseLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PRIVATE = 'PRIVATE',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED',
}

/**
 * Step 1: Basic Course Information
 * User enters title, subtitle, description, category, language, level
 */
export class CreateCourseBasicDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Title must be at least 5 characters' })
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Subtitle must not exceed 200 characters' })
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(50, { message: 'Description must be at least 50 characters' })
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  description: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Category is required' })
  category: string;

  @IsEnum(CourseLevel)
  @IsNotEmpty()
  level: CourseLevel;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  language?: string = 'en';

  @IsArray()
  @IsOptional()
  @MaxLength(10, { message: 'Maximum 10 tags allowed' })
  tags?: string[];

  @IsInt()
  @IsNotEmpty()
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  @Max(1000, { message: 'Duration must not exceed 1000 hours' })
  duration: number; // in minutes
}

/**
 * Step 2: Media & Assets
 * Upload course thumbnail, intro video
 */
export class CreateCoursMediaDto {
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl()
  introVideoUrl?: string;
}

/**
 * Step 3: Pricing Configuration
 * Set pricing, discounts, payment options
 */
export class CreateCoursePricingDto {
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean = false;

  @IsNumber()
  @Min(0)
  @Max(99999)
  @IsOptional()
  @Type(() => Number)
  price?: number = 0;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string = 'USD';

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  discountPercentage?: number = 0;

  @IsISO8601()
  @IsOptional()
  discountEndDate?: string;
}

/**
 * Step 4: SEO & Publishing
 * Configure SEO settings, publish status, scheduling
 */
export class CreateCoursePublishingDto {
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus = CourseStatus.DRAFT;

  @IsISO8601()
  @IsOptional()
  scheduledPublishDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  seoTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  seoDescription?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'URL slug must be a valid slug format (lowercase letters, numbers, and hyphens)',
  })
  urlSlug?: string;

  @IsUrl()
  @IsOptional()
  ogImageUrl?: string;
}

/**
 * Complete course creation DTO combining all steps
 */
export class CreateCourseDto
  implements
    CreateCourseBasicDto,
    CreateCoursMediaDto,
    CreateCoursePricingDto,
    CreateCoursePublishingDto
{
  // Basic Info
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  subtitle?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(CourseLevel)
  @IsNotEmpty()
  level: CourseLevel;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  language?: string = 'en';

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsInt()
  @IsNotEmpty()
  @Min(15)
  @Max(1000)
  duration: number;

  // Media
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsUrl()
  introVideoUrl?: string;

  // Pricing
  @IsBoolean()
  @IsOptional()
  isPremium?: boolean = false;

  @IsNumber()
  @Min(0)
  @Max(99999)
  @IsOptional()
  @Type(() => Number)
  price?: number = 0;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string = 'USD';

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  discountPercentage?: number = 0;

  @IsISO8601()
  @IsOptional()
  discountEndDate?: string;

  // Publishing
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus = CourseStatus.DRAFT;

  @IsISO8601()
  @IsOptional()
  scheduledPublishDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  seoTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  seoDescription?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'URL slug must be a valid slug format (lowercase letters, numbers, and hyphens)',
  })
  urlSlug?: string;

  @IsUrl()
  @IsOptional()
  ogImageUrl?: string;
}
