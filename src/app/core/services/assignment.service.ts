import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/api-response.types';
import { AssignmentRole } from '../../shared/ui/status-tags';

export interface Assignment {
  truckId: string;
  driverId: string;
  role: AssignmentRole;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

/** Truck ↔ driver assignment (many-to-many). Shared by the truck + driver detail modals. */
@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private http = inject(HttpClient);
  private readonly ASSIGNMENTS_URL = `${environment.apiBaseUrl}/truck-driver-assignment`;

  assign(truckId: string, driverId: string, role: AssignmentRole = 'RELIEF'): Observable<Assignment> {
    return this.http
      .post<ApiResponse<Assignment>>(this.ASSIGNMENTS_URL, { truckId, driverId, role })
      .pipe(map(response => response.data));
  }

  unassign(truckId: string, driverId: string): Observable<Assignment> {
    return this.http
      .delete<ApiResponse<Assignment>>(`${this.ASSIGNMENTS_URL}/${truckId}/${driverId}`)
      .pipe(map(response => response.data));
  }

  updateRole(truckId: string, driverId: string, role: AssignmentRole): Observable<Assignment> {
    return this.http
      .patch<ApiResponse<Assignment>>(`${this.ASSIGNMENTS_URL}/${truckId}/${driverId}`, { role })
      .pipe(map(response => response.data));
  }
}
