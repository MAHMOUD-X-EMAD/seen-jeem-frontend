export type FinalRoundStatus =
  | 'WaitingForWagers'
  | 'WagersLocked'
  | 'QuestionRevealed'
  | 'AnswerRevealed'
  | 'Completed';

export interface FinalRoundTeamStateDto {
  teamId: string;
  teamName: string;

  scoreBeforeFinalRound: number;
  currentScore: number;

  wager: number | null;
  isWagerLocked: boolean;

  answerText: string | null;
  isCorrect: boolean | null;

  scoreDelta: number;
}

export interface FinalRoundStateResponse {
  finalRoundId: string;
  gameSessionId: string;

  status: FinalRoundStatus;

  categoryName: string;
  timerSeconds: number;

  questionText: string | null;
  correctAnswer: string | null;

  imageUrl: string | null;
  audioUrl: string | null;

  createdAt: string;
  wagersLockedAt: string | null;
  questionRevealedAt: string | null;
  answerRevealedAt: string | null;
  completedAt: string | null;

  winnerTeamId: string | null;
  winnerTeamName: string | null;
  isDraw: boolean;

  teams: FinalRoundTeamStateDto[];
}

export interface FinalRoundTeamWagerRequest {
  teamId: string;
  wager: number;
}

export interface LockFinalRoundWagersRequest {
  teams: FinalRoundTeamWagerRequest[];
}

export interface FinalRoundTeamAnswerRequest {
  teamId: string;
  answerText: string | null;
  isCorrect: boolean;
}

export interface CompleteFinalRoundRequest {
  teams: FinalRoundTeamAnswerRequest[];
}