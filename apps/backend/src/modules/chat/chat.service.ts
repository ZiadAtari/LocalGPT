/**
 * Chat Service
 * ============
 * Business logic for the chat pipeline.
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 4.1
 *
 * Responsibilities:
 *   1. Load Chat History from SQLite (conversation_id).
 *   2. Inject System Prompt (Context).
 *   3. If RAG is active: Query Vector DB -> Append relevant chunks.
 *   4. Call ollama.chat({ stream: true, ... }).
 *   5. Pipe through StreamNormalizer.
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
    // TODO: Inject OllamaWrapper, PrismaService, StreamNormalizer
    // TODO: Implement createConversation()
    // TODO: Implement streamChat() with the full pipeline
    // TODO: Implement saveMessage() (called on 'done' event)
}
