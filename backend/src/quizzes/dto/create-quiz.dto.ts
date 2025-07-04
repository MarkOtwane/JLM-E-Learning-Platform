import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class QuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsString()
  @IsNotEmpty()
  correctAnswer: string;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];
}
