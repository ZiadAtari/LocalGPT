export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
export interface ChatMessage {
    id: string;
    conversationId: string;
    role: MessageRole;
    content: string;
    thoughtProcess?: string;
    toolCall?: {
        toolName: string;
        args: Record<string, any>;
        status: 'pending' | 'complete' | 'failed';
    };
    timestamp: string;
    tokenCount?: number;
}
export interface Conversation {
    id: string;
    title: string;
    summary?: string;
    createdAt: string;
    updatedAt: string;
    messages: ChatMessage[];
}
export interface ChatRequest {
    conversationId: string;
    model: string;
    message: string;
    tools?: string[];
}
export interface ChatInitResponse {
    conversationId: string;
}
