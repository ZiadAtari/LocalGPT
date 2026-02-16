/**
 * Message Bubble Component
 * ========================
 * Renders a single chat message (user or assistant).
 * Dumb component — receives data via input.
 */
import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { ThinkingBubbleComponent } from '../thinking-bubble/thinking-bubble.component';

@Component({
    selector: 'app-message-bubble',
    standalone: true,
    imports: [ThinkingBubbleComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="message-row" [class.user]="isUser()" [class.assistant]="!isUser()">
            <div class="message-container">
                <div class="message-avatar">
                    @if (isUser()) {
                        <div class="avatar-user">You</div>
                    } @else {
                        <div class="avatar-ai">⚡</div>
                    }
                </div>
                
                <div class="message-content-wrapper">
                    @if (!isUser() && thought()) {
                        <app-thinking-bubble
                            [content]="thought()"
                            [isStreaming]="streaming()"
                        />
                    }

                    <div class="message-bubble" [class.streaming]="streaming()">
                        <div
                            class="markdown-content"
                            [class.streaming-cursor]="streaming()"
                            [innerHTML]="renderedContent()"
                        ></div>
                    </div>
                    
                    <div class="message-meta">
                        {{ timeLabel() }}
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .message-row {
            display: flex;
            margin-bottom: 1.5rem;
            padding: 0 1rem;
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .message-row.user {
            justify-content: flex-end;
        }

        .message-row.assistant {
            justify-content: flex-start;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message-container {
            display: flex;
            gap: 1rem;
            max-width: 85%;
        }

        .user .message-container {
            flex-direction: row-reverse;
        }

        .message-avatar {
            flex-shrink: 0;
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .avatar-user {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: var(--surface-tertiary);
            color: var(--text-secondary);
            font-size: 0.75rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border);
        }

        .avatar-ai {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: var(--accent-gradient);
            color: white;
            font-size: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px var(--accent-glow);
        }

        .message-content-wrapper {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            min-width: 0; /* Text wrap fix */
        }

        .user .message-content-wrapper {
            align-items: flex-end;
        }

        .message-bubble {
            padding: 1rem 1.25rem;
            border-radius: 1.25rem;
            position: relative;
            word-break: break-word;
            line-height: 1.6;
            font-size: 0.95rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .user .message-bubble {
            background: var(--user-bubble-bg);
            color: var(--user-bubble-text);
            border-bottom-right-radius: 0.25rem;
        }

        .assistant .message-bubble {
            background: var(--assistant-bubble-bg);
            border: 1px solid var(--assistant-bubble-border);
            color: var(--text-primary);
            border-bottom-left-radius: 0.25rem;
            backdrop-filter: blur(8px);
        }

        .message-meta {
            font-size: 0.7rem;
            color: var(--text-muted);
            opacity: 0.8;
            margin-top: 0.25rem;
        }
    `],
})
export class MessageBubbleComponent {
    role = input<'user' | 'assistant' | 'system'>('user');
    content = input('');
    thought = input('');
    streaming = input(false);
    timestamp = input(new Date());

    isUser = computed(() => this.role() === 'user');

    timeLabel = computed(() => {
        const d = this.timestamp();
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    /**
     * Simple markdown-to-HTML conversion for inline rendering.
     * Handles: **bold**, *italic*, `code`, ```code blocks```, links, lists.
     */
    renderedContent = computed(() => {
        let text = this.content();
        if (!text) return '';

        // Escape HTML
        text = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Code blocks (```)
        text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Italic
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Line breaks
        text = text.replace(/\n/g, '<br>');

        return text;
    });
}
