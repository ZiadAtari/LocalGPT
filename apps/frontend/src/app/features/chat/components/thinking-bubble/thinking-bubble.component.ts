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
                        <div class="thinking-icon-wrapper">
                            <span class="thinking-icon">💭</span>
                        </div>
                        <span class="thinking-label">Reasoning Process</span>
                        @if (isStreaming()) {
                            <span class="thinking-live">thinking...</span>
                        }
                    </summary>
                    <div class="thinking-content-wrapper">
                        <div class="thinking-content">{{ text }}</div>
                    </div>
                </details>
            }
        }
    `,
    styles: [`
        .thinking-bubble {
            background: var(--thinking-bg);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            margin-bottom: 0.5rem;
            overflow: hidden;
            animation: fadeIn 0.3s ease-out;
            max-width: 600px;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .thinking-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem 0.8rem;
            cursor: pointer;
            user-select: none;
            transition: background 0.2s;
        }

        .thinking-header:hover {
            background: rgba(255,255,255,0.03);
        }

        /* Hide summary marker */
        .thinking-header::-webkit-details-marker {
            display: none;
        }
        .thinking-header {
            list-style: none;
        }

        .thinking-icon-wrapper {
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            background: rgba(255,255,255,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .thinking-icon {
            font-size: 0.8rem;
        }

        .thinking-label {
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--text-secondary);
        }

        .thinking-live {
            font-size: 0.65rem;
            color: var(--accent);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
            animation: pulse 2s ease-in-out infinite;
            margin-left: auto;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }

        .thinking-content-wrapper {
            border-top: 1px solid var(--border);
            background: rgba(0,0,0,0.1);
        }

        .thinking-content {
            padding: 0.75rem 1rem;
            font-size: 0.8rem;
            line-height: 1.6;
            color: var(--text-muted);
            white-space: pre-wrap;
            max-height: 250px;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
        }
    `],
})
/**
 * Thinking Bubble Component
 * =========================
 * Collapsible details element showing the model's reasoning process.
 * Dumb component — receives content via input.
 */
@Component({ ... })
export class ThinkingBubbleComponent {
    /** The raw text content of the reasoning process */
    content = input('');

    /** Whether the model is currently generating thoughts */
    isStreaming = input(false);
}
