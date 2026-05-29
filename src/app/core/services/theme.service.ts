import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>('dark');

  readonly theme = this._theme.asReadonly();

  constructor() {
    const stored = localStorage.getItem('devaudit_theme') as Theme;
    if (stored) {
      this.setTheme(stored);
    }
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
    localStorage.setItem('devaudit_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }

  toggleTheme(): void {
    this.setTheme(this._theme() === 'dark' ? 'light' : 'dark');
  }
}
