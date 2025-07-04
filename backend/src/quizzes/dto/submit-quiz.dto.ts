import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsArray()
  answers: {
    questionId: string;
    selectedAnswer: string;
  }[];
}
