import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'reviewer' | 'admin';
  avatar: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _isLoading = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly currentUser = this._user.asReadonly();

  constructor(private router: Router) {
    // Check for stored session
    const stored = localStorage.getItem('devaudit_user');
    if (stored) {
      try {
        this._user.set(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this._isLoading.set(true);
    await this.delay(1200); // Simulate API call

    // Mock authentication
    if (email === 'reviewer@devaudit.pro' && password === 'password') {
      const user: User = {
        id: 'usr-001',
        email,
        name: 'Christy Fernandes',
        role: 'reviewer',
        avatar: 'CF'
      };
      this._user.set(user);
      localStorage.setItem('devaudit_user', JSON.stringify(user));
      this._isLoading.set(false);
      return { success: true };
    }

    if (email === 'admin@devaudit.pro' && password === 'password') {
      const user: User = {
        id: 'usr-002',
        email,
        name: 'Admin User',
        role: 'admin',
        avatar: 'AU'
      };
      this._user.set(user);
      localStorage.setItem('devaudit_user', JSON.stringify(user));
      this._isLoading.set(false);
      return { success: true };
    }

    this._isLoading.set(false);
    return { success: false, error: 'Invalid email or password. Try reviewer@devaudit.pro / password' };
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem('devaudit_user');
    this.router.navigate(['/']);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
