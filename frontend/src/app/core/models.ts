export type Role = 'CLIENT' | 'SELLER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  userId: string;
  imageUrls: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaItem {
  id: string;
  imageUrl: string;
  productId: string;
  sellerId: string;
  contentType: string;
  size: number;
  createdAt: string;
}
