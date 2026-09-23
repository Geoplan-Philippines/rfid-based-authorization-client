import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../../../core/types/api-response.types';
import {
  ExpresswayTagDetail,
  ExpresswayTagListItem,
  ExpresswayTagStatus,
  ExpresswayTagStatusCounts,
  GetExpresswayTagsParams,
} from '../types/expressway-tags.types';

export interface ExpresswayTagListResult extends PaginatedResult<ExpresswayTagListItem> {
  meta: PaginatedResult<ExpresswayTagListItem>['meta'] & { counts: ExpresswayTagStatusCounts };
}

export interface CreateExpresswayTagPayload {
  epcId: string;
  label?: string;
  truckId?: string;
  status?: ExpresswayTagStatus;
}

export interface UpdateExpresswayTagPayload {
  label?: string;
  truckId?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpresswayTagsService {
  private http = inject(HttpClient);
  private readonly URL = `${environment.apiBaseUrl}/expressway-tags`;

  getTags(params: GetExpresswayTagsParams): Observable<ExpresswayTagListResult> {
    let httpParams = new HttpParams().set('page', params.page).set('limit', params.limit);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<ExpresswayTagListResult>(this.URL, { params: httpParams });
  }

  getTag(id: string): Observable<ExpresswayTagDetail> {
    return this.http
      .get<ApiResponse<ExpresswayTagDetail>>(`${this.URL}/${id}`)
      .pipe(map(response => response.data));
  }

  findByEpc(epcId: string): Observable<ExpresswayTagDetail> {
    return this.http
      .get<ApiResponse<ExpresswayTagDetail>>(`${this.URL}/by-epc/${epcId}`)
      .pipe(map(response => response.data));
  }

  create(payload: CreateExpresswayTagPayload): Observable<ExpresswayTagDetail> {
    return this.http
      .post<ApiResponse<ExpresswayTagDetail>>(this.URL, payload)
      .pipe(map(response => response.data));
  }

  update(id: string, payload: UpdateExpresswayTagPayload): Observable<ExpresswayTagDetail> {
    return this.http
      .patch<ApiResponse<ExpresswayTagDetail>>(`${this.URL}/${id}`, payload)
      .pipe(map(response => response.data));
  }

  updateStatus(id: string, status: ExpresswayTagStatus, reason?: string): Observable<ExpresswayTagDetail> {
    return this.http
      .patch<ApiResponse<ExpresswayTagDetail>>(`${this.URL}/${id}/status`, { status, reason })
      .pipe(map(response => response.data));
  }
}
