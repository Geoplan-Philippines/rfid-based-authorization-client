import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';
import {
  GateEventResult,
  TransactionDetail,
  TransactionEventType,
  TransactionListItem,
  TransactionListMeta,
  TransactionListResult,
  TransactionStreamEvent,
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

  /**
   * Factory function for EventSource, allowing override or mocking in unit test environments.
   */
  createEventSource(url: string): EventSource {
    return new EventSource(url);
  }

  /**
   * Subscribes to the server-sent EventStream for real-time transaction updates (GEO-101).
   * Emits `transaction.created` and `transaction.updated` events as they occur on the server.
   * Automatically handles reconnects if the connection drops.
   */
  getTransactionStream(eventType?: TransactionEventType): Observable<TransactionStreamEvent> {
    const url = eventType
      ? `${this.TRANSACTIONS_URL}/stream?type=${encodeURIComponent(eventType)}`
      : `${this.TRANSACTIONS_URL}/stream`;

    return new Observable<TransactionStreamEvent>(subscriber => {
      if (typeof EventSource === 'undefined') {
        return () => {};
      }

      let eventSource: EventSource | null = null;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
      let isDisposed = false;

      const connect = () => {
        if (isDisposed) return;
        eventSource = this.createEventSource(url);

        const handleMessage = (event: MessageEvent) => {
          try {
            const parsed = JSON.parse(event.data);
            if (!parsed) return;

            let item: TransactionListItem | null = null;
            if (parsed.data && typeof parsed.data === 'object' && 'id' in parsed.data) {
              item = parsed.data as TransactionListItem;
            } else if (parsed.id) {
              item = parsed as TransactionListItem;
            }

            if (!item) return;

            const type: TransactionEventType =
              parsed.type || (event.type as TransactionEventType) || 'transaction.created';

            subscriber.next({ type, data: item });
          } catch (err) {
            console.warn('[TransactionService] Failed to parse EventStream event:', err);
          }
        };

        eventSource.addEventListener('transaction.created', handleMessage);
        eventSource.addEventListener('transaction.updated', handleMessage);
        eventSource.onmessage = handleMessage;

        eventSource.onerror = err => {
          console.warn('[TransactionService] EventStream connection dropped, reconnecting in 3s...', err);
          eventSource?.close();
          eventSource = null;
          if (!isDisposed) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };
      };

      connect();

      return () => {
        isDisposed = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    });
  }
}
