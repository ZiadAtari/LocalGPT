/**
 * Chat Controller
 * ===============
 * API endpoints for the chat pipeline.
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 5.2
 *
 * Endpoints:
 *   GET  /api/models         - Proxy for ollama.list() (cached 5m)
 *   POST /api/chat/init      - Creates a new conversationId
 *   POST /api/chat/stream    - SSE endpoint for streaming chat
 *   POST /api/chat/stop      - Aborts an active stream
 *   POST /api/upload         - File upload (Multer) + background embedding
 */
import { Controller, Get, Post, Body, Param, Sse } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    /**
     * POST /api/chat/init
     * Creates a new conversation and returns the ID.
     */
    @Post('init')
    async initConversation() {
        // TODO: Call chatService.createConversation()
        return { conversationId: 'placeholder-uuid' };
    }

    /**
     * POST /api/chat/stream
     * SSE streaming endpoint. Body: { message, conversationId, model }
     */
    @Post('stream')
    async streamChat(@Body() body: { message: string; conversationId: string; model?: string }) {
        // TODO: Implement SSE streaming via chatService
    }

    /**
     * POST /api/chat/stop
     * Aborts the active AbortController for the given conversation.
     */
    @Post('stop')
    async stopChat(@Body() body: { conversationId: string }) {
        // TODO: Implement request abortion
    }
}
