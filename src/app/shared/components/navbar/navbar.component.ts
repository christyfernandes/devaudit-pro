import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 border-b border-white/5"
         style="background: rgba(10, 14, 26, 0.85); backdrop-filter: blur(20px);">
      
      <!-- Logo -->
      <a routerLink="/" class="flex items-center gap-3 mr-8">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center"
             style="background: linear-gradient(135deg, #1a5cff, #7c3aed);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <span class="font-display font-bold text-white text-base tracking-tight">DevAudit</span>
          <span class="font-display font-bold text-brand-400 text-base tracking-tight"> Pro</span>
        </div>
        <span class="hidden sm:block text-xs px-1.5 py-0.5 rounded font-mono"
              style="background: rgba(26, 92, 255, 0.15); color: #4a7fff; border: 1px solid rgba(26, 92, 255, 0.3);">
          v1.0
        </span>
      </a>

      <!-- Nav Links -->
      <div class="hidden md:flex items-center gap-1 flex-1">
        <a routerLink="/" routerLinkActive="text-white bg-white/5" [routerLinkActiveOptions]="{exact: true}"
           class="px-3 py-1.5 rounded-lg text-sm font-medium text-surface-400 hover:text-white hover:bg-white/5 transition-all">
          Guidelines
        </a>
        @if (auth.isAuthenticated()) {
          <a routerLink="/audit" routerLinkActive="text-white bg-white/5"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-surface-400 hover:text-white hover:bg-white/5 transition-all">
            New Audit
          </a>
        }
        @if (auth.currentUser()?.role === 'admin') {
          <a routerLink="/admin" routerLinkActive="text-white bg-white/5"
             class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
             style="color: #a78bfa;"
             [routerLinkActiveOptions]="{exact: true}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Admin
          </a>
        }
      </div>

      <!-- Right Side -->
      <div class="flex items-center gap-3 ml-auto">
        <!-- Theme Toggle -->
        <button (click)="themeService.toggleTheme()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-white hover:bg-white/10 transition-all">
          @if (themeService.theme() === 'dark') {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          } @else {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          }
        </button>

        @if (auth.isAuthenticated()) {
          <!-- User Menu -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                 style="background: linear-gradient(135deg, #1a5cff, #7c3aed);">
              {{ auth.currentUser()?.avatar }}
            </div>
            <span class="hidden md:block text-sm text-surface-300">{{ auth.currentUser()?.name }}</span>
            <button (click)="auth.logout()"
                    class="text-xs px-2 py-1 rounded text-surface-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
              Sign out
            </button>
          </div>
        } @else {
          <a routerLink="/login"
             class="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:brightness-110"
             style="background: linear-gradient(135deg, #1a5cff, #7c3aed);">
            Reviewer Login
          </a>
        }
      </div>
    </nav>
  `
})
export class NavbarComponent {
  protected auth = inject(AuthService);
  protected themeService = inject(ThemeService);
}
