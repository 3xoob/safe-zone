import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="row justify-content-center">
      <div class="col-lg-7">
        <div class="card auth-card p-4 p-lg-5 pt-5">
          <p class="eyebrow mb-2">Join Buy-01</p>
          <h1 class="h3 mb-2">Create your account</h1>
          <p class="text-muted mb-4">Choose how you want to use Buy-01.</p>
          @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="row g-3">
              <div class="col-md-6"><label class="form-label" for="name">Name</label><input id="name" class="form-control" formControlName="name">@if (form.controls.name.touched && form.controls.name.invalid) { <div class="text-danger small mt-1">Name is required.</div> }</div>
              <div class="col-md-6"><label class="form-label" for="email">Email</label><input id="email" class="form-control" type="email" formControlName="email">@if (form.controls.email.touched && form.controls.email.invalid) { <div class="text-danger small mt-1">Valid email is required.</div> }</div>
              <div class="col-md-6"><label class="form-label" for="password">Password</label><input id="password" class="form-control" type="password" formControlName="password">@if (form.controls.password.touched && form.controls.password.invalid) { <div class="text-danger small mt-1">Use at least 6 characters.</div> }</div>
              <div class="col-md-6"><label class="form-label" for="role">Role</label><select id="role" class="form-select" formControlName="role"><option value="CLIENT">Client, browse products</option><option value="SELLER">Seller, manage catalog</option></select></div>
            </div>
            <button class="btn btn-primary w-100 mt-4" type="submit" [disabled]="form.invalid || loading()">{{ loading() ? 'Creating account...' : 'Create account' }}</button>
          </form>
          <p class="mt-4 mb-0 text-center">Already registered? <a routerLink="/login">Sign in</a></p>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({ name: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(6)]], role: this.fb.control<'CLIENT' | 'SELLER'>('CLIENT', Validators.required) });
  submit() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.loading.set(true);
    const value = this.form.getRawValue();
    this.auth.register(value.name, value.email, value.password, value.role).subscribe({
      next: response => this.router.navigateByUrl(response.user.role === 'SELLER' ? '/seller/dashboard' : '/products'),
      error: err => { this.error.set(err.error?.message ?? 'Unable to register.'); this.loading.set(false); }
    });
  }
}
