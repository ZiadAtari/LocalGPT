import { Routes } from '@angular/router';
import { ChatWindowComponent } from './features/chat/components/chat-window/chat-window.component';

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
