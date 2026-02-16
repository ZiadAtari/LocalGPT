import { Routes } from '@angular/router';
import { ChatWindowComponent } from './features/chat/components/chat-window/chat-window.component';

/**
 * Application Routes
 * ==================
 * Defines the navigation structure.
 * - / : Redirects to Chat Window
 * - /chat/:id : Loads a specific conversation
 */
export const routes: Routes = [
    {
        path: '',
        component: ChatWindowComponent,
    },
    {
        path: 'chat/:id',
        component: ChatWindowComponent,
    },
    { path: '**', redirectTo: '' },
];
