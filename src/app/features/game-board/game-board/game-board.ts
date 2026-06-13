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
import { FinalRoundService } from '../../../core/services/final-round.service';
import {
  CompleteFinalRoundRequest,
  FinalRoundStateResponse,
  LockFinalRoundWagersRequest
} from '../../../core/models/final-round.model';
import { getCategoryImagePath } from '../../../core/constants/category-image-map';

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
  timerMode: 'main' | 'second' | 'final' = 'main';
  
  selectedPreQuestionHelpType: 'DoublePoints' | null = null;
  trapUsedForActiveQuestion = false;

  finalRound: FinalRoundStateResponse | null = null;
  finalRoundWagers: Record<string, number | null> = {};
  finalRoundAnswers: Record<string, string> = {};
  finalRoundCorrectness: Record<string, boolean | null> = {};
  finalRoundErrorMessage = '';
  finalRoundSuccessMessage = '';

  private timerRef: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  constructor(
    private route: ActivatedRoute,
    private gameService: GameService,
    private finalRoundService: FinalRoundService,
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

        if (this.isBoardCompleted) {
          this.loadFinalRound();
        }

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
    return getCategoryImagePath(categoryId) ?? 'assets/category-images/general.svg';
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
  this.trapUsedForActiveQuestion = false;
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

        if (response.pointsAwarded > 0) {
          this.successMessage = `تم إضافة ${response.pointsAwarded} نقطة.`;
        } else if (response.pointsAwarded < 0) {
          this.successMessage = `تم خصم ${Math.abs(response.pointsAwarded)} نقطة.`;
        } else {
          this.successMessage = 'تم إنهاء الدور بدون نقاط.';
        }

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




  awardPointsForTeam(teamId: string | null): void {
    if (!this.activeQuestion || this.actionLoading) {
      return;
    }

    if (!this.revealedAnswer) {
      this.turnErrorMessage = 'لازم تكشف الإجابة الأول.';
      this.detect();
      return;
    }

    this.correctTeamId = teamId;
    this.awardPoints();
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

  startTimer(seconds: number, mode: 'main' | 'second' | 'final'): void {
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
    if (this.timerMode === 'final') {
      if (!this.finalRound) {
        return;
      }

      this.startTimer(this.finalRound.timerSeconds, 'final');
      return;
    }

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
    if (this.timerMode === 'final') {
      return 'تايمر الجولة النهائية';
    }

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
    case 'Trap':
      return '🪤';    
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

canUseTrap(): boolean {
  if (!this.activeQuestion || this.revealedAnswer || this.actionLoading) {
    return false;
  }

  const help = this.getTeamHelpOption(
    this.activeQuestion.mainTeam.id,
    'Trap'
  );

  return !!help && !help.isUsed && !this.trapUsedForActiveQuestion;
}

useTrap(): void {
  if (!this.activeQuestion || !this.canUseTrap()) {
    return;
  }

  this.useTurnHelpOption(
    this.activeQuestion.mainTeam.id,
    'Trap'
  );
}

isTrapUsed(): boolean {
  return this.trapUsedForActiveQuestion;
}

useTurnHelpOption(teamId: string, helpType: 'TwoAnswers' | 'StopPlayer' | 'Trap'): void {
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

      if (response.type === 'Trap') {
        this.trapUsedForActiveQuestion = true;

        this.successMessage =
          `تم تفعيل الفخ. السؤال اتحول للفريق المنافس: ${this.activeQuestion?.secondTeam.name}.`;

        this.startSecondTimer();
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

get isBoardCompleted(): boolean {
  const categories = this.game?.categories ?? [];

  return (
    categories.length > 0 &&
    categories.every(category =>
      category.questions.length > 0 &&
      category.questions.every(question => question.isUsed)
    )
  );
}

get canStartFinalRound(): boolean {
  return (
    this.isBoardCompleted &&
    !this.finalRound &&
    !this.activeQuestion &&
    !this.loading &&
    !this.actionLoading
  );
}

get canLockFinalRoundWagers(): boolean {
  return (
    this.finalRound?.status === 'WaitingForWagers' &&
    !this.actionLoading
  );
}

get canRevealFinalQuestion(): boolean {
  return (
    this.finalRound?.status === 'WagersLocked' &&
    !this.actionLoading
  );
}

get canRevealFinalAnswer(): boolean {
  return (
    this.finalRound?.status === 'QuestionRevealed' &&
    !this.actionLoading
  );
}

get canCompleteFinalRound(): boolean {
  if (
    this.finalRound?.status !== 'AnswerRevealed' ||
    this.actionLoading
  ) {
    return false;
  }

  return this.finalRound.teams.every(
    team => this.finalRoundCorrectness[team.teamId] !== null &&
            this.finalRoundCorrectness[team.teamId] !== undefined
  );
}

loadFinalRound(): void {
  if (!this.gameSessionId) {
    return;
  }

  this.finalRoundService.getFinalRound(this.gameSessionId).subscribe({
    next: (response) => {
      this.applyFinalRoundState(response);
      this.detect();
    },
    error: (error) => {
      if (error?.status !== 404) {
        this.finalRoundErrorMessage =
          error?.error || 'حصل خطأ أثناء تحميل الجولة النهائية.';
      }

      this.detect();
    }
  });
}

startFinalRound(): void {
  if (!this.canStartFinalRound) {
    return;
  }

  this.actionLoading = true;
  this.finalRoundErrorMessage = '';
  this.finalRoundSuccessMessage = '';
  this.detect();

  this.finalRoundService.startFinalRound(this.gameSessionId).subscribe({
    next: (response) => {
      this.applyFinalRoundState(response);
      this.finalRoundSuccessMessage =
        `بدأت الجولة النهائية. التصنيف: ${response.categoryName}`;
      this.actionLoading = false;
      this.detect();
    },
    error: (error) => {
      this.finalRoundErrorMessage =
        error?.error || 'حصل خطأ أثناء بدء الجولة النهائية.';
      this.actionLoading = false;
      this.detect();
    }
  });
}

lockFinalRoundWagers(): void {
  if (!this.finalRound || !this.canLockFinalRoundWagers) {
    return;
  }

  const teams: LockFinalRoundWagersRequest['teams'] = [];

  for (const team of this.finalRound.teams) {
    const wager = Number(this.finalRoundWagers[team.teamId] ?? 0);
    const maximumWager = Math.max(team.currentScore, 0);

    if (!Number.isInteger(wager) || wager < 0 || wager > maximumWager) {
      this.finalRoundErrorMessage =
        `رهان ${team.teamName} لازم يكون رقم صحيح من 0 إلى ${maximumWager}.`;
      this.detect();
      return;
    }

    teams.push({
      teamId: team.teamId,
      wager
    });
  }

  const request: LockFinalRoundWagersRequest = { teams };

  this.actionLoading = true;
  this.finalRoundErrorMessage = '';
  this.finalRoundSuccessMessage = '';
  this.detect();

  this.finalRoundService.lockWagers(
    this.gameSessionId,
    this.finalRound.finalRoundId,
    request
  ).subscribe({
    next: (response) => {
      this.applyFinalRoundState(response);
      this.finalRoundSuccessMessage = 'تم تثبيت رهانات الفريقين.';
      this.actionLoading = false;
      this.detect();
    },
    error: (error) => {
      this.finalRoundErrorMessage =
        error?.error || 'حصل خطأ أثناء تثبيت الرهانات.';
      this.actionLoading = false;
      this.detect();
    }
  });
}

revealFinalQuestion(): void {
  if (!this.finalRound || !this.canRevealFinalQuestion) {
    return;
  }

  this.actionLoading = true;
  this.finalRoundErrorMessage = '';
  this.finalRoundSuccessMessage = '';
  this.detect();

  this.finalRoundService.revealQuestion(
    this.gameSessionId,
    this.finalRound.finalRoundId
  ).subscribe({
    next: (response) => {
      this.applyFinalRoundState(response);
      this.finalRoundSuccessMessage = 'تم كشف سؤال الجولة النهائية.';
      this.actionLoading = false;
      this.detect();
    },
    error: (error) => {
      this.finalRoundErrorMessage =
        error?.error || 'حصل خطأ أثناء كشف سؤال الجولة النهائية.';
      this.actionLoading = false;
      this.detect();
    }
  });
}

revealFinalAnswer(): void {
  if (!this.finalRound || !this.canRevealFinalAnswer) {
    return;
  }

  this.actionLoading = true;
  this.finalRoundErrorMessage = '';
  this.finalRoundSuccessMessage = '';
  this.detect();

  this.finalRoundService.revealAnswer(
    this.gameSessionId,
    this.finalRound.finalRoundId
  ).subscribe({
    next: (response) => {
      this.stopTimer();
      this.applyFinalRoundState(response);
      this.finalRoundSuccessMessage = 'تم كشف الإجابة الصحيحة.';
      this.actionLoading = false;
      this.detect();
    },
    error: (error) => {
      this.finalRoundErrorMessage =
        error?.error || 'حصل خطأ أثناء كشف الإجابة.';
      this.actionLoading = false;
      this.detect();
    }
  });
}

setFinalRoundCorrectness(teamId: string, isCorrect: boolean): void {
  if (this.finalRound?.status !== 'AnswerRevealed') {
    return;
  }

  this.finalRoundCorrectness[teamId] = isCorrect;
  this.detect();
}

completeFinalRound(): void {
  if (!this.finalRound || !this.canCompleteFinalRound) {
    return;
  }

  const request: CompleteFinalRoundRequest = {
    teams: this.finalRound.teams.map(team => ({
      teamId: team.teamId,
      answerText: this.finalRoundAnswers[team.teamId]?.trim() || null,
      isCorrect: this.finalRoundCorrectness[team.teamId] === true
    }))
  };

  this.actionLoading = true;
  this.finalRoundErrorMessage = '';
  this.finalRoundSuccessMessage = '';
  this.detect();

  this.finalRoundService.completeFinalRound(
    this.gameSessionId,
    this.finalRound.finalRoundId,
    request
  ).subscribe({
    next: (response) => {
      this.applyFinalRoundState(response);

      this.updateScores(
        response.teams.map(team => ({
          id: team.teamId,
          score: team.currentScore
        }))
      );

      this.finalRoundSuccessMessage = response.isDraw
        ? 'انتهت الجولة النهائية بالتعادل.'
        : `الفائز هو ${response.winnerTeamName}.`;

      this.actionLoading = false;
      this.detect();
    },
    error: (error) => {
      this.finalRoundErrorMessage =
        error?.error || 'حصل خطأ أثناء إنهاء الجولة النهائية.';
      this.actionLoading = false;
      this.detect();
    }
  });
}

getMaximumFinalRoundWager(teamId: string): number {
  const team = this.finalRound?.teams.find(x => x.teamId === teamId);
  return Math.max(team?.currentScore ?? 0, 0);
}

private applyFinalRoundState(response: FinalRoundStateResponse): void {
  this.finalRound = response;

  for (const team of response.teams) {
    if (team.wager !== null) {
      this.finalRoundWagers[team.teamId] = team.wager;
    } else if (this.finalRoundWagers[team.teamId] === undefined) {
      this.finalRoundWagers[team.teamId] = 0;
    }

    if (team.answerText !== null) {
      this.finalRoundAnswers[team.teamId] = team.answerText;
    } else if (this.finalRoundAnswers[team.teamId] === undefined) {
      this.finalRoundAnswers[team.teamId] = '';
    }

    if (team.isCorrect !== null) {
      this.finalRoundCorrectness[team.teamId] = team.isCorrect;
    } else if (this.finalRoundCorrectness[team.teamId] === undefined) {
      this.finalRoundCorrectness[team.teamId] = null;
    }
  }

  if (
    response.status === 'QuestionRevealed' &&
    response.questionRevealedAt
  ) {
    const startedAt = new Date(response.questionRevealedAt).getTime();
    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
    const secondsLeft = Math.max(
      response.timerSeconds - elapsedSeconds,
      0
    );

    this.startTimer(secondsLeft, 'final');
  }
}

setHalfFinalRoundWager(teamId: string): void {
  const maximumWager = this.getMaximumFinalRoundWager(teamId);

  this.finalRoundWagers[teamId] = Math.floor(maximumWager / 2);

  this.detect();
}

adjustTeamScore(teamId: string, pointsDelta: 100 | -100): void {
  if (!this.game || this.actionLoading) {
    return;
  }

  this.actionLoading = true;
  this.turnErrorMessage = '';
  this.errorMessage = '';
  this.detect();

  this.gameService.adjustScore(this.gameSessionId, {
    teamId,
    pointsDelta
  }).subscribe({
    next: (response) => {
      this.updateScores(response.teams);

      this.successMessage =
        pointsDelta > 0
          ? 'تم إضافة 100 نقطة.'
          : 'تم خصم 100 نقطة.';

      this.actionLoading = false;
      this.detect();
    },
    error: (error) => {
      this.turnErrorMessage =
        error?.error || 'حصل خطأ أثناء تعديل النقاط.';

      this.actionLoading = false;
      this.detect();
    }
  });
}
}