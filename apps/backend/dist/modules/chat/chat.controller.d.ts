import { Response } from 'express';
import { ChatService } from './chat.service';
import { OllamaWrapper } from '../ollama/ollama.wrapper';
export declare class ChatController {
    private readonly chatService;
    private readonly ollama;
    constructor(chatService: ChatService, ollama: OllamaWrapper);
    listModels(): Promise<{
        name: string;
        size: number;
        modifiedAt: Date;
    }[]>;
    initConversation(body: {
        title?: string;
    }): Promise<{
        conversationId: string;
    }>;
    listConversations(): Promise<{
        id: string;
        title: string;
        summary: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getConversation(id: string): Promise<({
        messages: {
            id: string;
            createdAt: Date;
            conversationId: string;
            role: string;
            content: string;
            thoughtProcess: string | null;
            toolCallId: string | null;
            toolName: string | null;
            toolArgs: string | null;
            tokenCount: number | null;
        }[];
    } & {
        id: string;
        title: string;
        summary: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    streamChat(body: {
        conversationId: string;
        message: string;
        model?: string;
    }, res: Response): Promise<void>;
    stopChat(body: {
        conversationId: string;
    }): Promise<{
        stopped: boolean;
    }>;
}
