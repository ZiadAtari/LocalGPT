/**
 * Chat Service
 * ============
 * Business logic for the chat pipeline.
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 4.1
 *
 * Pipeline:
 *   1. Load Chat History from SQLite (conversation_id).
 *   2. Inject "System Prompt" (Context).
 *   3. If RAG active: Query Vector DB -> Append relevant chunks.
 *   4. Call ollama.chat({ stream: true, ... }).
 *   5. Pipe output through StreamNormalizer.
 *   6. On 'done': save messages to database.
 */
import { Injectable, Logger } from '@nestjs/common';
import { OllamaWrapper } from '../ollama/ollama.wrapper';
import { StreamNormalizer, StreamPacket } from '../../core/stream/stream.normalizer';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    /** Active AbortControllers keyed by conversationId for stop support */
    private activeStreams = new Map<string, AbortController>();

    constructor(
        private readonly ollama: OllamaWrapper,
        private readonly normalizer: StreamNormalizer,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Create a new conversation.
     */
    async createConversation(title?: string) {
        const conversation = await this.prisma.conversation.create({
            data: { title: title ?? 'New Chat' },
        });
        this.logger.log(`Created conversation: ${conversation.id}`);
        return conversation;
    }

    /**
     * List all conversations (for sidebar).
     */
    async listConversations() {
        return this.prisma.conversation.findMany({
            orderBy: { updatedAt: 'desc' },
            select: { id: true, title: true, summary: true, createdAt: true, updatedAt: true },
        });
    }

    /**
     * Get a conversation with its messages.
     */
    async getConversation(conversationId: string) {
        return this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
    }

    /**
     * The main chat pipeline. Returns an async generator of StreamPackets.
     *
     * 1. Save the user message to DB.
     * 2. Load conversation history.
     * 3. Build the message array for Ollama.
     * 4. Stream through Ollama -> StreamNormalizer.
     * 5. On 'done', save the assistant message to DB.
     */
    async *streamChat(
        conversationId: string,
        userMessage: string,
        model = 'deepseek-r1',
        options?: { num_ctx?: number; temperature?: number },
    ): AsyncGenerator<StreamPacket> {
        // 1. Save user message
        await this.prisma.message.create({
            data: {
                conversationId,
                role: 'user',
                content: userMessage,
            },
        });

        // 2. Load recent history (last 20 messages to stay within context window)
        const history = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: 20,
        });

        // 3. Build messages array for Ollama
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful AI assistant running locally. Be concise and accurate.',
            },
            ...history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
        ];

        // 4. Create AbortController for this stream
        const abortController = new AbortController();
        this.activeStreams.set(conversationId, abortController);

        // 5. Stream through Ollama -> Normalizer
        let fullContent = '';
        let fullThinking = '';

        try {
            const ollamaStream = this.ollama.chat(model, messages, options, abortController.signal);
            const normalizedStream = this.normalizer.normalize(ollamaStream);

            for await (const packet of normalizedStream) {
                // Accumulate content for DB save
                if (packet.type === 'token' && typeof packet.payload === 'string') {
                    fullContent += packet.payload;
                }
                if (packet.type === 'thought' && typeof packet.payload === 'string') {
                    fullThinking += packet.payload;
                }

                // On done: save assistant message to DB
                if (packet.type === 'done') {
                    await this.prisma.message.create({
                        data: {
                            conversationId,
                            role: 'assistant',
                            content: fullContent,
                            thoughtProcess: fullThinking || null,
                        },
                    });
                    this.logger.log(`Saved assistant response (${fullContent.length} chars) to conversation ${conversationId}`);
                }

                yield packet;
            }
        } finally {
            this.activeStreams.delete(conversationId);
        }
    }

    /**
     * Abort an active stream for a given conversation.
     */
    stopStream(conversationId: string): boolean {
        const controller = this.activeStreams.get(conversationId);
        if (controller) {
            controller.abort();
            this.activeStreams.delete(conversationId);
            this.logger.log(`Aborted stream for conversation ${conversationId}`);
            return true;
        }
        return false;
    }
}
