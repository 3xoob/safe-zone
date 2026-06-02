import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from './api-url.token';
import { Product } from './models';

export type ProductPayload = Pick<Product, 'name' | 'description' | 'price' | 'quantity' | 'imageUrls'>;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list() { return this.http.get<Product[]>(`${this.apiUrl}/products`); }
  get(id: string) { return this.http.get<Product>(`${this.apiUrl}/products/${id}`); }
  create(payload: ProductPayload) { return this.http.post<Product>(`${this.apiUrl}/products`, payload); }
  update(id: string, payload: ProductPayload) { return this.http.put<Product>(`${this.apiUrl}/products/${id}`, payload); }
  delete(id: string) { return this.http.delete<void>(`${this.apiUrl}/products/${id}`); }
}
