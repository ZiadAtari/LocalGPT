import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./features/chat/components/chat-window/chat-window.component').then(
                (m) => m.ChatWindowComponent,
            ),
    },
    {
        path: 'chat/:id',
        loadComponent: () =>
            import('./features/chat/components/chat-window/chat-window.component').then(
                (m) => m.ChatWindowComponent,
            ),
    },
    { path: '**', redirectTo: '' },
];
