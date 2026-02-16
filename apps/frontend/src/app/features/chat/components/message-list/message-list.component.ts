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
}

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [MessageBubbleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
        <div class="message-list" #scrollContainer>
            @if (messages().length === 0) {
                <div class="empty-state">
                    <div class="empty-icon">🧠</div>
                    <h2 class="empty-title">LocalGPT</h2>
                    <p class="empty-subtitle">Your private AI assistant, running locally.</p>
                    <p class="empty-hint">Type a message below to start chatting.</p>
                </div>
            } @else {
                @for (msg of messages(); track msg.id) {
                    <app-message-bubble
                        [role]="msg.role"
                        [content]="msg.content"
                        [thought]="msg.thoughtProcess"
                        [streaming]="msg.isStreaming"
                        [timestamp]="msg.timestamp"
                    />
                }
            }
        </div>
    `,
  styles: [`
        .message-list {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
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
        }

        .empty-title {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
            background: linear-gradient(135deg, var(--accent), var(--accent-hover));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .empty-subtitle {
            font-size: 1rem;
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
        }

        .empty-hint {
            font-size: 0.8125rem;
            color: var(--text-muted);
            background: var(--surface-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 0.5rem 1rem;
        }
    `],
})
export class MessageListComponent implements AfterViewChecked {
  messages = input<ChatMessage[]>([]);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;
  private shouldAutoScroll = true;

  ngAfterViewChecked(): void {
    if (this.shouldAutoScroll) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }
}
