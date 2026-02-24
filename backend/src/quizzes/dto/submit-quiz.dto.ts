import { IsString, IsNotEmpty, IsOptional, IsUrl, IsIn } from 'class-validator';

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsUrl()
  @IsNotEmpty()
  projectLink: string;

  @IsString()
  @IsIn(['github', 'demo', 'social', 'video', 'other'])
  linkType: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  moduleIndex?: string;

  @IsString()
  @IsOptional()
  topicIndex?: string;
}

export class QuizSubmissionStatusDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsString()
  @IsOptional()
  moduleIndex?: string;

  @IsString()
  @IsOptional()
  topicIndex?: string;
}
