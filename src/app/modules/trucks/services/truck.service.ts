import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginatedResult, PaginationMeta } from '../../../core/types/api-response.types';
import { Truck } from '../types/truck.types';

@Injectable({ providedIn: 'root' })
export class TruckService {
  private http = inject(HttpClient);
  private readonly TRUCKS_URL = `${environment.apiBaseUrl}/trucks`;

  getTrucks(page: number = 1, limit: number = 10): Observable<PaginatedResult<Truck>> {
    return this.http
      .get<ApiResponse<Truck[]> & { meta: PaginationMeta }>(this.TRUCKS_URL, { params: { page, limit } })
      .pipe(map(({ data, meta }) => ({ data, meta })));
  }
}
