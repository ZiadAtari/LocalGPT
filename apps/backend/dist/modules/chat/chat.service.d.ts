import { OllamaWrapper } from '../ollama/ollama.wrapper';
import { StreamNormalizer, StreamPacket } from '../../core/stream/stream.normalizer';
import { PrismaService } from '../../core/database/prisma.service';
export declare class ChatService {
    private readonly ollama;
    private readonly normalizer;
    private readonly prisma;
    private readonly logger;
    private activeStreams;
    constructor(ollama: OllamaWrapper, normalizer: StreamNormalizer, prisma: PrismaService);
    createConversation(title?: string): Promise<{
        id: string;
        title: string;
        summary: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listConversations(): Promise<{
        id: string;
        title: string;
        summary: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getConversation(conversationId: string): Promise<({
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
    streamChat(conversationId: string, userMessage: string, model?: string, options?: {
        num_ctx?: number;
        temperature?: number;
    }): AsyncGenerator<StreamPacket>;
    stopStream(conversationId: string): boolean;
}
