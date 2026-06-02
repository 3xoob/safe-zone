import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models';
import { ProductService } from '../../core/product.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="hero-panel d-flex flex-column flex-md-row justify-content-between gap-3 mb-4"><div><p class="eyebrow mb-2">Seller workspace</p><h1 class="h2 fw-bold">Keep your catalog sharp</h1><p class="text-muted mb-0">Manage products, stock, and images from one focused dashboard.</p></div><a class="btn btn-primary align-self-start" routerLink="/seller/products/new">Create product</a></div>
    <div class="row g-3 mb-4"><div class="col-md-4"><div class="surface metric-panel rounded-4 p-4"><span class="text-muted">Total products</span><strong class="d-block h3">{{ products().length }}</strong></div></div><div class="col-md-4"><div class="surface metric-panel rounded-4 p-4"><span class="text-muted">Out of stock</span><strong class="d-block h3">{{ outOfStock() }}</strong></div></div><div class="col-md-4"><div class="surface metric-panel rounded-4 p-4"><span class="text-muted">Linked images</span><strong class="d-block h3">{{ imageCount() }}</strong></div></div></div>
    @if (products().length === 0) { <div class="empty-state rounded-4 p-5 text-center"><h2 class="h4">Your catalog is empty</h2><p class="text-muted">Create your first product to start selling.</p><a class="btn btn-primary" routerLink="/seller/products/new">Create product</a></div> }
    <div class="seller-list">
      @for (product of products(); track product.id) {
        <article class="surface seller-row rounded-4 p-3 p-lg-4 d-flex flex-column flex-lg-row gap-3 align-items-lg-center">
          <img class="rounded-3" style="width:96px;height:72px;object-fit:cover" [src]="product.imageUrls[0] || 'assets/product-placeholder.svg'" [alt]="product.name">
          <div class="flex-grow-1"><h2 class="h5 mb-1">{{ product.name }}</h2><p class="text-muted mb-0">{{ product.price }} BHD, Qty {{ product.quantity }}</p></div>
          <div class="d-flex gap-2"><a class="btn btn-outline-primary" [routerLink]="['/seller/products', product.id, 'edit']">Edit</a><button class="btn btn-outline-danger" type="button" (click)="remove(product)">Delete</button></div>
        </article>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SellerDashboardComponent {
  private readonly productService = inject(ProductService);
  readonly products = signal<Product[]>([]);
  readonly outOfStock = computed(() => this.products().filter(p => p.quantity === 0).length);
  readonly imageCount = computed(() => this.products().reduce((sum, p) => sum + (p.imageUrls?.length ?? 0), 0));
  constructor() { this.load(); }
  load() { this.productService.list().subscribe(products => this.products.set(products)); }
  remove(product: Product) { if (confirm(`Delete ${product.name}?`)) this.productService.delete(product.id).subscribe(() => this.load()); }
}
