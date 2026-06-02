import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { TokenStorageService } from '../../core/token-storage.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="row justify-content-center"><div class="col-lg-7"><div class="card p-4 p-lg-5">
      <h1 class="h3 mb-4">Profile</h1>
      @if (message()) { <div class="alert alert-success">{{ message() }}</div> }
      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label class="form-label" for="name">Name</label><input id="name" class="form-control mb-3" formControlName="name">

        <div class="d-flex align-items-center gap-3 mb-3">
          @if (avatarPreview() || storage.user()?.avatar; as avatar) {
            <img [src]="avatar" alt="Profile avatar preview" class="rounded-circle object-fit-cover border" width="88" height="88">
          } @else {
            <div class="rounded-circle border d-flex align-items-center justify-content-center text-muted" style="width: 88px; height: 88px;">No avatar</div>
          }
          <div class="flex-grow-1">
            <label class="form-label" for="avatar">Upload avatar from your device</label>
            <input id="avatar" type="file" class="form-control" accept="image/png,image/jpeg,image/gif,image/webp" (change)="selectAvatar($event)">
            <div class="form-text">PNG, JPG, GIF, or WebP. Max 2 MB.</div>
          </div>
        </div>

        <p class="text-muted">Email: {{ storage.user()?.email }}<br>Role: {{ storage.user()?.role }}</p>
        <button class="btn btn-primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Saving...' : 'Save profile' }}</button>
      </form>
    </div></div></section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  private static readonly maxAvatarSize = 2 * 1024 * 1024;
  readonly storage = inject(TokenStorageService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly avatarPreview = signal<string | null>(null);
  private selectedAvatar: File | null = null;
  readonly form = this.fb.group({ name: [this.storage.user()?.name ?? '', Validators.required] });

  selectAvatar(event: Event) {
    this.message.set('');
    this.error.set('');
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedAvatar = null;
    this.avatarPreview.set(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('Please select an image file.');
      input.value = '';
      return;
    }
    if (file.size > ProfileComponent.maxAvatarSize) {
      this.error.set('Avatar must be 2 MB or smaller.');
      input.value = '';
      return;
    }
    this.selectedAvatar = file;
    this.avatarPreview.set(URL.createObjectURL(file));
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.message.set('');
    this.error.set('');
    const avatar = this.selectedAvatar;
    const profileRequest = this.auth.updateProfile(this.form.getRawValue());
    const request = avatar ? profileRequest.pipe(switchMap(() => this.auth.uploadAvatar(avatar))) : profileRequest;
    request.subscribe({
      next: () => { this.message.set('Profile updated.'); this.loading.set(false); this.selectedAvatar = null; },
      error: () => { this.error.set('Profile could not be updated.'); this.loading.set(false); }
    });
  }
}
