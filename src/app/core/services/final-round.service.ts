import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments';

import {
  CompleteFinalRoundRequest,
  FinalRoundStateResponse,
  LockFinalRoundWagersRequest
} from '../models/final-round.model';

@Injectable({
  providedIn: 'root'
})
export class FinalRoundService {

private readonly apiUrl = `${environment.apiUrl}/games`;

  constructor(private http: HttpClient) {}

  startFinalRound(
    gameSessionId: string
  ): Observable<FinalRoundStateResponse> {
    return this.http.post<FinalRoundStateResponse>(
      `${this.apiUrl}/${gameSessionId}/final-round/start`,
      {}
    );
  }

  getFinalRound(
    gameSessionId: string
  ): Observable<FinalRoundStateResponse> {
    return this.http.get<FinalRoundStateResponse>(
      `${this.apiUrl}/${gameSessionId}/final-round`
    );
  }

  lockWagers(
    gameSessionId: string,
    finalRoundId: string,
    request: LockFinalRoundWagersRequest
  ): Observable<FinalRoundStateResponse> {
    return this.http.post<FinalRoundStateResponse>(
      `${this.apiUrl}/${gameSessionId}/final-round/${finalRoundId}/lock-wagers`,
      request
    );
  }

  revealQuestion(
    gameSessionId: string,
    finalRoundId: string
  ): Observable<FinalRoundStateResponse> {
    return this.http.post<FinalRoundStateResponse>(
      `${this.apiUrl}/${gameSessionId}/final-round/${finalRoundId}/reveal-question`,
      {}
    );
  }

  revealAnswer(
    gameSessionId: string,
    finalRoundId: string
  ): Observable<FinalRoundStateResponse> {
    return this.http.post<FinalRoundStateResponse>(
      `${this.apiUrl}/${gameSessionId}/final-round/${finalRoundId}/reveal-answer`,
      {}
    );
  }

  completeFinalRound(
    gameSessionId: string,
    finalRoundId: string,
    request: CompleteFinalRoundRequest
  ): Observable<FinalRoundStateResponse> {
    return this.http.post<FinalRoundStateResponse>(
      `${this.apiUrl}/${gameSessionId}/final-round/${finalRoundId}/complete`,
      request
    );
  }
}