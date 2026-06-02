import { Injectable, computed, signal } from '@angular/core';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly tokenKey = 'buy01.token';
  private readonly userKey = 'buy01.user';
  readonly token = signal<string | null>(localStorage.getItem(this.tokenKey));
  readonly user = signal<User | null>(this.readUser());
  readonly isLoggedIn = computed(() => !!this.token());
  readonly role = computed(() => this.user()?.role ?? null);

  save(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.token.set(token);
    this.user.set(user);
  }

  updateUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.user.set(user);
  }

  clear(): void {
    this.clearStorage(localStorage);
    this.clearStorage(sessionStorage);
    this.token.set(null);
    this.user.set(null);
  }

  private clearStorage(storage: Storage): void {
    for (let index = storage.length - 1; index >= 0; index--) {
      const key = storage.key(index);
      if (key?.startsWith('buy01.')) {
        storage.removeItem(key);
      }
    }
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) as User : null;
  }
}
