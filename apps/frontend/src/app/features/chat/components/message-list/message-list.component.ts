/**
 * Message List Component
 * ======================
 * Scrollable list of messages with auto-scroll on new messages.
 * Dumb component.
 */
import {
    Component,
    input,
    ChangeDetectionStrategy,
    ElementRef,
    ViewChild,
    AfterViewChecked,
} from '@angular/core';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    thoughtProcess: string;
    isStreaming: boolean;
    timestamp: Date;
    attachments?: { name: string; size: string }[];
}

/**
 * Message List Component
 * ======================
 * Scrollable list of messages with auto-scroll on new messages.
 * Dumb component.
 */
@Component({
    selector: 'app-message-list',
    standalone: true,
    imports: [MessageBubbleComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="message-list-viewport" #scrollContainer>
            @if (messages().length === 0) {
                <div class="empty-state">
                    <div class="empty-icon">🧠</div>
                    <h2 class="empty-title">LocalGPT</h2>
                    <p class="empty-subtitle">Your private AI assistant, running locally.</p>
                    <p class="empty-hint">Type a message below to start chatting.</p>
                </div>
            } @else {
                <div class="message-content">
                    @for (msg of messages(); track msg.id) {
                        <app-message-bubble
                            [role]="msg.role"
                            [content]="msg.content"
                            [thought]="msg.thoughtProcess"
                            [streaming]="msg.isStreaming"
                            [timestamp]="msg.timestamp"
                            [attachments]="msg.attachments || []"
                            />
                    }
                </div>
            }
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            flex: 1;
            overflow: hidden; /* Contain inner scroll */
            min-height: 0;    /* Flexbox nesting fix */
        }

        .message-list-viewport {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
            padding: 1rem 0;
            display: flex;
            flex-direction: column;
        }

        .message-content {
            display: flex;
            flex-direction: column;
            justify-content: flex-start; /* Start from top */
            min-height: min-content;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1; /* Take full height to center content */
            text-align: center;
            padding: 2rem;
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            filter: grayscale(0.2);
            opacity: 0.8;
            animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .empty-title {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--accent), #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
        }

        .empty-subtitle {
            font-size: 1.1rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
            max-width: 400px;
            line-height: 1.5;
        }

        .empty-hint {
            font-size: 0.85rem;
            color: var(--text-muted);
            background: var(--surface-tertiary);
            border: 1px solid var(--border);
            border-radius: 2rem;
            padding: 0.5rem 1.25rem;
            backdrop-filter: blur(4px);
        }
    `],
})
export class MessageListComponent implements AfterViewChecked {
    messages = input<ChatMessage[]>([]);

    @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;
    private shouldAutoScroll = true;

    /**
     * Called after every view check (render).
     * Checks if we need to stick to the bottom.
     */
    ngAfterViewChecked(): void {
        if (this.shouldAutoScroll) {
            this.scrollToBottom();
        }
    }

    /**
     * Force scrolls the container to the bottom.
     * Typical for chat interfaces when a new message arrives.
     */
    private scrollToBottom(): void {
        const el = this.scrollContainer?.nativeElement;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    }
}
