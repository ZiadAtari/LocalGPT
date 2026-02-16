/**
 * Chat Window Component (Smart Container)
 * ========================================
 * The main chat view — owns the conversation lifecycle.
 * Connects: ChatStore, StreamService, ApiService, ThemeService.
 */
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatStore } from '../../chat.store';
import { StreamService, StreamPacket } from '../../../../core/services/stream.service';
import { ApiService, ConversationSummary } from '../../../../core/services/api.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { MessageListComponent } from '../message-list/message-list.component';
import { InputAreaComponent } from '../input-area/input-area.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [MessageListComponent, InputAreaComponent],
  template: `
        <div class="chat-layout">
            <!-- Sidebar -->
            <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
                <div class="sidebar-header">
                    <h1 class="brand">
                        <span class="brand-icon">🧠</span>
                        <span class="brand-text">LocalGPT</span>
                    </h1>
                    <button class="icon-btn" (click)="sidebarCollapsed = !sidebarCollapsed" title="Toggle sidebar">
                        ☰
                    </button>
                </div>

                <button class="new-chat-btn" (click)="startNewChat()">
                    <span>+</span> New Chat
                </button>

                <div class="conversation-list">
                    @for (conv of conversations; track conv.id) {
                        <button
                            class="conv-item"
                            [class.active]="conv.id === store.conversationId()"
                            (click)="loadConversation(conv.id)"
                        >
                            <span class="conv-title">{{ conv.title }}</span>
                            <span class="conv-date">{{ formatDate(conv.updatedAt) }}</span>
                        </button>
                    }
                </div>

                <div class="sidebar-footer">
                    <button class="icon-btn theme-toggle" (click)="theme.toggle()" title="Toggle theme">
                        {{ theme.isDark() ? '☀️' : '🌙' }}
                    </button>
                    <span class="model-label">{{ store.selectedModel() }}</span>
                </div>
            </aside>

            <!-- Main Chat Area -->
            <main class="chat-main">
                <app-message-list [messages]="store.messages()" />
                <app-input-area
                    [isStreaming]="store.isStreaming()"
                    [models]="availableModels"
                    (sendMessage)="onSend($event)"
                    (stopRequest)="onStop()"
                    (modelChange)="store.selectedModel.set($event)"
                />
            </main>
        </div>
    `,
  styles: [`
        .chat-layout {
            display: flex;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }

        /* ---- Sidebar ---- */
        .sidebar {
            width: 260px;
            min-width: 260px;
            background: var(--surface-secondary);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            transition: min-width 0.25s ease, width 0.25s ease, opacity 0.25s ease;
            overflow: hidden;
        }

        .sidebar.collapsed {
            min-width: 0;
            width: 0;
            border-right: none;
        }

        .sidebar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border);
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
            font-weight: 700;
        }

        .brand-icon {
            font-size: 1.25rem;
        }

        .brand-text {
            background: linear-gradient(135deg, var(--accent), var(--accent-hover));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .icon-btn {
            background: none;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            cursor: pointer;
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            transition: all 0.15s;
        }

        .icon-btn:hover {
            background: var(--surface-hover);
            color: var(--text-primary);
        }

        .new-chat-btn {
            margin: 0.75rem;
            padding: 0.5rem 1rem;
            background: var(--accent-muted);
            border: 1px dashed var(--accent);
            border-radius: var(--radius-md);
            color: var(--accent);
            font-size: 0.8125rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
        }

        .new-chat-btn:hover {
            background: var(--accent);
            color: white;
            border-style: solid;
        }

        .conversation-list {
            flex: 1;
            overflow-y: auto;
            padding: 0.25rem 0.5rem;
        }

        .conv-item {
            width: 100%;
            text-align: left;
            background: none;
            border: none;
            border-radius: var(--radius-sm);
            padding: 0.5rem 0.75rem;
            margin-bottom: 2px;
            cursor: pointer;
            transition: background 0.15s;
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
        }

        .conv-item:hover {
            background: var(--surface-hover);
        }

        .conv-item.active {
            background: var(--accent-muted);
        }

        .conv-title {
            font-size: 0.8125rem;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .conv-date {
            font-size: 0.6875rem;
            color: var(--text-muted);
        }

        .sidebar-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--border);
        }

        .theme-toggle {
            font-size: 1rem;
        }

        .model-label {
            font-size: 0.6875rem;
            color: var(--text-muted);
            background: var(--surface-tertiary);
            padding: 0.15rem 0.5rem;
            border-radius: var(--radius-sm);
        }

        /* ---- Main Chat ---- */
        .chat-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            background: var(--surface-primary);
        }
    `],
})
export class ChatWindowComponent implements OnInit, OnDestroy {
  store = inject(ChatStore);
  private stream = inject(StreamService);
  private api = inject(ApiService);
  theme = inject(ThemeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  conversations: ConversationSummary[] = [];
  availableModels: string[] = ['deepseek-r1'];
  sidebarCollapsed = false;

  private streamSub: Subscription | null = null;
  private routeSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadConversations();
    this.loadModels();

    // Route param handling
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadConversation(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
    this.routeSub?.unsubscribe();
    this.stream.disconnect();
  }

  async startNewChat(): Promise<void> {
    this.store.reset();
    this.api.initConversation().subscribe({
      next: ({ conversationId }) => {
        this.store.setConversation(conversationId);
        this.loadConversations();
        this.router.navigate(['/chat', conversationId]);
      },
      error: (err) => console.error('Failed to create conversation:', err),
    });
  }

  loadConversation(id: string): void {
    this.api.getConversation(id).subscribe({
      next: (conv) => {
        const msgs = conv.messages.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          thoughtProcess: m.thoughtProcess ?? '',
          isStreaming: false,
          timestamp: new Date(m.createdAt),
        }));
        this.store.setConversation(id, msgs);
      },
    });
  }

  onSend(message: string): void {
    // Auto-create conversation if none active
    if (!this.store.conversationId()) {
      this.api.initConversation().subscribe({
        next: ({ conversationId }) => {
          this.store.setConversation(conversationId);
          this.router.navigate(['/chat', conversationId]);
          this.loadConversations();
          this.sendMessage(conversationId, message);
        },
      });
    } else {
      this.sendMessage(this.store.conversationId()!, message);
    }
  }

  onStop(): void {
    const convId = this.store.conversationId();
    if (convId) {
      this.api.stopStream(convId).subscribe();
    }
    this.stream.disconnect();
    this.store.finishStreaming();
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  }

  private sendMessage(conversationId: string, message: string): void {
    this.store.addUserMessage(message);
    this.store.startAssistantMessage();

    this.streamSub?.unsubscribe();
    this.streamSub = this.stream
      .connect(conversationId, message, this.store.selectedModel())
      .subscribe({
        next: (packet: StreamPacket) => {
          switch (packet.type) {
            case 'token':
              this.store.appendToken(packet.payload as string);
              break;
            case 'thought':
              this.store.appendThought(packet.payload as string);
              break;
            case 'done':
              this.store.finishStreaming();
              this.loadConversations(); // Refresh sidebar
              break;
            case 'error':
              console.error('Stream error:', packet.payload);
              this.store.setError();
              break;
          }
        },
        error: (err) => {
          console.error('Stream connection error:', err);
          this.store.setError();
        },
      });
  }

  private loadConversations(): void {
    this.api.listConversations().subscribe({
      next: (convs) => (this.conversations = convs),
    });
  }

  private loadModels(): void {
    this.api.listModels().subscribe({
      next: (models) => {
        if (models.length > 0) {
          this.availableModels = models.map((m) => m.name);
        }
      },
    });
  }
}
