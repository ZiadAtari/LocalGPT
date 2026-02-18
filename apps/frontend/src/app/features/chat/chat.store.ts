/**
 * Chat Store
 * ==========
 * Central reactive state for the chat feature using Angular Signals.
 * Based on: Docs/Apps/Client/SpecSheet.md § 4.3
 */
import { Injectable, signal, computed } from '@angular/core';

export interface MessageAttachment {
    name: string;
    size: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    thoughtProcess: string;
    isStreaming: boolean;
    timestamp: Date;
    attachments?: MessageAttachment[];
}

@Injectable({ providedIn: 'root' })
export class ChatStore {
    // ---- State Signals ----

    /** UUID of the current active conversation */
    readonly conversationId = signal<string | null>(null);

    /** List of all messages in the current conversation */
    readonly messages = signal<ChatMessage[]>([]);

    /** Current connection state for UI feedback */
    readonly connectionStatus = signal<'idle' | 'streaming' | 'error'>('idle');

    /** The LLM model currently selected for new requests */
    readonly selectedModel = signal<string>('deepseek-r1');

    // ---- Computed ----

    /** Derived signal checking if the app is currently generating text */
    readonly isStreaming = computed(() => this.connectionStatus() === 'streaming');

    /** Derived signal for total message count */
    readonly messageCount = computed(() => this.messages().length);

    // ---- Actions ----

    /**
     * Initializes the store with a specific conversation loaded from the backend.
     * @param id - The conversation UUID.
     * @param existingMessages - Array of past messages (default: empty).
     */
    setConversation(id: string, existingMessages?: ChatMessage[]): void {
        this.conversationId.set(id);
        this.messages.set(existingMessages ?? []);
        this.connectionStatus.set('idle');
    }

    /**
     * Optimistically adds a user message to the UI.
     * @param content - The text entered by the user.
     */
    addUserMessage(content: string, attachments?: MessageAttachment[]): void {
        const msg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            thoughtProcess: '',
            isStreaming: false,
            timestamp: new Date(),
            attachments: attachments?.length ? attachments : undefined,
        };
        this.messages.update((msgs) => [...msgs, msg]);
    }

    /**
     * Creates a placeholder message for the Assistant and sets status to 'streaming'.
     * This message will be updated in-place as tokens arrive.
     */
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

    /**
     * Appends a text token to the last assistant message.
     * Used for standard content generation.
     * @param token - The text chunk to append.
     */
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

    /**
     * Appends a thinking token to the last assistant message.
     * Used for reasoning models (e.g., DeepSeek) that emit internal monologues.
     * @param thought - The thought chunk to append.
     */
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

    /**
     * Marks the streaming as complete.
     * Removes the blinking cursor effect from the last message.
     */
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

    /**
     * Sets the application state to error mode.
     * Stops the stream visual effects.
     */
    setError(): void {
        this.connectionStatus.set('error');
        this.finishStreaming();
    }

    /**
     * Clears the current conversation state.
     */
    reset(): void {
        this.conversationId.set(null);
        this.messages.set([]);
        this.connectionStatus.set('idle');
    }
}
