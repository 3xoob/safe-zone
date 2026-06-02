import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/product.service';
import { Product } from '../../core/models';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="hero-panel mb-4 mb-lg-5">
      <p class="eyebrow mb-2">Marketplace</p>
      <h1 class="display-6 fw-bold mb-2">Local finds, listed by real sellers</h1>
      <p class="text-muted mb-0 col-lg-7">Browse the public catalog, then sign in when you want a client profile or seller tools.</p>
    </header>
    @if (loading()) { <div class="surface rounded-4 p-4">Loading products...</div> }
    @else if (products().length === 0) {
      <div class="empty-state rounded-4 p-5 text-center"><h2 class="h4">No products available yet</h2><p class="text-muted mb-0">Seller products will appear here after they are created.</p></div>
    } @else {
      <div class="product-grid">
        @for (product of products(); track product.id) {
          <article class="card market-card rounded-4 overflow-hidden h-100">
            <img class="product-image w-100" [src]="cover(product)" [alt]="product.name">
            <div class="p-4 d-flex flex-column h-100">
              <h2 class="h5">{{ product.name }}</h2>
              <p class="text-muted flex-grow-1">{{ product.description }}</p>
              <div class="d-flex justify-content-between align-items-center mb-3"><span class="price-chip">{{ product.price }} BHD</span><span class="badge qty-badge">Qty {{ product.quantity }}</span></div>
              <a class="btn btn-outline-primary" [routerLink]="['/products', product.id]">View details</a>
            </div>
          </article>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.productService.list().subscribe({ next: products => { this.products.set(products); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  cover(product: Product) { return product.imageUrls?.[0] || 'assets/product-placeholder.svg'; }
}
