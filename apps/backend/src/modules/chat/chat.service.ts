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
import { VectorStoreService } from '../rag/vector.store';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    /** Active AbortControllers keyed by conversationId for stop support */
    private activeStreams = new Map<string, AbortController>();

    constructor(
        private readonly ollama: OllamaWrapper,
        private readonly normalizer: StreamNormalizer,
        private readonly prisma: PrismaService,
        private readonly vectorStore: VectorStoreService,
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
     * Pipeline:
     * 1. Save the user message to DB (Persistence).
     * 2. Load conversation history (Context Window).
     * 3. (RAG) If documentIds provided, embed query and retrieve context.
     * 4. Build the message array for Ollama (System Prompt + History + Context).
     * 5. Stream through Ollama -> StreamNormalizer (Standardization).
     * 6. On 'done', save the assistant message to DB (Persistence).
     *
     * @param conversationId - Target conversation UUID
     * @param userMessage    - The user's prompt
     * @param model          - Model identifier (e.g. 'deepseek-r1')
     * @param options        - Ollama parameters (temperature, num_ctx)
     * @param documentIds    - Optional list of document IDs for RAG context
     * @returns AsyncGenerator yielding StreamPackets (token, thought, done, error)
     */
    async *streamChat(
        conversationId: string,
        userMessage: string,
        model = 'deepseek-r1',
        options?: { num_ctx?: number; temperature?: number },
        documentIds?: string[],
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

        // 3. RAG Context Injection
        let ragContext = '';
        if (documentIds?.length || this.vectorStore.getCount() > 0) {
            try {
                const queryEmbedding = await this.ollama.embed(userMessage);
                const results = this.vectorStore.search(
                    queryEmbedding,
                    5,
                    documentIds?.length ? documentIds : undefined,
                );

                if (results.length > 0) {
                    const contextChunks = results
                        .filter((r) => r.score > 0.3) // Only include relevant results
                        .map((r, i) => `[Source ${i + 1} - ${r.entry.metadata.filename}]\n${r.entry.text}`)
                        .join('\n\n---\n\n');

                    if (contextChunks) {
                        ragContext = `\n\nYou have access to the following document context. Use it to answer the user's question accurately. If the context doesn't contain relevant information, say so.\n\n<context>\n${contextChunks}\n</context>`;
                        this.logger.log(`Injected ${results.filter(r => r.score > 0.3).length} RAG context chunks`);
                    }
                }
            } catch (err) {
                this.logger.warn(`RAG context retrieval failed: ${err.message}`);
                // Continue without RAG context
            }
        }

        // 4. Build messages array for Ollama
        const systemPrompt = `You are a helpful AI assistant running locally. Be concise and accurate.${ragContext}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
        ];

        // 5. Create AbortController for this stream
        const abortController = new AbortController();
        this.activeStreams.set(conversationId, abortController);

        // 6. Stream through Ollama -> Normalizer
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

