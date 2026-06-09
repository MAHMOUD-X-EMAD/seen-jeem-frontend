import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type AppTheme = 'royal' | 'pearl';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'seenjeem-theme';

  currentTheme = signal<AppTheme>('royal');

  constructor() {
    const savedTheme = this.getSavedTheme();
    this.setTheme(savedTheme ?? 'royal');
  }

  setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);

    if (!this.isBrowser()) {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);

    try {
      window.localStorage.setItem(this.storageKey, theme);
    } catch {
      // Ignore storage errors
    }
  }

  toggleTheme(): void {
    const nextTheme = this.currentTheme() === 'royal' ? 'pearl' : 'royal';
    this.setTheme(nextTheme);
  }

  getThemeLabel(): string {
    return this.currentTheme() === 'royal'
      ? 'Royal Game Show'
      : 'Pearl Pro';
  }

  private getSavedTheme(): AppTheme | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const value = window.localStorage.getItem(this.storageKey);

      if (value === 'royal' || value === 'pearl') {
        return value;
      }

      return null;
    } catch {
      return null;
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}