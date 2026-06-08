import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments';
import { CreateQuestionRequest, Question } from '../models/question.model';

export interface BulkCreateQuestionsResponse {
  totalReceived: number;
  insertedCount: number;
  skippedDuplicatesCount: number;
  errorCount: number;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private readonly apiUrl = `${environment.apiUrl}/questions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Question[]> {
    return this.http.get<Question[]>(this.apiUrl);
  }

  getById(id: number): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/${id}`);
  }

  getByCategoryId(categoryId: number): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/by-category/${categoryId}`);
  }

  create(request: CreateQuestionRequest): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, request);
  }

  bulkCreate(requests: CreateQuestionRequest[]): Observable<BulkCreateQuestionsResponse> {
    return this.http.post<BulkCreateQuestionsResponse>(`${this.apiUrl}/bulk`, requests);
  }
}