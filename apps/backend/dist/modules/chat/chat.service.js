"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const ollama_wrapper_1 = require("../ollama/ollama.wrapper");
const stream_normalizer_1 = require("../../core/stream/stream.normalizer");
const prisma_service_1 = require("../../core/database/prisma.service");
const vector_store_1 = require("../rag/vector.store");
let ChatService = ChatService_1 = class ChatService {
    ollama;
    normalizer;
    prisma;
    vectorStore;
    logger = new common_1.Logger(ChatService_1.name);
    activeStreams = new Map();
    constructor(ollama, normalizer, prisma, vectorStore) {
        this.ollama = ollama;
        this.normalizer = normalizer;
        this.prisma = prisma;
        this.vectorStore = vectorStore;
    }
    async createConversation(title) {
        const conversation = await this.prisma.conversation.create({
            data: { title: title ?? 'New Chat' },
        });
        this.logger.log(`Created conversation: ${conversation.id}`);
        return conversation;
    }
    async listConversations() {
        return this.prisma.conversation.findMany({
            orderBy: { updatedAt: 'desc' },
            select: { id: true, title: true, summary: true, createdAt: true, updatedAt: true },
        });
    }
    async getConversation(conversationId) {
        return this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
        });
    }
    async *streamChat(conversationId, userMessage, model = 'deepseek-r1', options, documentIds) {
        await this.prisma.message.create({
            data: {
                conversationId,
                role: 'user',
                content: userMessage,
            },
        });
        const history = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: 20,
        });
        let ragContext = '';
        if (documentIds?.length || this.vectorStore.getCount() > 0) {
            try {
                const queryEmbedding = await this.ollama.embed(userMessage);
                const results = this.vectorStore.search(queryEmbedding, 5, documentIds?.length ? documentIds : undefined);
                if (results.length > 0) {
                    const contextChunks = results
                        .filter((r) => r.score > 0.3)
                        .map((r, i) => `[Source ${i + 1} - ${r.entry.metadata.filename}]\n${r.entry.text}`)
                        .join('\n\n---\n\n');
                    if (contextChunks) {
                        ragContext = `\n\nYou have access to the following document context. Use it to answer the user's question accurately. If the context doesn't contain relevant information, say so.\n\n<context>\n${contextChunks}\n</context>`;
                        this.logger.log(`Injected ${results.filter(r => r.score > 0.3).length} RAG context chunks`);
                    }
                }
            }
            catch (err) {
                this.logger.warn(`RAG context retrieval failed: ${err.message}`);
            }
        }
        const systemPrompt = `You are a helpful AI assistant running locally. Be concise and accurate.${ragContext}`;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
        ];
        const abortController = new AbortController();
        this.activeStreams.set(conversationId, abortController);
        let fullContent = '';
        let fullThinking = '';
        try {
            const ollamaStream = this.ollama.chat(model, messages, options, abortController.signal);
            const normalizedStream = this.normalizer.normalize(ollamaStream);
            for await (const packet of normalizedStream) {
                if (packet.type === 'token' && typeof packet.payload === 'string') {
                    fullContent += packet.payload;
                }
                if (packet.type === 'thought' && typeof packet.payload === 'string') {
                    fullThinking += packet.payload;
                }
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
        }
        finally {
            this.activeStreams.delete(conversationId);
        }
    }
    stopStream(conversationId) {
        const controller = this.activeStreams.get(conversationId);
        if (controller) {
            controller.abort();
            this.activeStreams.delete(conversationId);
            this.logger.log(`Aborted stream for conversation ${conversationId}`);
            return true;
        }
        return false;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ollama_wrapper_1.OllamaWrapper,
        stream_normalizer_1.StreamNormalizer,
        prisma_service_1.PrismaService,
        vector_store_1.VectorStoreService])
], ChatService);
//# sourceMappingURL=chat.service.js.map