/**
 * Input Area Component
 * ====================
 * Text input with send button, model selector, and file attachment.
 * Dumb component — emits events, doesn't know about services.
 */
import { Component, output, input, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface AttachedFile {
    file: File;
    name: string;
    size: string;
    status: 'pending' | 'uploading' | 'ready' | 'error';
}

@Component({
    selector: 'app-input-area',
    standalone: true,
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="input-wrapper" 
             [class.drag-over]="isDragOver"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)">

            <!-- Drag overlay -->
            @if (isDragOver) {
                <div class="drag-overlay">
                    <div class="drag-content">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>Drop files to attach</span>
                    </div>
                </div>
            }

            <!-- Attachment pills -->
            @if (attachments.length > 0) {
                <div class="attachment-bar">
                    @for (att of attachments; track att.name) {
                        <div class="attachment-pill" [class.uploading]="att.status === 'uploading'" [class.error]="att.status === 'error'">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            <span class="att-name">{{ att.name }}</span>
                            <span class="att-size">{{ att.size }}</span>
                            <button class="att-remove" (click)="removeAttachment(att)" title="Remove">×</button>
                        </div>
                    }
                </div>
            }

            <div class="input-surface glass-panel floating-shadow">
                <!-- Attach button -->
                <button class="attach-btn" (click)="fileInput.click()" title="Attach file" [disabled]="isStreaming()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                </button>
                <input #fileInput type="file" (change)="onFileSelected($event)" accept=".pdf,.txt,.md,.csv,.json" multiple style="display: none" />

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
                            [disabled]="!text.trim() && attachments.length === 0"
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
                <span class="footer-tip">📎 <strong>Drag & Drop</strong> files</span>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
            width: 100%;
        }

        .input-wrapper {
            position: relative;
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

        .input-surface:focus-within {
            background: rgba(50, 50, 60, 0.8);
            border-color: var(--accent);
            box-shadow: 0 0 0 1px var(--accent), 0 12px 40px rgba(0,0,0,0.4);
        }

        .input-wrapper.drag-over .input-surface {
            border-color: var(--accent);
            box-shadow: 0 0 0 2px var(--accent), 0 0 40px rgba(88, 166, 255, 0.3);
        }

        /* --- Drag Overlay --- */
        .drag-overlay {
            position: absolute;
            inset: 0;
            background: rgba(88, 166, 255, 0.1);
            backdrop-filter: blur(8px);
            border-radius: 32px;
            border: 2px dashed var(--accent);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .drag-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            color: var(--accent);
            font-size: 0.9rem;
            font-weight: 500;
        }

        /* --- Attachment Bar --- */
        .attachment-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 0 8px;
            margin-bottom: 8px;
            animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .attachment-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            border-radius: 12px;
            background: rgba(88, 166, 255, 0.15);
            border: 1px solid rgba(88, 166, 255, 0.3);
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.8rem;
            animation: fadeIn 0.2s ease-out;
        }

        .attachment-pill.uploading {
            opacity: 0.6;
            animation: pulse 1.5s infinite;
        }

        .attachment-pill.error {
            background: rgba(255, 59, 48, 0.15);
            border-color: rgba(255, 59, 48, 0.3);
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }

        .att-name {
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .att-size {
            color: rgba(255, 255, 255, 0.4);
            font-size: 0.7rem;
        }

        .att-remove {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            font-size: 1rem;
            padding: 0 2px;
            line-height: 1;
            transition: color 0.1s;
        }

        .att-remove:hover {
            color: #ff3b30;
        }

        /* --- Attach Button --- */
        .attach-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.5);
            flex-shrink: 0;
            outline: none;
        }

        .attach-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            transform: scale(1.1);
        }

        .attach-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
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

        .input-surface:focus-within ~ .input-footer {
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
/**
 * Input Area Component
 * ====================
 * Text input with send button, model selector, and file attachment.
 * Dumb component — emits events, doesn't know about services.
 */
@Component({ ... })
export class InputAreaComponent {
    // Inputs from Smart Parent
    isStreaming = input(false);
    models = input<string[]>(['deepseek-r1']);

    // Outputs to Smart Parent
    sendMessage = output<string>();
    stopRequest = output<void>();
    modelChange = output<string>();
    fileAttached = output<File>();

    // Local State
    text = '';
    selectedModel = 'deepseek-r1';
    dropdownOpen = false;
    isDragOver = false;
    attachments: AttachedFile[] = [];

    @ViewChild('textArea') textArea!: ElementRef<HTMLTextAreaElement>;

    /**
     * Handles Enter key to send (Shift+Enter for newline).
     */
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.send();
        }
    }

    /**
     * Emits the message to the parent and clears local input.
     * Also auto-resizes the textarea back to default.
     */
    send(): void {
        const trimmed = this.text.trim();
        if (!trimmed && this.attachments.length === 0) return;

        this.sendMessage.emit(trimmed || '(File attached)');
        this.text = '';
        this.attachments = [];

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

    // --- File Handling ---

    /**
     * Triggered by hidden file input change.
     */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.addFiles(Array.from(input.files));
        }
        input.value = ''; // Reset so same file can be re-selected
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;
    }

    /**
     * Handles file drops. Adds files to attachment list and emits event.
     */
    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver = false;

        if (event.dataTransfer?.files) {
            this.addFiles(Array.from(event.dataTransfer.files));
        }
    }

    removeAttachment(att: AttachedFile): void {
        this.attachments = this.attachments.filter(a => a !== att);
    }

    private addFiles(files: File[]): void {
        for (const file of files) {
            const att: AttachedFile = {
                file,
                name: file.name,
                size: this.formatSize(file.size),
                status: 'pending',
            };
            this.attachments.push(att);
            this.fileAttached.emit(file);
        }
    }

    /** Utility to format bytes into KB/MB */
    private formatSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}
