import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';
import { Truck, TruckDetail, TruckListResult, UntaggedTruck } from '../types/truck.types';

export interface GetTrucksParams {
  page: number;
  limit: number;
  search?: string;
  includeArchived?: boolean;
}

export interface TruckPayload {
  plateNumber: string;
  model: string;
}

@Injectable({ providedIn: 'root' })
export class TruckService {
  private http = inject(HttpClient);
  private readonly TRUCKS_URL = `${environment.apiBaseUrl}/trucks`;

  getTrucks(params: GetTrucksParams): Observable<TruckListResult> {
    let httpParams = new HttpParams().set('page', params.page).set('limit', params.limit);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.includeArchived) httpParams = httpParams.set('includeArchived', true);

    return this.http.get<TruckListResult>(this.TRUCKS_URL, { params: httpParams });
  }

  /** Active trucks with no bound RFID tag — for tag-registration pickers. */
  getUntaggedTrucks(): Observable<UntaggedTruck[]> {
    return this.http
      .get<ApiResponse<UntaggedTruck[]>>(`${this.TRUCKS_URL}/untagged`)
      .pipe(map(response => response.data));
  }

  getTruck(id: string): Observable<TruckDetail> {
    return this.http
      .get<ApiResponse<TruckDetail>>(`${this.TRUCKS_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  create(payload: TruckPayload): Observable<Truck> {
    return this.http
      .post<ApiResponse<Truck>>(this.TRUCKS_URL, payload)
      .pipe(map(response => response.data));
  }

  update(id: string, payload: Partial<TruckPayload>): Observable<Truck> {
    return this.http
      .patch<ApiResponse<Truck>>(`${this.TRUCKS_URL}/${id}`, payload)
      .pipe(map(response => response.data));
  }

  archive(id: string): Observable<Truck> {
    return this.http
      .post<ApiResponse<Truck>>(`${this.TRUCKS_URL}/${id}/archive`, {})
      .pipe(map(response => response.data));
  }

  restore(id: string): Observable<Truck> {
    return this.http
      .post<ApiResponse<Truck>>(`${this.TRUCKS_URL}/${id}/restore`, {})
      .pipe(map(response => response.data));
  }

  uploadPhoto(id: string, file: File): Observable<Truck> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http
      .post<ApiResponse<Truck>>(`${this.TRUCKS_URL}/${id}/photo`, formData)
      .pipe(map(response => response.data));
  }
}
