import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';
import {
  DailySummaryData,
  ExceptionResult,
  ExceptionsListResult,
  ExceptionsMeta,
  ExceptionReportItem,
  MonthlyBreakdownData,
  PeakHoursData,
} from '../types/report.types';

export interface GetExceptionsParams {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  /** Server-side. `VERIFIED` and `MANUAL_OVERRIDE` are rejected with a 400 by design. */
  result?: ExceptionResult;
  /** Server-side, across the full range: event code, EPC, plate read, truck plate, driver name. */
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private readonly REPORTS_URL = `${environment.apiBaseUrl}/reports`;

  /** Omit `date` to let the API default to today. */
  getDailySummary(date?: string): Observable<DailySummaryData> {
    const params = date ? { date } : undefined;
    return this.http
      .get<ApiResponse<DailySummaryData>>(`${this.REPORTS_URL}/daily-summary`, { params })
      .pipe(map(({ data }) => data));
  }

  /** Omit `month` to let the API default to the current month. */
  getMonthlyBreakdown(month?: string): Observable<MonthlyBreakdownData> {
    const params = month ? { month } : undefined;
    return this.http
      .get<ApiResponse<MonthlyBreakdownData>>(`${this.REPORTS_URL}/monthly-breakdown`, { params })
      .pipe(map(({ data }) => data));
  }

  /** Omit `from`/`to` to let the API default to today and the preceding six days. */
  getExceptions(params: GetExceptionsParams): Observable<ExceptionsListResult> {
    const httpParams: Record<string, string | number> = { page: params.page, limit: params.limit };
    if (params.from) httpParams['from'] = params.from;
    if (params.to) httpParams['to'] = params.to;
    if (params.result) httpParams['result'] = params.result;
    if (params.search) httpParams['search'] = params.search;

    return this.http
      .get<ApiResponse<ExceptionReportItem[]> & { meta: ExceptionsMeta }>(`${this.REPORTS_URL}/exceptions`, {
        params: httpParams,
      })
      .pipe(map(({ data, meta }) => ({ data, meta })));
  }

  /** Omit `from`/`to` to let the API default to today and the preceding 29 days. */
  getPeakHours(from?: string, to?: string): Observable<PeakHoursData> {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;

    return this.http
      .get<ApiResponse<PeakHoursData>>(`${this.REPORTS_URL}/peak-hours`, { params })
      .pipe(map(({ data }) => data));
  }
}
