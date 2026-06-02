import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { API_URL } from './api-url.token';
import { AuthResponse, Role, User } from './models';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly storage = inject(TokenStorageService);

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email: email.trim(), password }).pipe(
      tap(response => this.storage.save(response.token, response.user))
    );
  }

  register(name: string, email: string, password: string, role: Role) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { name: name.trim(), email: email.trim(), password, role }).pipe(
      tap(response => this.storage.save(response.token, response.user))
    );
  }

  me() { return this.http.get<User>(`${this.apiUrl}/users/me`); }
  updateProfile(payload: { name: string }) { return this.http.put<User>(`${this.apiUrl}/users/me`, payload).pipe(tap(user => this.storage.updateUser(user))); }
  uploadAvatar(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<User>(`${this.apiUrl}/users/me/avatar`, form).pipe(tap(user => this.storage.updateUser(user)));
  }
  logout() { this.storage.clear(); }
}
