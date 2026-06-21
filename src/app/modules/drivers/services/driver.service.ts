import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';
import { Driver, DriverDetail, DriverListResult } from '../types/driver.types';

export interface GetDriversParams {
  page: number;
  limit: number;
  search?: string;
  includeArchived?: boolean;
}

export interface DriverPayload {
  firstName: string;
  lastName: string;
  licenseNumber: string;
}

@Injectable({ providedIn: 'root' })
export class DriverService {
  private http = inject(HttpClient);
  private readonly DRIVERS_URL = `${environment.apiBaseUrl}/drivers`;

  getDrivers(params: GetDriversParams): Observable<DriverListResult> {
    let httpParams = new HttpParams().set('page', params.page).set('limit', params.limit);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.includeArchived) httpParams = httpParams.set('includeArchived', true);

    return this.http.get<DriverListResult>(this.DRIVERS_URL, { params: httpParams });
  }

  getDriver(id: string): Observable<DriverDetail> {
    return this.http
      .get<ApiResponse<DriverDetail>>(`${this.DRIVERS_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  create(payload: DriverPayload): Observable<Driver> {
    return this.http
      .post<ApiResponse<Driver>>(this.DRIVERS_URL, payload)
      .pipe(map(response => response.data));
  }

  update(id: string, payload: Partial<DriverPayload>): Observable<Driver> {
    return this.http
      .patch<ApiResponse<Driver>>(`${this.DRIVERS_URL}/${id}`, payload)
      .pipe(map(response => response.data));
  }

  archive(id: string): Observable<Driver> {
    return this.http
      .post<ApiResponse<Driver>>(`${this.DRIVERS_URL}/${id}/archive`, {})
      .pipe(map(response => response.data));
  }

  restore(id: string): Observable<Driver> {
    return this.http
      .post<ApiResponse<Driver>>(`${this.DRIVERS_URL}/${id}/restore`, {})
      .pipe(map(response => response.data));
  }

  uploadPhoto(id: string, file: File): Observable<Driver> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http
      .post<ApiResponse<Driver>>(`${this.DRIVERS_URL}/${id}/photo`, formData)
      .pipe(map(response => response.data));
  }
}
