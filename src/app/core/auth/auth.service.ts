import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface LoginResponse {
  token?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly LOGIN_URL = `${environment.apiBaseUrl}/auth/login`;

  private readonly _isAuthenticated = signal(false);
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.LOGIN_URL, credentials).pipe(
      tap((response) => {
        if (response.token) {
          this._isAuthenticated.set(true);
        }
      })
    );
  }

  logout(): void {
    this._isAuthenticated.set(false);
  }
}
