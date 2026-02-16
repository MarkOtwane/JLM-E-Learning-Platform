import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum CourseLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(CourseLevel)
  level: CourseLevel;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsInt()
  @Min(1)
  duration: number; // in minutes

  @IsBoolean()
  @IsOptional()
  isPremium?: boolean = false;

  @IsNumber()
  @Min(0)
  @Max(10000)
  @IsOptional()
  price?: number = 0;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';
}
