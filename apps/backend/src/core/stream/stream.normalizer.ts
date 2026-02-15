/**
 * Stream Normalizer
 * =================
 * Transforms divergent Ollama model output formats into a single,
 * predictable SSE protocol for the Client.
 *
 * Based on: Docs/Apps/Middleware/SpecSheet.md § 3.2
 *
 * Handles:
 *   - Standard models:   chunk.message.content      -> { type: 'token' }
 *   - Reasoning models:  chunk.message.thinking     -> { type: 'thought' }
 *   - Tool-use models:   chunk.message.tool_calls   -> { type: 'tool_start' }
 */
import { Injectable, Logger } from '@nestjs/common';
import { ChatResponse } from 'ollama';
import { v4 as uuid } from 'uuid';

/**
 * Normalized stream event types sent to the Client via SSE.
 */
export type StreamEventType =
    | 'token'
    | 'thought'
    | 'tool_start'
    | 'tool_result'
    | 'error'
    | 'done';

export interface StreamPacket {
    id: string;
    type: StreamEventType;
    payload: string | object;
    timestamp: number;
}

@Injectable()
export class StreamNormalizer {
    private readonly logger = new Logger(StreamNormalizer.name);

    /**
     * Transform an Ollama chat stream into normalized StreamPackets.
     * Yields one packet per meaningful chunk.
     */
    async *normalize(
        stream: AsyncGenerator<ChatResponse>,
    ): AsyncGenerator<StreamPacket> {
        let totalTokens = 0;

        try {
            for await (const chunk of stream) {
                // ------------------------------------------------------------------
                // 1. Tool Calls (Agentic models)
                // ------------------------------------------------------------------
                if (chunk.message?.tool_calls?.length) {
                    for (const toolCall of chunk.message.tool_calls) {
                        yield this.packet('tool_start', {
                            tool: toolCall.function?.name ?? 'unknown',
                            args: toolCall.function?.arguments ?? {},
                        });
                    }
                    continue;
                }

                // ------------------------------------------------------------------
                // 2. Thinking / Reasoning (DeepSeek R1, etc.)
                //    The `thinking` field is set when the model is in its internal
                //    reasoning phase, separate from the final answer.
                // ------------------------------------------------------------------
                if ((chunk.message as any)?.thinking) {
                    yield this.packet('thought', (chunk.message as any).thinking);
                    continue;
                }

                // ------------------------------------------------------------------
                // 3. Standard Content Token
                // ------------------------------------------------------------------
                if (chunk.message?.content) {
                    totalTokens++;
                    yield this.packet('token', chunk.message.content);
                }

                // ------------------------------------------------------------------
                // 4. Stream Done
                // ------------------------------------------------------------------
                if (chunk.done) {
                    yield this.packet('done', {
                        totalTokens,
                        totalDuration: (chunk as any).total_duration ?? 0,
                        model: (chunk as any).model ?? 'unknown',
                    });
                }
            }
        } catch (error) {
            this.logger.error(`Stream error: ${error.message}`);
            yield this.packet('error', { message: error.message });
        }
    }

    /**
     * Create a StreamPacket with auto-generated ID and timestamp.
     */
    private packet(type: StreamEventType, payload: string | object): StreamPacket {
        return {
            id: uuid(),
            type,
            payload,
            timestamp: Date.now(),
        };
    }
}
