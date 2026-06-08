export enum QuestionDifficulty {
  Easy = 1,
  Medium = 2,
  Hard = 3
}

export interface Question {
  id: number;
  categoryId: number;
  categoryName: string;
  text: string;
  correctAnswer: string;
  difficulty: QuestionDifficulty;
  difficultyName: string;
  points: number;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  isActive: boolean;
}

export interface CreateQuestionRequest {
  categoryId: number;
  text: string;
  correctAnswer: string;
  difficulty: QuestionDifficulty;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
}