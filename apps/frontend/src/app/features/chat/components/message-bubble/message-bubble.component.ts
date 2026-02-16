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
        <div class="message" [class.user]="isUser()" [class.assistant]="!isUser()">
            <div class="message-avatar">
                {{ isUser() ? '👤' : '🤖' }}
            </div>
            <div class="message-body">
                <div class="message-header">
                    <span class="message-role">{{ isUser() ? 'You' : 'LocalGPT' }}</span>
                    <span class="message-time">{{ timeLabel() }}</span>
                </div>

                @if (!isUser() && thought()) {
                    <app-thinking-bubble
                        [content]="thought()"
                        [isStreaming]="streaming()"
                    />
                }

                <div
                    class="message-content markdown-content"
                    [class.streaming-cursor]="streaming()"
                    [innerHTML]="renderedContent()"
                ></div>
            </div>
        </div>
    `,
  styles: [`
        .message {
            display: flex;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            animation: slideUp 0.25s ease-out;
        }

        @keyframes slideUp {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message.user {
            background: var(--user-bubble);
        }

        .message.assistant {
            background: var(--assistant-bubble);
        }

        .message-avatar {
            flex-shrink: 0;
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            border-radius: var(--radius-sm);
            background: var(--surface-tertiary);
        }

        .message-body {
            flex: 1;
            min-width: 0;
        }

        .message-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.375rem;
        }

        .message-role {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .message-time {
            font-size: 0.6875rem;
            color: var(--text-muted);
        }

        .message-content {
            font-size: 0.9375rem;
            line-height: 1.7;
            color: var(--text-primary);
            word-break: break-word;
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
