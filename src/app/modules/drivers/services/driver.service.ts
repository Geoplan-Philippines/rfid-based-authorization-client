import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedResult } from '../../../core/types/api-response.types';
import { Driver } from '../types/driver.types';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private http = inject(HttpClient);
  private readonly DRIVERS_URL = `${environment.apiBaseUrl}/drivers`;

  getDrivers(page: number = 1, limit: number = 10): Observable<PaginatedResult<Driver>> {
    return this.http
      .get<ApiResponse<Driver[]>>(this.DRIVERS_URL, { params: { page, limit } })
      .pipe(map(({ data, meta }) => ({ data, meta: meta! })));
  }
}
