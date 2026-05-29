import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Driver } from '../types/driver.types';

interface DriversResponse {
  statusCode: number;
  message: string;
  data: {
    data: Driver[];
    meta: {
      total: number;
      page: number;
      limit: number;
      lastPage: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class DriverService {
  private http = inject(HttpClient);
  private readonly DRIVERS_URL = `${environment.apiBaseUrl}/drivers`;

  getDrivers(): Observable<Driver[]> {
    return this.http.get<DriversResponse>(this.DRIVERS_URL).pipe(
      map(response => response.data.data)
    );
  }
}