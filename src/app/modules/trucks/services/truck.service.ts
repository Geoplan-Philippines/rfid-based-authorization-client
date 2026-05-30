import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Truck } from '../types/truck.types';

interface TrucksMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}
interface TrucksResponse {
  statusCode: number;
  message: string;
  data: {
    data: Truck[];
    meta: TrucksMeta;
  };
}
interface TrucksPage {
  data: Truck[];
  meta: TrucksMeta;
}

@Injectable({ providedIn: 'root' })
export class TruckService {
  private http = inject(HttpClient);
  private readonly TRUCKS_URL = `${environment.apiBaseUrl}/trucks`;

  getTrucks(page: number = 1, limit: number = 10): Observable<TrucksPage> {
    return this.http
      .get<TrucksResponse>(this.TRUCKS_URL, { params: { page, limit } })
      .pipe(map(response => response.data));
  }
}
 