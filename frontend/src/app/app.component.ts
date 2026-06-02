import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { TokenStorageService } from './core/token-storage.service';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="app-shell">
      <nav class="navbar navbar-expand-lg sticky-top">
        <div class="container py-2">
          <a class="navbar-brand brand-mark" routerLink="/products">Buy-01</a>
          <button class="navbar-toggler tap-target" type="button" (click)="toggleNav()" [attr.aria-expanded]="navOpen()" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div id="nav" class="collapse navbar-collapse" [class.show]="navOpen()">
            <div class="navbar-nav me-auto gap-lg-1">
              <a class="nav-link" routerLink="/products">Products</a>
              @if (storage.role() === 'SELLER') {
                <a class="nav-link" routerLink="/seller/dashboard">Dashboard</a>
                <a class="nav-link" routerLink="/seller/media">Media</a>
              }
            </div>
            <div class="navbar-nav align-items-lg-center gap-2">
              @if (storage.user(); as user) {
                <a class="nav-link role-badge px-3" routerLink="/profile">{{ user.name }}</a>
                <button class="btn btn-outline-primary" type="button" (click)="logout()">Logout</button>
              } @else {
                <a class="nav-link" routerLink="/login">Login</a>
                <a class="btn btn-primary" routerLink="/register">Register</a>
              }
            </div>
          </div>
        </div>
      </nav>
      <main class="container py-4 py-lg-5">
        <router-outlet />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly storage = inject(TokenStorageService);
  readonly navOpen = signal(false);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  toggleNav() { this.navOpen.update(open => !open); }
  logout() { this.auth.logout(); this.navOpen.set(false); this.router.navigate(['/login'], { replaceUrl: true }); }
}
