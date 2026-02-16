/**
 * Input Area Component
 * ====================
 * Text input with send button and model selector.
 * Dumb component — emits events, doesn't know about services.
 */
import { Component, output, input, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-input-area',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="input-surface glass-panel floating-shadow">
            <textarea
                #textArea
                [(ngModel)]="text"
                (keydown)="onKeyDown($event)"
                [placeholder]="isStreaming() ? 'AI is thinking...' : 'Message LocalGPT...'"
                [disabled]="isStreaming()"
                rows="1"
                class="chat-input"
            ></textarea>
            
            <div class="input-controls">
                <div class="model-badge">
                    <select
                        [(ngModel)]="selectedModel"
                        (ngModelChange)="modelChange.emit($event)"
                        class="model-select"
                    >
                        @for (model of models(); track model) {
                            <option [value]="model">{{ model }}</option>
                        }
                    </select>
                    <span class="chevron">▼</span>
                </div>

                @if (isStreaming()) {
                    <button class="action-btn stop" (click)="stopRequest.emit()" title="Stop generating">
                        <span class="btn-icon">⏹</span>
                    </button>
                } @else {
                    <button
                        class="action-btn send"
                        (click)="send()"
                        [disabled]="!text.trim()"
                        title="Send message"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                }
            </div>
        </div>
        <div class="input-footer">
            <span class="footer-tip"><strong>Enter</strong> to send</span>
            <span class="footer-tip"><strong>Shift+Enter</strong> for new line</span>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            width: 100%;
        }

        .input-surface {
            display: flex;
            align-items: flex-end;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            border-radius: 1.5rem;
            transition: border-color 0.2s, box-shadow 0.2s;
            background: rgba(30, 30, 40, 0.6); /* Default Dark Mode */
            border: 1px solid transparent; /* Smooth border transition */
        }

        :host-context(html:not(.dark)) .input-surface {
            background: #ffffff;
            border-color: var(--border);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .input-surface:focus-within {
            border-color: var(--accent);
            box-shadow: 0 0 0 1px var(--accent), 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        :host-context(html:not(.dark)) .input-surface:focus-within {
            box-shadow: 0 0 0 1px var(--accent), 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .chat-input {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 0.95rem;
            line-height: 1.5;
            resize: none;
            outline: none;
            max-height: 120px;
            padding: 0.25rem 0;
        }

        .chat-input::placeholder {
            color: var(--text-muted);
        }

        .input-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding-bottom: 0.125rem; /* Align with text baseline */
        }

        .model-badge {
            position: relative;
            background: var(--surface-tertiary);
            border-radius: 2rem;
            padding: 0 0.75rem 0 0.75rem;
            height: 2rem;
            display: flex;
            align-items: center;
            border: 1px solid var(--border);
            transition: all 0.2s;
        }

        .model-badge:hover {
            border-color: var(--text-secondary);
            background: var(--surface-hover);
        }

        .model-select {
            appearance: none;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-size: 0.75rem;
            font-weight: 500;
            width: 100%;
            cursor: pointer;
            outline: none;
            padding-right: 0.25rem;
        }

        .model-select:hover {
            color: var(--text-primary);
        }

        .chevron {
            font-size: 0.5rem;
            color: var(--text-muted);
            pointer-events: none;
            margin-left: 0.25rem;
        }

        .action-btn {
            width: 2.25rem;
            height: 2.25rem;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-btn.send {
            background: var(--text-primary); /* White/Black input contrast */
            color: var(--surface-primary);
        }

        .action-btn.send:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
        }
        
        /* In light mode, reverse the contrast */
        :host-context(html:not(.dark)) .action-btn.send {
            background: var(--surface-primary);
            color: var(--text-primary);
        }

        .action-btn.send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .action-btn.stop {
            background: var(--surface-tertiary);
            border: 1px solid var(--border);
            color: var(--text-primary);
        }

        .action-btn.stop:hover {
            border-color: #ef4444;
            color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
        }

        .btn-icon {
            font-size: 0.75rem;
        }

        .input-footer {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 0.75rem;
            opacity: 0.6;
            transition: opacity 0.2s;
        }

        .input-surface:focus-within + .input-footer {
            opacity: 1;
        }

        .footer-tip {
            font-size: 0.7rem;
            color: var(--text-muted);
        }

        .footer-tip strong {
            font-weight: 600;
            color: var(--text-secondary);
        }
    `],
})
export class InputAreaComponent {
    isStreaming = input(false);
    models = input<string[]>(['deepseek-r1']);

    sendMessage = output<string>();
    stopRequest = output<void>();
    modelChange = output<string>();

    text = '';
    selectedModel = 'deepseek-r1';

    @ViewChild('textArea') textArea!: ElementRef<HTMLTextAreaElement>;

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.send();
        }
    }

    send(): void {
        const trimmed = this.text.trim();
        if (!trimmed) return;

        this.sendMessage.emit(trimmed);
        this.text = '';

        // Reset textarea height
        if (this.textArea) {
            this.textArea.nativeElement.style.height = 'auto';
        }
    }
}
