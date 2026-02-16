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
        <div class="input-wrapper">
            <div class="input-container">
                <textarea
                    #textArea
                    [(ngModel)]="text"
                    (keydown)="onKeyDown($event)"
                    [placeholder]="isStreaming() ? 'Waiting for response...' : 'Message LocalGPT...'"
                    [disabled]="isStreaming()"
                    rows="1"
                    class="chat-input"
                ></textarea>
                <div class="input-actions">
                    <select
                        [(ngModel)]="selectedModel"
                        (ngModelChange)="modelChange.emit($event)"
                        class="model-select"
                    >
                        @for (model of models(); track model) {
                            <option [value]="model">{{ model }}</option>
                        }
                    </select>

                    @if (isStreaming()) {
                        <button class="stop-btn" (click)="stopRequest.emit()" title="Stop generating">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="3" y="3" width="10" height="10" rx="1"/>
                            </svg>
                        </button>
                    } @else {
                        <button
                            class="send-btn"
                            (click)="send()"
                            [disabled]="!text.trim()"
                            title="Send message"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M1.5 1.5l13 6.5-13 6.5V9l8-1-8-1V1.5z"/>
                            </svg>
                        </button>
                    }
                </div>
            </div>
            <p class="input-hint">
                <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
            </p>
        </div>
    `,
  styles: [`
        .input-wrapper {
            padding: 0.75rem 1rem 1rem;
            background: var(--surface-primary);
            border-top: 1px solid var(--border);
        }

        .input-container {
            display: flex;
            align-items: flex-end;
            gap: 0.5rem;
            background: var(--surface-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 0.5rem 0.5rem 0.5rem 1rem;
            transition: border-color 0.2s;
        }

        .input-container:focus-within {
            border-color: var(--accent);
        }

        .chat-input {
            flex: 1;
            border: none;
            background: transparent;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 0.9375rem;
            line-height: 1.5;
            resize: none;
            outline: none;
            max-height: 8rem;
            overflow-y: auto;
        }

        .chat-input::placeholder {
            color: var(--text-muted);
        }

        .chat-input:disabled {
            opacity: 0.5;
        }

        .input-actions {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            flex-shrink: 0;
        }

        .model-select {
            background: var(--surface-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            font-size: 0.75rem;
            padding: 0.25rem 0.4rem;
            outline: none;
            cursor: pointer;
            max-width: 120px;
        }

        .send-btn, .stop-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            border: none;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s;
        }

        .send-btn {
            background: var(--accent);
            color: white;
        }

        .send-btn:hover:not(:disabled) {
            background: var(--accent-hover);
            transform: scale(1.05);
        }

        .send-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .stop-btn {
            background: var(--error);
            color: white;
        }

        .stop-btn:hover {
            opacity: 0.85;
        }

        .input-hint {
            text-align: center;
            font-size: 0.6875rem;
            color: var(--text-muted);
            margin-top: 0.375rem;
        }

        .input-hint kbd {
            background: var(--surface-tertiary);
            border: 1px solid var(--border);
            border-radius: 3px;
            padding: 0 0.25rem;
            font-family: inherit;
            font-size: 0.625rem;
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
