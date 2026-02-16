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
                        <div class="avatar-ai">
                            <span class="sparkle">✨</span>
                        </div>
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
            margin-bottom: 2rem;
            padding: 0 1rem;
            animation: slideUp 0.4s var(--spring-ease);
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .message-row.user {
            justify-content: flex-end;
        }

        .message-row.assistant {
            justify-content: flex-start;
        }

        .message-container {
            display: flex;
            gap: 16px;
            max-width: 80%;
        }

        .user .message-container {
            flex-direction: row-reverse;
        }

        .message-avatar {
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .avatar-user {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.7rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .avatar-ai {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(135deg, #FF2E93, #FF8800);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(255, 46, 147, 0.4);
        }

        .sparkle {
            font-size: 1.2rem;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .message-content-wrapper {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 0;
        }

        .user .message-content-wrapper {
            align-items: flex-end;
        }

        .message-bubble {
            padding: 16px 20px;
            border-radius: 20px;
            font-size: 1rem;
            line-height: 1.6;
            color: white;
            position: relative;
        }

        /* --- User Bubble: Immersive Gradient --- */
        .user .message-bubble {
            background: var(--accent-gradient);
            border-bottom-right-radius: 4px;
            box-shadow: 0 8px 20px rgba(10, 132, 255, 0.3);
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* --- Assistant Bubble: Glass Material --- */
        .assistant .message-bubble {
            background: rgba(60, 60, 70, 0.6);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-bottom-left-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .message-meta {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.4);
            margin-top: 4px;
            padding: 0 4px;
        }
    `],
})
/**
 * Message Bubble Component
 * ========================
 * Renders a single chat message (user or assistant).
 * Dumb component — receives data via input.
 */
@Component({ ... })
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
     * 
     * Note: In a production app, we would use a library like 'marked' or 'ngx-markdown'.
     * This regex-based implementation is for zero-dependency simplicity.
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
