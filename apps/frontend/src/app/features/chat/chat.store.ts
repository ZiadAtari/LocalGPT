/**
 * Chat Store (Signal Store)
 * =========================
 * Central state for the chat feature using NgRx SignalStore.
 * Based on: Docs/Apps/Client/SpecSheet.md § 4.3
 */

// import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

/**
 * The shape of the Chat state.
 */
export interface ChatState {
    /** Active conversation ID */
    conversationId: string | null;
    /** List of messages (User + Assistant) */
    messages: any[]; // TODO: Use ChatMessage from shared-types
    /** Connection/streaming status */
    connectionStatus: 'connected' | 'disconnected' | 'streaming';
    /** Active plugin widget ID (if any) */
    activePluginWidget: string | null;
}

/**
 * Initial state.
 */
export const initialChatState: ChatState = {
    conversationId: null,
    messages: [],
    connectionStatus: 'disconnected',
    activePluginWidget: null,
};

// TODO: Implement signalStore with:
//   - withState(initialChatState)
//   - withMethods for addMessage, setStreaming, setConversation, etc.
