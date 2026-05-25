import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../types/user.types';

interface UsersResponse {
  statusCode: number;
  message: string;
  data: User[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly USERS_URL = `${environment.apiBaseUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<UsersResponse>(this.USERS_URL).pipe(
      map(response => response.data)
    );
  }
}
