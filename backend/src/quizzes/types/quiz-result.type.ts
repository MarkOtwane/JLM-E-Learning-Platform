export type QuizResult = {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  breakdown: {
    questionId: string;
    isCorrect: boolean;
    selectedAnswer: string;
    correctAnswer: string;
  }[];
};
