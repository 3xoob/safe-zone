import { Routes } from '@angular/router';
import { authGuard, sellerGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'products', loadComponent: () => import('./features/products/product-list.component').then(m => m.ProductListComponent) },
  { path: 'products/:id', loadComponent: () => import('./features/products/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'seller/dashboard', canActivate: [sellerGuard], loadComponent: () => import('./features/seller/seller-dashboard.component').then(m => m.SellerDashboardComponent) },
  { path: 'seller/products/new', canActivate: [sellerGuard], loadComponent: () => import('./features/seller/product-form.component').then(m => m.ProductFormComponent) },
  { path: 'seller/products/:id/edit', canActivate: [sellerGuard], loadComponent: () => import('./features/seller/product-form.component').then(m => m.ProductFormComponent) },
  { path: 'seller/media', canActivate: [sellerGuard], loadComponent: () => import('./features/seller/media-manager.component').then(m => m.MediaManagerComponent) },
  { path: '**', redirectTo: 'products' }
];
