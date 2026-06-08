import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments';
import {
  AdjustTeamScoreRequest,
  AdjustTeamScoreResponse,
  AwardPointsRequest,
  AwardPointsResponse,
  CreateGameRequest,
  GameSetupResponse,
  RevealAnswerResponse,
  SelectedQuestionResponse,
  SelectQuestionRequest,
  UseHelpOptionRequest,
  UseHelpOptionResponse
} from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly apiUrl = `${environment.apiUrl}/games`;

  constructor(private http: HttpClient) {}

  setupGame(request: CreateGameRequest): Observable<GameSetupResponse> {
    return this.http.post<GameSetupResponse>(`${this.apiUrl}/setup`, request);
  }

  getBoard(gameSessionId: string): Observable<GameSetupResponse> {
    return this.http.get<GameSetupResponse>(`${this.apiUrl}/${gameSessionId}/board`);
  }

  selectQuestion(
    gameSessionId: string,
    request: SelectQuestionRequest
  ): Observable<SelectedQuestionResponse> {
    return this.http.post<SelectedQuestionResponse>(
      `${this.apiUrl}/${gameSessionId}/select-question`,
      request
    );
  }

  revealAnswer(
    gameSessionId: string,
    gameTurnId: string
  ): Observable<RevealAnswerResponse> {
    return this.http.post<RevealAnswerResponse>(
      `${this.apiUrl}/${gameSessionId}/turns/${gameTurnId}/reveal-answer`,
      {}
    );
  }

  awardPoints(
    gameSessionId: string,
    gameTurnId: string,
    request: AwardPointsRequest
  ): Observable<AwardPointsResponse> {
    return this.http.post<AwardPointsResponse>(
      `${this.apiUrl}/${gameSessionId}/turns/${gameTurnId}/award-points`,
      request
    );
  }

  useHelpOption(
    gameSessionId: string,
    gameTurnId: string,
    request: UseHelpOptionRequest
    ): Observable<UseHelpOptionResponse> {
    return this.http.post<UseHelpOptionResponse>(
        `${this.apiUrl}/${gameSessionId}/turns/${gameTurnId}/use-help-option`,
        request
    );
    }

    adjustScore(
      gameSessionId: string,
      request: AdjustTeamScoreRequest
    ): Observable<AdjustTeamScoreResponse> {
      return this.http.post<AdjustTeamScoreResponse>(
        `${this.apiUrl}/${gameSessionId}/adjust-score`,
        request
      );
    }
}