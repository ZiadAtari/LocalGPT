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
                <!-- Custom Glass Dropdown -->
                <div class="model-selector">
                    <button class="model-trigger" (click)="toggleDropdown()" [class.active]="dropdownOpen">
                        {{ selectedModel || 'Select Model' }}
                        <span class="chevron">▼</span>
                    </button>

                    @if (dropdownOpen) {
                        <div class="model-dropdown glass-panel">
                            @for (model of models(); track model) {
                                <button class="model-option" (click)="selectModel(model)">
                                    {{ model }}
                                </button>
                            }
                        </div>
                    }
                </div>

                @if (isStreaming()) {
                    <button class="send-btn stop" (click)="stopRequest.emit()" title="Stop generating">
                        <span class="btn-icon">⏹</span>
                    </button>
                } @else {
                    <button
                        class="send-btn"
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
        
        <!-- Backdrop for closing dropdown -->
        @if (dropdownOpen) {
            <div class="fixed-backdrop" (click)="dropdownOpen = false"></div>
        }

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
            gap: 12px;
            padding: 12px 16px;
            border-radius: 32px;
            transition: all 0.3s var(--spring-ease);
            background: rgba(30, 30, 35, 0.6);
            backdrop-filter: blur(20px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            position: relative;
            z-index: 20;
        }

        .input-surface:hover {
            background: rgba(40, 40, 45, 0.7);
            transform: scale(1.005);
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            border-color: rgba(255, 255, 255, 0.25);
        }

        /* Removed default blue focus ring, using custom glow */
        .input-surface:focus-within {
            background: rgba(50, 50, 60, 0.8);
            border-color: var(--accent);
            box-shadow: 0 0 0 1px var(--accent), 0 12px 40px rgba(0,0,0,0.4);
        }

        .chat-input {
            flex: 1;
            background: transparent;
            border: none;
            color: white;
            font-size: 1rem;
            line-height: 1.5;
            padding: 4px 0;
            resize: none;
            max-height: 200px;
            min-height: 24px;
            outline: none;
            font-family: inherit;
        }

        .chat-input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .input-controls {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding-bottom: 2px;
        }

        /* --- Send Button --- */
        .send-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            flex-shrink: 0;
            outline: none;
        }

        .send-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            background: transparent;
        }

        .send-btn:not(:disabled):hover {
            background: var(--accent);
            color: white;
            transform: scale(1.1);
        }

        .send-btn.stop {
            background: rgba(255, 59, 48, 0.2);
            color: #ff3b30;
        }

        .send-btn.stop:hover {
            background: #ff3b30;
            color: white;
        }

        /* --- Custom Model Selector --- */
        .model-selector {
            position: relative;
        }

        .model-trigger {
            height: 32px;
            padding: 0 12px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.2s;
            outline: none;
        }

        .model-trigger:hover, .model-trigger.active {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            border-color: rgba(255, 255, 255, 0.3);
        }

        .chevron {
            font-size: 0.6rem;
            opacity: 0.5;
            transition: transform 0.2s;
        }
        
        .model-trigger.active .chevron {
            transform: rotate(180deg);
        }

        .model-dropdown {
            position: absolute;
            bottom: 110%;
            right: 0;
            background: rgba(30, 30, 35, 0.95);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            padding: 6px;
            min-width: 180px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 2px;
            transform-origin: bottom right;
            animation: springUp 0.3s var(--spring-ease);
        }
        
        @keyframes springUp {
            from { opacity: 0; transform: scale(0.9) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .model-option {
            width: 100%;
            text-align: left;
            padding: 10px 12px;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            border-radius: 10px;
            font-size: 0.85rem;
            transition: all 0.1s;
        }

        .model-option:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        /* Backdrop to handle click-outside */
        .fixed-backdrop {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 10;
            cursor: default;
        }

        .input-footer {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
            opacity: 0.5;
            transition: opacity 0.2s;
        }

        .input-surface:focus-within + .input-footer {
            opacity: 0.9;
        }

        .footer-tip {
            font-size: 0.75rem;
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
    dropdownOpen = false;

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

        if (this.textArea) {
            this.textArea.nativeElement.style.height = 'auto';
        }
    }

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }

    selectModel(model: string) {
        this.selectedModel = model;
        this.modelChange.emit(model);
        this.dropdownOpen = false;
    }
}
