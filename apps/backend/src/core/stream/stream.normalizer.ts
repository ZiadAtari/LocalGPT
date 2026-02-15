/**
 * Stream Normalizer
 * =================
 * Transforms divergent Ollama model output formats into a single,
 * predictable SSE protocol for the Client.
 *
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 3.2
 *
 * Input:  AbortableAsyncIterator<ChatResponse> (from ollama-js)
 * Output: Observable<StreamPacket> (SSE events)
 *
 * Handles:
 *   - Standard models:   chunk.message.content      -> { type: 'token' }
 *   - Reasoning models:  chunk.message.thinking     -> { type: 'thought' }
 *   - Tool-use models:   chunk.message.tool_calls   -> { type: 'tool_start' }
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class StreamNormalizer {
    // TODO: Implement stream transformation logic
    // - Accept the Ollama async iterator
    // - Detect thinking vs content vs tool_calls fields
    // - Emit normalized StreamPacket objects via Observable/SSE
}
