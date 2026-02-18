import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * App Root Component
 * ==================
 * The entry point for the Angular application.
 * Contains the main router outlet and global layout styles.
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    template: `<router-outlet></router-outlet>`,
    styles: [`
        :host {
            display: block;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }
    `],
})
export class AppComponent { }
