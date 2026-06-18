import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';
import {
  GateEventResult,
  TransactionDetail,
  TransactionListItem,
  TransactionListMeta,
  TransactionListResult,
} from '../types/transaction.types';

export interface GetTransactionsParams {
  page: number;
  limit: number;
  search?: string;
  result?: GateEventResult;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private readonly TRANSACTIONS_URL = `${environment.apiBaseUrl}/transactions`;

  getTransactions(params: GetTransactionsParams): Observable<TransactionListResult> {
    const httpParams: Record<string, string | number> = { page: params.page, limit: params.limit };
    if (params.search) httpParams['search'] = params.search;
    if (params.result) httpParams['result'] = params.result;

    return this.http
      .get<ApiResponse<TransactionListItem[]> & { meta: TransactionListMeta }>(this.TRANSACTIONS_URL, { params: httpParams })
      .pipe(map(({ data, meta }) => ({ data, meta })));
  }

  getTransactionById(id: string): Observable<TransactionDetail> {
    return this.http
      .get<ApiResponse<TransactionDetail>>(`${this.TRANSACTIONS_URL}/${id}`)
      .pipe(map(({ data }) => data));
  }
}
