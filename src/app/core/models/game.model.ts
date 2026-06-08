export enum HelpOptionType {
  DoublePoints = 1,
  TwoAnswers = 2,
  StopPlayer = 3
}

export interface CreateGameRequest {
  categoryIds: number[];
  teamOneName: string;
  teamTwoName: string;
  helpOptions: HelpOptionType[];
}

export interface GameSetupResponse {
  gameSessionId: string;
  roomCode: string;
  status: string;
  teams: GameTeamDto[];
  categories: GameBoardCategoryDto[];
}

export interface GameTeamDto {
  id: string;
  name: string;
  score: number;
  turnOrder: number;
  helpOptions: string[];
}

export interface GameBoardCategoryDto {
  categoryId: number;
  categoryName: string;
  order: number;
  questions: GameBoardQuestionDto[];
}

export interface GameBoardQuestionDto {
  gameQuestionId: string;
  difficulty: string;
  points: number;
  isUsed: boolean;
}

export interface SelectQuestionRequest {
  gameQuestionId: string;
  useDoublePoints: boolean;
}

export interface GameTurnTeamDto {
  id: string;
  name: string;
  score: number;
  turnOrder: number;
}

export interface SelectedQuestionResponse {
  gameSessionId: string;
  gameTurnId: string;
  gameQuestionId: string;
  categoryId: number;
  categoryName: string;
  questionText: string;
  difficulty: string;
  basePoints: number;
  finalPoints: number;
  isDoublePointsUsed: boolean;
  mainTeamTimerSeconds: number;
  secondTeamTimerSeconds: number;
  status: string;
  mainTeam: GameTurnTeamDto;
  secondTeam: GameTurnTeamDto;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
}

export interface RevealAnswerResponse {
  gameTurnId: string;
  gameQuestionId: string;
  correctAnswer: string;
}

export interface AwardPointsRequest {
  correctTeamId: string | null;
  mainTeamAnswerText?: string | null;
  secondTeamAnswerText?: string | null;
}

export interface AwardPointsResponse {
  gameSessionId: string;
  gameTurnId: string;
  correctTeamId: string | null;
  pointsAwarded: number;
  status: string;
  teams: GameTurnTeamDto[];
}