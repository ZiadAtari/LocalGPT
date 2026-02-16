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

    /** 
     * Signal holding the current theme state.
     * True = Dark Mode, False = Light Mode.
     */
    isDark = signal(true);

    constructor() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            this.isDark.set(stored === 'dark');
        }
        this.applyTheme();
    }

    /**
     * Toggles the theme between Dark and Light.
     * Updates the signal and persists preference to localStorage.
     */
    toggle(): void {
        this.isDark.update((v) => !v);
        this.applyTheme();
        localStorage.setItem(this.STORAGE_KEY, this.isDark() ? 'dark' : 'light');
    }

    /**
     * Applies the current theme by adding/removing the 'dark' class 
     * to the <html> document element (Tailwind strategy).
     */
    private applyTheme(): void {
        const html = document.documentElement;
        if (this.isDark()) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }
}
