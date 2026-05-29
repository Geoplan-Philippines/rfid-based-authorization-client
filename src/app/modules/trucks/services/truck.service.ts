import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Truck } from '../types/truck.types';

interface TrucksResponse {
  statusCode: number;
  message: string;
  data: {
    data: Truck[];
    meta: {
      total: number;
      page: number;
      limit: number;
      lastPage: number;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class TruckService {
  private http = inject(HttpClient);
  private readonly TRUCKS_URL = `${environment.apiBaseUrl}/trucks`;

  getTrucks(): Observable<Truck[]> {
    return this.http.get<TrucksResponse>(this.TRUCKS_URL).pipe(
      map(response => response.data.data)
    );
  }
}