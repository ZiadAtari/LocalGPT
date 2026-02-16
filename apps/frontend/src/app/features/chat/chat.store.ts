/**
 * Chat Store
 * ==========
 * Central reactive state for the chat feature using Angular Signals.
 * Based on: Docs/Apps/Client/SpecSheet.md § 4.3
 */
import { Injectable, signal, computed } from '@angular/core';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    thoughtProcess: string;
    isStreaming: boolean;
    timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatStore {
    // ---- State Signals ----
    readonly conversationId = signal<string | null>(null);
    readonly messages = signal<ChatMessage[]>([]);
    readonly connectionStatus = signal<'idle' | 'streaming' | 'error'>('idle');
    readonly selectedModel = signal<string>('deepseek-r1');

    // ---- Computed ----
    readonly isStreaming = computed(() => this.connectionStatus() === 'streaming');
    readonly messageCount = computed(() => this.messages().length);

    // ---- Actions ----

    setConversation(id: string, existingMessages?: ChatMessage[]): void {
        this.conversationId.set(id);
        this.messages.set(existingMessages ?? []);
        this.connectionStatus.set('idle');
    }

    addUserMessage(content: string): void {
        const msg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            thoughtProcess: '',
            isStreaming: false,
            timestamp: new Date(),
        };
        this.messages.update((msgs) => [...msgs, msg]);
    }

    startAssistantMessage(): void {
        const msg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            thoughtProcess: '',
            isStreaming: true,
            timestamp: new Date(),
        };
        this.messages.update((msgs) => [...msgs, msg]);
        this.connectionStatus.set('streaming');
    }

    appendToken(token: string): void {
        this.messages.update((msgs) => {
            const updated = [...msgs];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + token };
            }
            return updated;
        });
    }

    appendThought(thought: string): void {
        this.messages.update((msgs) => {
            const updated = [...msgs];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') {
                updated[updated.length - 1] = {
                    ...last,
                    thoughtProcess: last.thoughtProcess + thought,
                };
            }
            return updated;
        });
    }

    finishStreaming(): void {
        this.messages.update((msgs) => {
            const updated = [...msgs];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') {
                updated[updated.length - 1] = { ...last, isStreaming: false };
            }
            return updated;
        });
        this.connectionStatus.set('idle');
    }

    setError(): void {
        this.connectionStatus.set('error');
        this.finishStreaming();
    }

    reset(): void {
        this.conversationId.set(null);
        this.messages.set([]);
        this.connectionStatus.set('idle');
    }
}
