import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';
import { RfidTagStatus } from '../../../shared/ui/status-tags';
import { RfidTag, RfidTagDetail, RfidTagListResult } from '../types/rfid-tags.types';

export interface GetRfidTagsParams {
  page: number;
  limit: number;
  search?: string;
  status?: RfidTagStatus;
}

export interface CreateRfidTagPayload {
  epcId: string;
  /** The number printed on the physical tag. Omitted when the tag carries no label. */
  serialNo?: string;
  /** Omitted to register the tag as unbound spare stock; bind it to a truck later. */
  assignedTruckId?: string;
  status?: RfidTagStatus;
}

@Injectable({ providedIn: 'root' })
export class RfidTagService {
  private http = inject(HttpClient);
  private readonly RFID_TAGS_URL = `${environment.apiBaseUrl}/rfid-tags`;

  getTags(params: GetRfidTagsParams): Observable<RfidTagListResult> {
    let httpParams = new HttpParams().set('page', params.page).set('limit', params.limit);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<RfidTagListResult>(this.RFID_TAGS_URL, { params: httpParams });
  }

  getTag(id: string): Observable<RfidTagDetail> {
    return this.http
      .get<ApiResponse<RfidTagDetail>>(`${this.RFID_TAGS_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  create(payload: CreateRfidTagPayload): Observable<RfidTag> {
    return this.http
      .post<ApiResponse<RfidTag>>(this.RFID_TAGS_URL, payload)
      .pipe(map(response => response.data));
  }

  updateStatus(id: string, status: RfidTagStatus, reason?: string): Observable<RfidTagDetail> {
    return this.http
      .patch<ApiResponse<RfidTagDetail>>(`${this.RFID_TAGS_URL}/${id}/status`, { status, reason })
      .pipe(map(response => response.data));
  }

  rebind(id: string, assignedTruckId: string): Observable<RfidTagDetail> {
    return this.http
      .patch<ApiResponse<RfidTagDetail>>(`${this.RFID_TAGS_URL}/${id}/rebind`, { assignedTruckId })
      .pipe(map(response => response.data));
  }
}
