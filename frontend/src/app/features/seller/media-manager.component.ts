import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MediaItem, Product } from '../../core/models';
import { MediaService } from '../../core/media.service';
import { ProductService } from '../../core/product.service';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="hero-panel mb-4"><p class="eyebrow mb-2">Product media</p><h1 class="h2 fw-bold">Give every listing a better first look</h1><p class="text-muted mb-0">Upload product images. Files must be images and no larger than 2 MB.</p></div>
    <section class="surface rounded-4 p-4 mb-4">
      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      @if (success()) { <div class="alert alert-success">{{ success() }}</div> }
      <div class="row g-3 align-items-end">
        <div class="col-md-5">
          <label class="form-label" for="productId">Product</label>
          <select id="productId" class="form-select" [(ngModel)]="productId">
            <option value="">Choose a product</option>
            @for (product of products(); track product.id) { <option [value]="product.id">{{ product.name }}</option> }
          </select>
          @if (products().length === 0) { <div class="form-text text-danger">Create a product before uploading media.</div> }
        </div>
        <div class="col-md-5"><label class="form-label" for="file">Image file</label><input id="file" class="form-control" type="file" accept="image/*" (change)="select($event)"></div>
        <div class="col-md-2"><button class="btn btn-primary w-100" [disabled]="!file() || !productId || loading()" (click)="upload()">{{ loading() ? 'Uploading...' : 'Upload' }}</button></div>
      </div>
      @if (preview()) { <img class="mt-3 rounded-3" style="max-width:220px;aspect-ratio:4/3;object-fit:cover" [src]="preview()" alt="Selected image preview"> }
      <p class="form-text mt-3 mb-0">After upload, the backend automatically attaches the returned media URL to the selected product.</p>
    </section>
    <div class="product-grid">
      @for (item of media(); track item.id) {
        <article class="card market-card rounded-4 overflow-hidden"><img class="product-image w-100" [src]="item.imageUrl" alt="Uploaded product media"><div class="p-3"><p class="small text-muted mb-2">Product: {{ item.productId }}</p><code class="small d-block mb-3">{{ item.imageUrl }}</code><button class="btn btn-outline-danger" (click)="remove(item)">Delete</button></div></article>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaManagerComponent {
  private readonly mediaService = inject(MediaService);
  private readonly productService = inject(ProductService);
  readonly media = signal<MediaItem[]>([]);
  readonly products = signal<Product[]>([]);
  readonly file = signal<File | null>(null);
  readonly preview = signal<string | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly loading = signal(false);
  productId = '';
  constructor() { this.load(); }
  load() {
    this.mediaService.mine().subscribe(items => this.media.set(items));
    this.productService.list().subscribe(products => this.products.set(products));
  }
  select(event: Event) {
    this.error.set(''); this.success.set('');
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    if (!selected) return;
    if (!selected.type.startsWith('image/')) { this.error.set('Choose an image file.'); input.value = ''; return; }
    if (selected.size > 2 * 1024 * 1024) { this.error.set('Image must be 2 MB or smaller.'); input.value = ''; return; }
    this.file.set(selected);
    this.preview.set(URL.createObjectURL(selected));
  }
  upload() {
    const selected = this.file();
    if (!selected || !this.productId) return;
    this.loading.set(true);
    this.mediaService.upload(selected, this.productId).subscribe({ next: item => { this.media.update(items => [item, ...items]); this.success.set(`Uploaded and linked to product. URL: ${item.imageUrl}`); this.file.set(null); this.preview.set(null); this.loading.set(false); }, error: err => { this.error.set(err.error?.message ?? 'Upload failed.'); this.loading.set(false); } });
  }
  remove(item: MediaItem) { if (confirm('Delete this image?')) this.mediaService.delete(item.id).subscribe(() => this.media.update(items => items.filter(x => x.id !== item.id))); }
}
