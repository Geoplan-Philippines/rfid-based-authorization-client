import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';
import { DashboardOverview } from '../types/dashboard.types';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly OVERVIEW_URL = `${environment.apiBaseUrl}/dashboard/overview`;

  /**
   * Fetch the dashboard overview for a gate-local day. Omit `date` to let the
   * API default to today.
   */
  getOverview(date?: string): Observable<DashboardOverview> {
    const params = date ? { date } : undefined;
    return this.http
      .get<ApiResponse<DashboardOverview>>(this.OVERVIEW_URL, { params })
      .pipe(map(({ data }) => data));
  }
}
