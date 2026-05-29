import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { Driver } from '../types/driver.types';

interface DriversMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

interface DriversResponse {
  statusCode: number;
  message: string;
  data: {
    data: Driver[];
    meta: DriversMeta;
  };
}

interface DriversPage {
  data: Driver[];
  meta: DriversMeta;
}
@Injectable({ providedIn: 'root' })
export class DriverService {
  private http = inject(HttpClient);
  private readonly DRIVERS_URL = `${environment.apiBaseUrl}/drivers`;

   getDrivers(page: number = 1, limit: number = 10): Observable<DriversPage> {
    return this.http
      .get<DriversResponse>(this.DRIVERS_URL, { params: { page, limit } })
      .pipe(map(response => response.data));
  }
}
 