import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/product.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="row justify-content-center"><div class="col-lg-8"><div class="card auth-card p-4 p-lg-5 pt-5">
      <a routerLink="/seller/dashboard" class="btn btn-link px-0 align-self-start">Back to dashboard</a>
      <p class="eyebrow mb-2">Catalog editor</p>
      <h1 class="h3 mb-4">{{ id ? 'Edit product' : 'Create product' }}</h1>
      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="mb-3"><label class="form-label" for="name">Name</label><input id="name" class="form-control" formControlName="name">@if (form.controls.name.touched && form.controls.name.invalid) { <div class="text-danger small mt-1">Name is required.</div> }</div>
        <div class="mb-3"><label class="form-label" for="description">Description</label><textarea id="description" rows="4" class="form-control" formControlName="description"></textarea>@if (form.controls.description.touched && form.controls.description.invalid) { <div class="text-danger small mt-1">Description is required.</div> }</div>
        <div class="row g-3"><div class="col-md-6"><label class="form-label" for="price">Price</label><input id="price" class="form-control" type="number" min="0.01" formControlName="price">@if (form.controls.price.touched && form.controls.price.invalid) { <div class="text-danger small mt-1">Price must be greater than 0.</div> }</div><div class="col-md-6"><label class="form-label" for="quantity">Quantity</label><input id="quantity" class="form-control" type="number" min="0" formControlName="quantity">@if (form.controls.quantity.touched && form.controls.quantity.invalid) { <div class="text-danger small mt-1">Quantity cannot be negative.</div> }</div></div>
        <div class="mt-3"><label class="form-label" for="imageUrls">Image URLs, comma separated</label><input id="imageUrls" class="form-control" formControlName="imageUrls"><div class="form-text">Upload images in Media, then paste returned URLs here.</div></div>
        <button class="btn btn-primary mt-4" [disabled]="form.invalid || loading()">{{ loading() ? 'Saving...' : 'Save product' }}</button>
      </form>
    </div></div></section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly products = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.group({ name: ['', Validators.required], description: ['', Validators.required], price: [1, [Validators.required, Validators.min(0.01)]], quantity: [0, [Validators.required, Validators.min(0)]], imageUrls: [''] });
  constructor() { if (this.id) this.products.get(this.id).subscribe(p => this.form.patchValue({ ...p, imageUrls: p.imageUrls.join(', ') })); }
  submit() {
    if (this.form.invalid) return this.form.markAllAsTouched();
    this.loading.set(true);
    const v = this.form.getRawValue();
    const payload = { name: v.name, description: v.description, price: Number(v.price), quantity: Number(v.quantity), imageUrls: v.imageUrls.split(',').map(x => x.trim()).filter(Boolean) };
    const request = this.id ? this.products.update(this.id, payload) : this.products.create(payload);
    request.subscribe({ next: () => this.router.navigateByUrl('/seller/dashboard'), error: err => { this.error.set(err.error?.message ?? 'Unable to save product.'); this.loading.set(false); } });
  }
}
