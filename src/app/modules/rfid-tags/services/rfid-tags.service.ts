import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RfidTag } from '../types/rfid-tags.types';

interface RfidTagsMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface RfidTagsPage {
  data: RfidTag[];
  meta: RfidTagsMeta;
}

@Injectable({ providedIn: 'root' })
export class RfidTagService {
  private http = inject(HttpClient);
  private readonly RFID_TAGS_URL = `${environment.apiBaseUrl}/rfid-tags`;

  getRfidTags(page: number = 1, limit: number = 10): Observable<RfidTagsPage> {
    return this.http.get<RfidTagsPage>(this.RFID_TAGS_URL, { params: { page, limit } });
  }
}
