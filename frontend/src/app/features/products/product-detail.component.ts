import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../core/models';
import { ProductService } from '../../core/product.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <a routerLink="/products" class="btn btn-link px-0 mb-3">Back to products</a>
    @if (product(); as item) {
      <section class="row g-4 align-items-start">
        <div class="col-lg-6"><img class="product-image w-100 rounded-4 surface" [src]="item.imageUrls[0] || 'assets/product-placeholder.svg'" [alt]="item.name"></div>
        <div class="col-lg-6"><div class="surface rounded-4 p-4 p-lg-5"><p class="eyebrow mb-2">Product detail</p><h1 class="fw-bold">{{ item.name }}</h1><p class="lead text-muted">{{ item.description }}</p><div class="d-flex flex-wrap gap-2 align-items-center"><span class="price-chip">{{ item.price }} BHD</span><span class="badge qty-badge px-3 py-2">Available quantity: {{ item.quantity }}</span></div></div></div>
      </section>
    } @else { <div class="surface rounded-4 p-4">Loading product...</div> }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly products = inject(ProductService);
  readonly product = signal<Product | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.products.get(id).subscribe(product => this.product.set(product));
  }
}
