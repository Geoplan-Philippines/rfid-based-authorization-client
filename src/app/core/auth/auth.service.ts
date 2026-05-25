import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  data: User & { accessToken: string };
}

interface AuthSession {
  token: string;
  user: User;
}

const SESSION_KEY = 'rfid_auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly LOGIN_URL = `${environment.apiBaseUrl}/auth/login`;

  private readonly _isAuthenticated = signal(false);
  private readonly _currentUser = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();

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

  getToken(): string | null {
    return this._token();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.LOGIN_URL, credentials).pipe(
      tap((response) => {
        const { accessToken, ...user } = response.data;
        const session: AuthSession = { token: accessToken, user };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        this._isAuthenticated.set(true);
        this._currentUser.set(user);
        this._token.set(accessToken);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this._token.set(null);
  }
}
