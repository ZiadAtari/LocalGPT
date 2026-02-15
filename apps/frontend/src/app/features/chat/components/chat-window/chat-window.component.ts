/**
 * Chat Window Component (Smart Container)
 * ========================================
 * The primary view component. Connects to services/stores.
 * Based on: Docs/Apps/Client/SpecSheet.md § 3.1 & § 4.1
 *
 * Responsibilities:
 *   - Injects StreamService and ChatStore
 *   - Manages SSE connection lifecycle
 *   - Passes data down to dumb components via inputs
 */
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
// import { ChatStore } from '../../store/chat.store';
// import { StreamService } from '../../../core/services/stream.service';

@Component({
    selector: 'app-chat-window',
    standalone: true,
    template: `
    <div class="chat-window">
      <!-- TODO: <app-message-list [messages]="messages()" /> -->
      <!-- TODO: <app-thinking-bubble *ngIf="thinking()" [content]="thinking()" /> -->
      <!-- TODO: <app-input-area (messageSent)="onSend($event)" /> -->
      <p>Chat Window - Placeholder</p>
    </div>
  `,
    styles: [`
    .chat-window {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
  `],
})
export class ChatWindowComponent implements OnInit, OnDestroy {
    // TODO: Inject ChatStore and StreamService
    // TODO: Wire up signals for messages, thinking state, streaming status

    ngOnInit(): void {
        // TODO: Initialize SSE connection
    }

    ngOnDestroy(): void {
        // TODO: Clean up SSE connection
    }
}
