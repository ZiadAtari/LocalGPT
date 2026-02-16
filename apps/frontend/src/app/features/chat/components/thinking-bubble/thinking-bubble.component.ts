/**
 * Thinking Bubble Component
 * =========================
 * Collapsible details element showing the model's reasoning process.
 * Dumb component — receives content via input.
 */
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-thinking-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
        @if (content(); as text) {
            @if (text.length > 0) {
                <details class="thinking-bubble" [open]="isStreaming()">
                    <summary class="thinking-header">
                        <span class="thinking-icon">💭</span>
                        <span>Reasoning Process</span>
                        @if (isStreaming()) {
                            <span class="thinking-live">thinking...</span>
                        }
                    </summary>
                    <div class="thinking-content">{{ text }}</div>
                </details>
            }
        }
    `,
  styles: [`
        .thinking-bubble {
            background: var(--thinking-bg);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            margin-bottom: 0.5rem;
            overflow: hidden;
            animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .thinking-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            font-size: 0.8125rem;
            color: var(--text-secondary);
            user-select: none;
        }

        .thinking-header:hover {
            color: var(--text-primary);
        }

        .thinking-icon {
            font-size: 0.875rem;
        }

        .thinking-live {
            font-size: 0.6875rem;
            color: var(--accent);
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }

        .thinking-content {
            padding: 0 0.75rem 0.75rem;
            font-size: 0.8125rem;
            line-height: 1.6;
            color: var(--text-muted);
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
    `],
})
export class ThinkingBubbleComponent {
  content = input('');
  isStreaming = input(false);
}
