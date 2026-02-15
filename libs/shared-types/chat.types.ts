/**
 * Chat Types
 * ==========
 * Shared DTOs for conversation and message handling.
 * Based on: Docs/Apps/Client/SpecSheet.md § 5.1 & Docs/Apps/Data Layer/SpecSheet.md § 3.2
 */

// ---------------------------------------------------------------------------
// Enums & Literals
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

// ---------------------------------------------------------------------------
// Core DTOs
// ---------------------------------------------------------------------------

/**
 * Represents a single message exchanged within a conversation.
 * Maps directly to the Prisma `Message` model in the Data Layer.
 */
export interface ChatMessage {
    id: string;
    conversationId: string;
    role: MessageRole;

    /** The final rendered content (Markdown). */
    content: string;

    /** Internal reasoning trace for "thinking" models (e.g., DeepSeek R1). */
    thoughtProcess?: string;

    /** Tool invocation metadata, if this message triggered a tool. */
    toolCall?: {
        toolName: string;
        args: Record<string, any>;
        status: 'pending' | 'complete' | 'failed';
    };

    /** ISO 8601 timestamp. */
    timestamp: string;

    /** Token count for context-window tracking. */
    tokenCount?: number;
}

/**
 * Represents a conversation (a list of messages).
 */
export interface Conversation {
    id: string;
    title: string;
    summary?: string;
    createdAt: string;
    updatedAt: string;
    messages: ChatMessage[];
}

// ---------------------------------------------------------------------------
// Request / Response DTOs
// ---------------------------------------------------------------------------

/**
 * Payload sent from Client -> Middleware to initiate a chat stream.
 * Endpoint: POST /api/chat/stream
 */
export interface ChatRequest {
    conversationId: string;
    model: string;
    message: string;
    tools?: string[];
}

/**
 * Payload returned when creating a new conversation.
 * Endpoint: POST /api/chat/init
 */
export interface ChatInitResponse {
    conversationId: string;
}
