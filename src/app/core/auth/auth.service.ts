import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/api-response.types';
import { Role, User } from '../types/user.types';

export interface LoginRequest {
  email: string;
  password: string;
}

/** `POST /auth/login` returns the user fields plus the token — not a nested user. */
export type AuthResult = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> & {
  accessToken: string;
};

export interface LoginResponse {
  statusCode: number;
  message: string;
  data: AuthResult;
}

/**
 * The cached session. `user` is a full `User` once `/auth/me` has answered; the
 * login payload omits `isArchived`/`createdAt`/`updatedAt`, so those are filled in
 * at boot. Only `id` and `role` drive gating, and both arrive with login.
 */
interface AuthSession {
  token: string;
  user: SessionUser;
}

/** What we can know about the signed-in account before `/auth/me` answers. */
export type SessionUser = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'> &
  Partial<Pick<User, 'isArchived' | 'createdAt' | 'updatedAt'>>;

const SESSION_KEY = 'rfid_auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly LOGIN_URL = `${environment.apiBaseUrl}/auth/login`;
  private readonly ME_URL = `${environment.apiBaseUrl}/auth/me`;

  private readonly _isAuthenticated = signal(false);
  private readonly _currentUser = signal<SessionUser | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();

  /** The only role that may reach user management (§2). */
  readonly isSuperAdmin = computed(() => this._currentUser()?.role === 'SUPER_ADMIN');

  constructor() {
    this.restoreSession();
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private restoreSession(): void {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return;
    try {
      const session: AuthSession = JSON.parse(stored);
      if (session.token && session.user && !this.isTokenExpired(session.token)) {
        this._isAuthenticated.set(true);
        this._currentUser.set(session.user);
        this._token.set(session.token);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  private persist(token: string, user: SessionUser): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user } satisfies AuthSession));
    this._isAuthenticated.set(true);
    this._currentUser.set(user);
    this._token.set(token);
  }

  getToken(): string | null {
    return this._token();
  }

  /** The signed-in account's id — used to block self-archive and self-role-change (§8). */
  currentUserId(): string | null {
    return this._currentUser()?.id ?? null;
  }

  hasRole(role: Role): boolean {
    return this._currentUser()?.role === role;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.LOGIN_URL, credentials).pipe(
      tap((response) => {
        const { accessToken, ...user } = response.data;
        this.persist(accessToken, user);
      })
    );
  }

  /** `GET /auth/me` — 401 when the account was deleted *or archived* since login. */
  me(): Observable<User> {
    return this.http.get<ApiResponse<User>>(this.ME_URL).pipe(map(response => response.data));
  }

  /**
   * Boot check (§4): re-reads the account from the server so a role changed or an
   * account archived since the token was issued cannot linger in localStorage.
   *
   * Never rejects — the app must start regardless. A 401 is already turned into a
   * logout + redirect by the auth interceptor; any other failure (server down,
   * offline) keeps the cached session so the app stays usable.
   */
  verifySession(): Observable<void> {
    if (!this._token()) return of(void 0);

    return this.me().pipe(
      tap(user => {
        const token = this._token();
        if (token) this.persist(token, user);
      }),
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this._token.set(null);
  }
}
