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
            <!-- Ambient Background Blob -->
            <div class="ambient-glow"></div>

            <!-- Sidebar (Glass Panel) -->
            <aside class="sidebar glass-panel" [class.collapsed]="sidebarCollapsed">
                <div class="sidebar-header">
                    <h1 class="brand">
                        <span class="brand-icon">🧠</span>
                        <span class="brand-text text-gradient">LocalGPT</span>
                    </h1>
                    <button class="icon-btn" (click)="sidebarCollapsed = !sidebarCollapsed" title="Toggle sidebar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div class="sidebar-content">
                    <button class="new-chat-btn" (click)="startNewChat()">
                        <span class="plus-icon">+</span> New Chat
                    </button>

                    <div class="conversation-list">
                        @for (conv of conversations; track conv.id) {
                            <button
                                class="conv-item"
                                [class.active]="conv.id === store.conversationId()"
                                (click)="loadConversation(conv.id)"
                            >
                                <span class="conv-title">{{ conv.title || 'New Conversation' }}</span>
                                <span class="conv-date">{{ formatDate(conv.updatedAt) }}</span>
                            </button>
                        }
                    </div>
                </div>

                <div class="sidebar-footer">
                    <button class="icon-btn theme-toggle" (click)="theme.toggle()" title="Toggle theme">
                        {{ theme.isDark() ? '☀️' : '🌙' }}
                    </button>
                    <span class="model-label glass-panel">{{ store.selectedModel() }}</span>
                </div>
            </aside>

            <!-- Floating Sidebar Toggle (Visible when collapsed) -->
            @if (sidebarCollapsed) {
                <button class="floating-toggle glass-panel" (click)="sidebarCollapsed = false">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            }

            <!-- Main Chat Area -->
            <main class="chat-main" [class.expanded]="sidebarCollapsed">
                <app-message-list [messages]="store.messages()" />
                
                <div class="input-wrapper-container">
                    <app-input-area
                        [isStreaming]="store.isStreaming()"
                        [models]="availableModels"
                        (sendMessage)="onSend($event)"
                        (stopRequest)="onStop()"
                        (modelChange)="store.selectedModel.set($event)"
                    />
                </div>
            </main>
        </div>
    `,
  styles: [`
        .chat-layout {
            display: flex;
            height: 100vh;
            width: 100vw;
            position: relative;
            background: var(--surface-primary);
            overflow: hidden;
        }

        .ambient-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
        }

        /* ---- Sidebar ---- */
        .sidebar {
            width: 280px;
            height: 96vh;
            margin: 2vh 0 2vh 1rem;
            border-radius: var(--radius-xl);
            display: flex;
            flex-direction: column;
            z-index: 20;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s ease, opacity 0.3s ease;
        }

        .sidebar.collapsed {
            width: 0;
            margin-left: 0;
            padding: 0;
            opacity: 0;
            pointer-events: none;
            overflow: hidden;
        }

        .sidebar-header {
            padding: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: -0.02em;
        }

        .sidebar-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 1rem;
        }

        .new-chat-btn {
            width: 100%;
            padding: 0.875rem;
            background: var(--surface-tertiary);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            color: var(--text-primary);
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 1.5rem;
        }

        .new-chat-btn:hover {
            background: var(--surface-hover);
            border-color: var(--accent);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .conversation-list {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .conv-item {
            padding: 0.75rem 1rem;
            border-radius: var(--radius-lg);
            border: none;
            background: transparent;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s;
            color: var(--text-secondary);
        }

        .conv-item:hover {
            background: var(--surface-hover);
            color: var(--text-primary);
        }

        .conv-item.active {
            background: var(--surface-hover);
            color: var(--text-primary);
            border-left: 3px solid var(--accent);
        }

        .conv-title {
            display: block;
            font-size: 0.9rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 0.125rem;
        }

        .conv-date {
            font-size: 0.7rem;
            color: var(--text-muted);
        }

        .sidebar-footer {
            padding: 1rem;
            border-top: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .floating-toggle {
            position: absolute;
            top: 2rem;
            left: 1rem;
            z-index: 30;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--text-secondary);
            transition: all 0.2s;
        }

        .floating-toggle:hover {
            color: var(--text-primary);
            background: var(--surface-hover);
        }

        .icon-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 0.5rem;
            transition: color 0.2s;
        }
        
        .icon-btn:hover { color: var(--text-primary); }

        .model-label {
            font-size: 0.75rem;
            padding: 0.2rem 0.6rem;
            border-radius: 1rem;
            color: var(--text-secondary);
        }

        /* ---- Main Chat ---- */
        .chat-main {
            flex: 1;
            position: relative;
            display: flex;
            flex-direction: column;
            height: 100vh;
            z-index: 10;
        }

        .input-wrapper-container {
            padding: 2rem;
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
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
          // Auto-select first model if none selected
          if (!this.store.selectedModel()) {
            this.store.selectedModel.set(this.availableModels[0]);
          }
        }
      },
      error: (err) => console.error('Failed to load models:', err)
    });
  }
}
