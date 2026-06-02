import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores and clears authenticated user state', () => {
    const service = TestBed.inject(TokenStorageService);

    service.save('token-123', {
      id: 'user-1',
      name: 'Seller',
      email: 'seller@example.com',
      role: 'SELLER',
      avatar: null
    });

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.role()).toBe('SELLER');

    service.clear();

    expect(service.isLoggedIn()).toBeFalse();
    expect(service.user()).toBeNull();
  });
});
