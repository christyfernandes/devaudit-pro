import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex items-center justify-center px-4" style="background: var(--color-bg);">
      <!-- Background effects -->
      <div class="fixed inset-0 pointer-events-none">
        <div class="absolute inset-0 bg-grid-pattern opacity-20"></div>
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style="background: radial-gradient(circle, #1a5cff 0%, transparent 70%);"></div>
      </div>

      <div class="relative w-full max-w-md animate-slide-up">
        <!-- Logo -->
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-flex items-center gap-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                 style="background: linear-gradient(135deg, #1a5cff, #7c3aed);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span class="font-display text-xl font-bold text-white">DevAudit <span class="text-brand-400">Pro</span></span>
          </a>
          <p class="mt-3 text-sm" style="color: var(--color-text-muted);">Reviewer Portal — Sign in to start auditing</p>
        </div>

        <!-- Card -->
        <div class="p-8 rounded-2xl" style="background: var(--color-surface); border: 1px solid var(--color-border);">
          <h1 class="font-display text-xl font-bold mb-6" style="color: var(--color-text);">Sign In</h1>

          <!-- Demo credentials hint -->
          <div class="mb-5 p-3 rounded-xl text-xs"
               style="background: rgba(26, 92, 255, 0.08); border: 1px solid rgba(26, 92, 255, 0.2); color: #64748b;">
            <p class="font-semibold text-brand-400 mb-1">Demo credentials:</p>
            <p>📧 reviewer&#64;devaudit.pro</p>
            <p>🔑 password</p>
          </div>

          <!-- Error -->
          @if (error()) {
            <div class="mb-4 p-3 rounded-xl text-sm"
                 style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: #f87171;">
              {{ error() }}
            </div>
          }

          <!-- Form -->
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-muted);">Email</label>
              <input type="email" [(ngModel)]="email" placeholder="reviewer@devaudit.pro"
                     class="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                     style="background: var(--color-surface-2); border: 1px solid var(--color-border); color: var(--color-text);"
                     [style.border-color]="error() ? 'rgba(239, 68, 68, 0.4)' : ''"
                     (keyup.enter)="login()" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-muted);">Password</label>
              <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" placeholder="••••••••"
                     class="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                     style="background: var(--color-surface-2); border: 1px solid var(--color-border); color: var(--color-text);"
                     (keyup.enter)="login()" />
            </div>

            <button (click)="login()" [disabled]="authService.isLoading()"
                    class="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                    style="background: linear-gradient(135deg, #1a5cff, #7c3aed);">
              @if (authService.isLoading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Signing in...
                </span>
              } @else {
                Sign In
              }
            </button>
          </div>
        </div>

        <p class="text-center mt-6 text-xs" style="color: var(--color-text-muted);">
          <a routerLink="/" class="hover:text-brand-400 transition-colors">← Back to Guidelines</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  protected authService = inject(AuthService);
  private router = inject(Router);

  protected email = '';
  protected password = '';
  protected error = signal<string | null>(null);
  protected showPassword = signal(false);

  async login(): Promise<void> {
    this.error.set(null);
    const result = await this.authService.login(this.email, this.password);
    if (result.success) {
      this.router.navigate(['/audit']);
    } else {
      this.error.set(result.error || 'Login failed');
    }
  }
}
