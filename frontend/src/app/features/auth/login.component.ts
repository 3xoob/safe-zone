import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="row justify-content-center">
      <div class="col-md-7 col-lg-5">
        <div class="card auth-card p-4 p-lg-5 pt-5">
          <p class="eyebrow mb-2">Secure access</p>
          <h1 class="h3 mb-2">Welcome back</h1>
          <p class="text-muted mb-4">Sign in to manage your marketplace account.</p>
          @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="mb-3">
              <label class="form-label" for="email">Email</label>
              <input id="email" class="form-control" type="email" autocomplete="email" formControlName="email">
              @if (form.controls.email.touched && form.controls.email.invalid) { <div class="text-danger small mt-1">Enter a valid email.</div> }
            </div>
            <div class="mb-4">
              <label class="form-label" for="password">Password</label>
              <input id="password" class="form-control" type="password" autocomplete="current-password" formControlName="password">
              @if (form.controls.password.touched && form.controls.password.invalid) { <div class="text-danger small mt-1">Password is required.</div> }
            </div>
            <button class="btn btn-primary w-100" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Signing in...' : 'Sign in' }}</button>
          </form>
          <p class="mt-4 mb-0 text-center">New here? <a routerLink="/register">Create an account</a></p>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });

  submit() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: response => this.router.navigateByUrl(response.user.role === 'SELLER' ? '/seller/dashboard' : '/products'),
      error: err => { this.error.set(err.error?.message ?? 'Unable to sign in.'); this.loading.set(false); }
    });
  }
}
