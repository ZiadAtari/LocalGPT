/**
 * Chat Controller
 * ===============
 * API endpoints for the chat pipeline.
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 5.2
 *
 * Endpoints:
 *   GET  /api/models             - List available Ollama models
 *   POST /api/chat/init          - Create a new conversation
 *   GET  /api/chat               - List all conversations
 *   GET  /api/chat/:id           - Get conversation with messages
 *   POST /api/chat/stream        - SSE streaming chat endpoint
 *   POST /api/chat/stop          - Abort an active stream
 */
import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { OllamaWrapper } from '../ollama/ollama.wrapper';

@Controller()
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly ollama: OllamaWrapper,
    ) { }

    // -----------------------------------------------------------------------
    // Models
    // -----------------------------------------------------------------------

    /**
     * GET /api/models
     * Lists available Ollama models. Proxies ollama.list().
     */
    @Get('models')
    async listModels() {
        const result = await this.ollama.listModels();
        return result.models.map((m) => ({
            name: m.name,
            size: m.size,
            modifiedAt: m.modified_at,
        }));
    }

    // -----------------------------------------------------------------------
    // Conversations
    // -----------------------------------------------------------------------

    /**
     * POST /api/chat/init
     * Creates a new conversation.
     */
    @Post('chat/init')
    @HttpCode(HttpStatus.CREATED)
    async initConversation(@Body() body: { title?: string }) {
        const conversation = await this.chatService.createConversation(body?.title);
        return { conversationId: conversation.id };
    }

    /**
     * GET /api/chat
     * Lists all conversations (for the sidebar).
     */
    @Get('chat')
    async listConversations() {
        return this.chatService.listConversations();
    }

    /**
     * GET /api/chat/:id
     * Gets a single conversation with all its messages.
     */
    @Get('chat/:id')
    async getConversation(@Param('id') id: string) {
        return this.chatService.getConversation(id);
    }

    // -----------------------------------------------------------------------
    // Streaming Chat (SSE)
    // -----------------------------------------------------------------------

    /**
     * POST /api/chat/stream
     * The main SSE streaming endpoint.
     *
     * Writes Server-Sent Events directly to the response.
     * Each event is a JSON-encoded StreamPacket.
     */
    @Post('chat/stream')
    async streamChat(
        @Body() body: { conversationId: string; message: string; model?: string },
        @Res() res: Response,
    ) {
        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
        res.flushHeaders();

        try {
            const stream = this.chatService.streamChat(
                body.conversationId,
                body.message,
                body.model ?? 'deepseek-r1',
            );

            for await (const packet of stream) {
                // Write SSE format: "event: <type>\ndata: <json>\n\n"
                res.write(`event: ${packet.type}\n`);
                res.write(`data: ${JSON.stringify(packet)}\n\n`);
            }
        } catch (error) {
            res.write(`event: error\n`);
            res.write(`data: ${JSON.stringify({ type: 'error', payload: { message: error.message } })}\n\n`);
        } finally {
            res.end();
        }
    }

    // -----------------------------------------------------------------------
    // Stop
    // -----------------------------------------------------------------------

    /**
     * POST /api/chat/stop
     * Aborts an active stream for the given conversation.
     */
    @Post('chat/stop')
    @HttpCode(HttpStatus.OK)
    async stopChat(@Body() body: { conversationId: string }) {
        const stopped = this.chatService.stopStream(body.conversationId);
        return { stopped };
    }
}
