/**
 * Theme Service
 * =============
 * Manages Dark/Light mode toggling.
 * Persists preference to localStorage.
 */
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly STORAGE_KEY = 'localgpt-theme';
    isDark = signal(true);

    constructor() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            this.isDark.set(stored === 'dark');
        }
        this.applyTheme();
    }

    toggle(): void {
        this.isDark.update((v) => !v);
        this.applyTheme();
        localStorage.setItem(this.STORAGE_KEY, this.isDark() ? 'dark' : 'light');
    }

    private applyTheme(): void {
        const html = document.documentElement;
        if (this.isDark()) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }
}
