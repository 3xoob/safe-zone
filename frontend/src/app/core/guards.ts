import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from './token-storage.service';

export const authGuard: CanActivateFn = () => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);
  return storage.isLoggedIn() || router.createUrlTree(['/login']);
};

export const sellerGuard: CanActivateFn = () => {
  const storage = inject(TokenStorageService);
  const router = inject(Router);
  if (!storage.isLoggedIn()) return router.createUrlTree(['/login']);
  return storage.role() === 'SELLER' || router.createUrlTree(['/products']);
};
