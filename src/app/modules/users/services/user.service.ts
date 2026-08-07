import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse, PaginationMeta } from '../../../core/types/api-response.types';
import {
  CreateUserPayload,
  ListUsersParams,
  MAX_PAGE_SIZE,
  UpdateUserPayload,
  User,
  UserListResult,
} from '../types/user.types';

/**
 * `/users` client. Every route here requires `role === 'SUPER_ADMIN'` — there is no
 * read-only tier, so guard the caller before reaching for this service (§2).
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly USERS_URL = `${environment.apiBaseUrl}/users`;

  /** Sorted `createdAt` desc by the server; not configurable (§6.2). */
  list(params: ListUsersParams): Observable<UserListResult> {
    let httpParams = new HttpParams()
      .set('page', Math.max(1, params.page))
      .set('limit', Math.min(params.limit, MAX_PAGE_SIZE));

    // A whitespace-only search is ignored server-side; omit it rather than send noise.
    const search = params.search?.trim();
    if (search) httpParams = httpParams.set('search', search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    // Only the exact lowercase string enables it — "True"/"1"/"yes" silently mean false.
    if (params.includeArchived) httpParams = httpParams.set('includeArchived', 'true');

    return this.http
      .get<ApiResponse<User[]> & { meta: PaginationMeta }>(this.USERS_URL, { params: httpParams })
      .pipe(map(({ data, meta }) => ({ data, meta })));
  }

  /** Returns archived users too, so the detail screen stays reachable for a restore (§6.3). */
  getById(id: string): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.USERS_URL}/${id}`)
      .pipe(map(response => response.data));
  }

  create(payload: CreateUserPayload): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(this.USERS_URL, payload)
      .pipe(map(response => response.data));
  }

  /** Pass only changed fields — see `buildUpdatePayload` (§8). */
  update(id: string, payload: UpdateUserPayload): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.USERS_URL}/${id}`, payload)
      .pipe(map(response => response.data));
  }

  /**
   * Soft delete — the row and its email stay reserved. Note the verb: users archive
   * with `PATCH` and `/unarchive`, while drivers and trucks use `POST` and `/restore` (§6.6).
   */
  archive(id: string): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.USERS_URL}/${id}/archive`, {})
      .pipe(map(response => response.data));
  }

  unarchive(id: string): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.USERS_URL}/${id}/unarchive`, {})
      .pipe(map(response => response.data));
  }
}
