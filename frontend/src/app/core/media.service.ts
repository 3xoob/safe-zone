import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URL } from './api-url.token';
import { MediaItem } from './models';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  mine() { return this.http.get<MediaItem[]>(`${this.apiUrl}/media`); }
  upload(file: File, productId: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('productId', productId);
    return this.http.post<MediaItem>(`${this.apiUrl}/media/images`, form);
  }
  delete(id: string) { return this.http.delete<void>(`${this.apiUrl}/media/images/${id}`); }
}
