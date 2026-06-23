import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginationMeta } from '../../../core/types/api-response.types';
import { AuditLog, AuditLogListResult } from '../types/audit-log.types';

export interface GetAuditLogsParams {
  page: number;
  limit: number;
  action?: string;
  entityType?: string;
  actorId?: string;
  entityId?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private http = inject(HttpClient);
  private readonly AUDIT_LOGS_URL = `${environment.apiBaseUrl}/audit-logs`;

  getAuditLogs(params: GetAuditLogsParams): Observable<AuditLogListResult> {
    const httpParams: Record<string, string | number> = { page: params.page, limit: params.limit };
    if (params.action) httpParams['action'] = params.action;
    if (params.entityType) httpParams['entityType'] = params.entityType;
    if (params.actorId) httpParams['actorId'] = params.actorId;
    if (params.entityId) httpParams['entityId'] = params.entityId;

    return this.http
      .get<ApiResponse<AuditLog[]> & { meta: PaginationMeta }>(this.AUDIT_LOGS_URL, { params: httpParams })
      .pipe(map(({ data, meta }) => ({ data, meta })));
  }
}
