export enum HelpOptionType {
  DoublePoints = 1,
  TwoAnswers = 2,
  StopPlayer = 3,
  Trap = 4
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

  currentTurnTeamId?: string | null;
  currentTurnTeamName?: string | null;
  currentTurnOrder?: number | null;

  teams: GameTeamDto[];
  categories: GameBoardCategoryDto[];
}

export interface GameTeamDto {
  id: string;
  name: string;
  score: number;
  turnOrder: number;
  helpOptions: TeamHelpOptionDto[];
}

export interface TeamHelpOptionDto {
  id: string;
  type: 'DoublePoints' | 'TwoAnswers' | 'StopPlayer' | string;
  title: string;
  isUsed: boolean;
  usedAt?: string | null;
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

export interface UseHelpOptionRequest {
  teamId: string;
  type: 'TwoAnswers' | 'StopPlayer' | 'Trap' | string;
  playerId?: string | null;
}

export interface UseHelpOptionResponse {
  gameTurnId: string;
  teamId: string;
  type: string;
  title: string;
  isUsed: boolean;
  usedAt: string;
}

export interface AdjustTeamScoreRequest {
  teamId: string;
  pointsDelta: 100 | -100;
}

export interface AdjustTeamScoreResponse {
  gameSessionId: string;
  teamId: string;
  pointsDelta: number;
  newScore: number;
  teams: GameTurnTeamDto[];
}