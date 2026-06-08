import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  GameBoardCategoryDto,
  GameBoardQuestionDto,
  GameSetupResponse,
  RevealAnswerResponse,
  SelectedQuestionResponse
} from '../../../core/models/game.model';
import { GameService } from '../../../core/services/game.service';

const CATEGORY_IMAGE_MAP: Record<number, string> = {
  1: 'assets/category-images/din.svg',
  2: 'assets/category-images/geography.svg',
  3: 'assets/category-images/history.svg',
  4: 'assets/category-images/football.svg',
  5: 'assets/category-images/math.svg',
  6: 'assets/category-images/general.svg',
  7: 'assets/category-images/movies.svg',
  8: 'assets/category-images/science.svg',
  9: 'assets/category-images/technology.svg',
  10: 'assets/category-images/riddles.svg',
  11: 'assets/category-images/egypt_old_days.svg',
12: 'assets/category-images/egyptian_cinema_stars.svg',
13: 'assets/category-images/egyptian_music.svg',
14: 'assets/category-images/egyptian_series.svg',
15: 'assets/category-images/egyptian_proverbs.svg',
16: 'assets/category-images/egyptian_food.svg',
17: 'assets/category-images/egypt_governorates.svg',
18: 'assets/category-images/egypt_landmarks.svg',
19: 'assets/category-images/egyptian_figures.svg',
20: 'assets/category-images/egyptian_dialect.svg',
21: 'assets/category-images/egyptian_sports.svg',
22: 'assets/category-images/inventions.svg',
23: 'assets/category-images/human_body.svg',
24: 'assets/category-images/animals_birds.svg',
25: 'assets/category-images/plants_nature.svg',
26: 'assets/category-images/space_astronomy.svg',
27: 'assets/category-images/video_games.svg',
28: 'assets/category-images/internet_social.svg',
29: 'assets/category-images/brands_companies.svg',
30: 'assets/category-images/cars_transport.svg'
};

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-board.html',
  styleUrl: './game-board.scss'
})
export class GameBoardComponent implements OnInit, OnDestroy {
  gameSessionId = '';
  game: GameSetupResponse | null = null;

  loading = false;
  actionLoading = false;

  errorMessage = '';
  turnErrorMessage = '';
  successMessage = '';

  activeQuestion: SelectedQuestionResponse | null = null;
  revealedAnswer: RevealAnswerResponse | null = null;

  mainTeamAnswerText = '';
  secondTeamAnswerText = '';
  correctTeamId: string | null = null;

  remainingSeconds = 0;
  timerRunning = false;
  timerMode: 'main' | 'second' = 'main';

  selectedPreQuestionHelpType: 'DoublePoints' | null = null;

  private timerRef: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  constructor(
    private route: ActivatedRoute,
    private gameService: GameService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.gameSessionId = this.route.snapshot.paramMap.get('gameSessionId') ?? '';

    if (!this.gameSessionId) {
      this.errorMessage = 'Game Session Id غير موجود.';
      this.detect();
      return;
    }

    this.loadBoard();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearTimer();
  }

  loadBoard(): void {
    this.loading = true;
    this.errorMessage = '';
    this.detect();

    this.gameService.getBoard(this.gameSessionId).subscribe({
      next: (game) => {
        this.game = game;
        this.loading = false;
        this.detect();
      },
      error: () => {
        this.errorMessage = 'حصل خطأ أثناء تحميل لوحة اللعبة.';
        this.loading = false;
        this.detect();
      }
    });
  }

  getCategoryImage(categoryId: number): string {
    return CATEGORY_IMAGE_MAP[categoryId] ?? 'assets/category-images/general.svg';
  }

  openQuestion(
  category: GameBoardCategoryDto,
  question: GameBoardQuestionDto
): void {
  if (question.isUsed || this.activeQuestion || this.actionLoading) {
    return;
  }

  this.turnErrorMessage = '';
  this.successMessage = '';
  this.revealedAnswer = null;
  this.correctTeamId = null;
  this.mainTeamAnswerText = '';
  this.secondTeamAnswerText = '';
  this.actionLoading = true;
  this.detect();

  const useDoublePoints = this.selectedPreQuestionHelpType === 'DoublePoints';

  this.gameService.selectQuestion(this.gameSessionId, {
    gameQuestionId: question.gameQuestionId,
    useDoublePoints
  }).subscribe({
    next: (response) => {
      this.activeQuestion = response;

      question.isUsed = true;

      if (response.isDoublePointsUsed) {
        this.markHelpAsUsed(response.mainTeam.id, 'DoublePoints');
      }

      this.selectedPreQuestionHelpType = null;

      this.actionLoading = false;
      this.startTimer(response.mainTeamTimerSeconds, 'main');

      this.detect();
    },
    error: (error) => {
      this.turnErrorMessage = error?.error || 'حصل خطأ أثناء فتح السؤال.';
      this.actionLoading = false;
      this.detect();
    }
  });
}

  revealAnswer(): void {
    if (!this.activeQuestion || this.actionLoading) {
      return;
    }

    this.actionLoading = true;
    this.turnErrorMessage = '';
    this.detect();

    this.gameService.revealAnswer(
      this.gameSessionId,
      this.activeQuestion.gameTurnId
    ).subscribe({
      next: (response) => {
        this.revealedAnswer = response;
        this.stopTimer();

        this.actionLoading = false;
        this.detect();
      },
      error: (error) => {
        this.turnErrorMessage = error?.error || 'حصل خطأ أثناء كشف الإجابة.';
        this.actionLoading = false;
        this.detect();
      }
    });
  }

  awardPoints(): void {
    if (!this.activeQuestion || this.actionLoading) {
      return;
    }

    if (!this.revealedAnswer) {
      this.turnErrorMessage = 'لازم تكشف الإجابة الأول.';
      this.detect();
      return;
    }

    this.actionLoading = true;
    this.turnErrorMessage = '';
    this.successMessage = '';
    this.detect();

    this.gameService.awardPoints(
      this.gameSessionId,
      this.activeQuestion.gameTurnId,
      {
        correctTeamId: this.correctTeamId,
        mainTeamAnswerText: this.mainTeamAnswerText,
        secondTeamAnswerText: this.secondTeamAnswerText
      }
    ).subscribe({
      next: (response) => {
        this.updateScores(response.teams);

        this.successMessage =
          response.pointsAwarded > 0
            ? `تم إضافة ${response.pointsAwarded} نقطة.`
            : 'تم إنهاء الدور بدون نقاط.';

        this.closeActiveQuestion();

        this.actionLoading = false;
        this.detect();

        this.loadBoard();
      },
      error: (error) => {
        this.turnErrorMessage = error?.error || 'حصل خطأ أثناء إضافة النقاط.';
        this.actionLoading = false;
        this.detect();
      }
    });
  }

  updateScores(teams: { id: string; score: number }[]): void {
    if (!this.game) {
      return;
    }

    for (const updatedTeam of teams) {
      const team = this.game.teams.find(x => x.id === updatedTeam.id);

      if (team) {
        team.score = updatedTeam.score;
      }
    }

    this.detect();
  }

  closeActiveQuestion(): void {
    this.stopTimer();

    this.activeQuestion = null;
    this.revealedAnswer = null;
    this.correctTeamId = null;
    this.mainTeamAnswerText = '';
    this.secondTeamAnswerText = '';
    this.turnErrorMessage = '';
    this.selectedPreQuestionHelpType = null;

    this.detect();
  }

  chooseCorrectTeam(teamId: string | null): void {
    this.correctTeamId = teamId;
    this.detect();
  }

  startMainTimer(): void {
    if (!this.activeQuestion) {
      return;
    }

    this.startTimer(this.activeQuestion.mainTeamTimerSeconds, 'main');
  }

  startSecondTimer(): void {
    if (!this.activeQuestion) {
      return;
    }

    this.startTimer(this.activeQuestion.secondTeamTimerSeconds, 'second');
  }

  startTimer(seconds: number, mode: 'main' | 'second'): void {
    this.clearTimer();

    this.timerMode = mode;
    this.remainingSeconds = seconds;
    this.timerRunning = true;
    this.detect();

    this.timerRef = setInterval(() => {
      if (this.remainingSeconds <= 0) {
        this.stopTimer();
        return;
      }

      this.remainingSeconds--;
      this.detect();
    }, 1000);
  }

  pauseTimer(): void {
    if (!this.timerRunning) {
      return;
    }

    this.timerRunning = false;
    this.clearTimer();
    this.detect();
  }

  resumeTimer(): void {
    if (this.remainingSeconds <= 0 || this.timerRunning) {
      return;
    }

    this.timerRunning = true;
    this.detect();

    this.timerRef = setInterval(() => {
      if (this.remainingSeconds <= 0) {
        this.stopTimer();
        return;
      }

      this.remainingSeconds--;
      this.detect();
    }, 1000);
  }

  resetCurrentTimer(): void {
    if (!this.activeQuestion) {
      return;
    }

    const seconds =
      this.timerMode === 'main'
        ? this.activeQuestion.mainTeamTimerSeconds
        : this.activeQuestion.secondTeamTimerSeconds;

    this.startTimer(seconds, this.timerMode);
  }

  stopTimer(): void {
    this.timerRunning = false;
    this.clearTimer();
    this.detect();
  }

  private clearTimer(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  private detect(): void {
    if (!this.destroyed) {
      this.cdr.detectChanges();
    }
  }

  get timerLabel(): string {
    return this.timerMode === 'main'
      ? 'تايمر الفريق الأساسي'
      : 'تايمر الفريق الثاني';
  }

  trackByCategoryId(index: number, category: GameBoardCategoryDto): number {
    return category.categoryId;
  }

  trackByQuestionId(index: number, question: GameBoardQuestionDto): string {
    return question.gameQuestionId;
  }

  isCurrentTurnTeam(teamId: string): boolean {
  return this.game?.currentTurnTeamId === teamId;
}

canUseHelpOption(teamId: string, helpType: string, isUsed: boolean): boolean {
  if (!this.game) {
    return false;
  }

  if (!this.isCurrentTurnTeam(teamId)) {
    return false;
  }

  if (isUsed || this.activeQuestion || this.actionLoading) {
    return false;
  }

  return helpType === 'DoublePoints';
}

togglePreQuestionHelp(teamId: string, helpType: string, isUsed: boolean): void {
  if (!this.canUseHelpOption(teamId, helpType, isUsed)) {
    return;
  }

  this.selectedPreQuestionHelpType =
    this.selectedPreQuestionHelpType === 'DoublePoints'
      ? null
      : 'DoublePoints';

  this.detect();
}

isHelpSelected(teamId: string, helpType: string): boolean {
  return (
    this.isCurrentTurnTeam(teamId) &&
    helpType === 'DoublePoints' &&
    this.selectedPreQuestionHelpType === 'DoublePoints'
  );
}

getHelpIcon(helpType: string): string {
  switch (helpType) {
    case 'DoublePoints':
      return '⚡';
    case 'TwoAnswers':
      return '✌️';
    case 'StopPlayer':
      return '🛑';
    default:
      return '🎁';
  }
}

markHelpAsUsed(teamId: string, helpType: string): void {
  const team = this.game?.teams.find(x => x.id === teamId);

  if (!team) {
    return;
  }

  const help = team.helpOptions.find(x => x.type === helpType);

  if (help) {
    help.isUsed = true;
    help.usedAt = new Date().toISOString();
  }
}

getTeamHelpOption(teamId: string, helpType: string) {
  const team = this.game?.teams.find(x => x.id === teamId);

  if (!team) {
    return null;
  }

  return team.helpOptions.find(x => x.type === helpType) ?? null;
}

canUseTwoAnswers(): boolean {
  if (!this.activeQuestion || this.revealedAnswer || this.actionLoading) {
    return false;
  }

  const help = this.getTeamHelpOption(
    this.activeQuestion.mainTeam.id,
    'TwoAnswers'
  );

  return !!help && !help.isUsed;
}

canUseStopPlayer(): boolean {
  if (!this.activeQuestion || this.revealedAnswer || this.actionLoading) {
    return false;
  }

  const help = this.getTeamHelpOption(
    this.activeQuestion.secondTeam.id,
    'StopPlayer'
  );

  return !!help && !help.isUsed;
}

useTwoAnswers(): void {
  if (!this.activeQuestion || !this.canUseTwoAnswers()) {
    return;
  }

  this.useTurnHelpOption(
    this.activeQuestion.mainTeam.id,
    'TwoAnswers'
  );
}

useStopPlayer(): void {
  if (!this.activeQuestion || !this.canUseStopPlayer()) {
    return;
  }

  this.useTurnHelpOption(
    this.activeQuestion.secondTeam.id,
    'StopPlayer'
  );
}

useTurnHelpOption(teamId: string, helpType: 'TwoAnswers' | 'StopPlayer'): void {
  if (!this.activeQuestion) {
    return;
  }

  this.actionLoading = true;
  this.turnErrorMessage = '';
  this.detect();

  this.gameService.useHelpOption(
    this.gameSessionId,
    this.activeQuestion.gameTurnId,
    {
      teamId,
      type: helpType,
      playerId: null
    }
  ).subscribe({
    next: (response) => {
      this.markHelpAsUsed(response.teamId, response.type);

      if (response.type === 'TwoAnswers') {
        this.successMessage = 'تم تفعيل مساعدة إجابتين للفريق اللي عليه الدور.';
      }

      if (response.type === 'StopPlayer') {
        this.successMessage = 'تم تفعيل مساعدة إيقاف لاعب للفريق المنافس.';
      }

      this.actionLoading = false;
      this.detect();
    },
    error: (error) => {
      this.turnErrorMessage = error?.error || 'حصل خطأ أثناء استخدام وسيلة المساعدة.';
      this.actionLoading = false;
      this.detect();
    }
  });
}

isTwoAnswersUsed(): boolean {
  if (!this.activeQuestion) {
    return false;
  }

  return !!this.getTeamHelpOption(
    this.activeQuestion.mainTeam.id,
    'TwoAnswers'
  )?.isUsed;
}

isStopPlayerUsed(): boolean {
  if (!this.activeQuestion) {
    return false;
  }

  return !!this.getTeamHelpOption(
    this.activeQuestion.secondTeam.id,
    'StopPlayer'
  )?.isUsed;
}
}