/**
 * Ollama Wrapper Service
 * ======================
 * Low-level wrapper around the `ollama` Node.js library.
 * Based on: Docs/Apps/Engine/SpecSheet.md § 5
 *
 * Responsibilities:
 *   - ollama.chat()       (always streaming)
 *   - ollama.embed()      (for RAG)
 *   - ollama.list()       (model inventory)
 *   - ollama.pull()       (dynamic provisioning)
 *   - ollama.show()       (model details / hardware guardrails)
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama, ChatRequest, ChatResponse, ListResponse } from 'ollama';

@Injectable()
export class OllamaWrapper implements OnModuleInit {
    private readonly logger = new Logger(OllamaWrapper.name);
    private client: Ollama;

    constructor(private readonly config: ConfigService) { }

    async onModuleInit() {
        const host = this.config.get<string>('OLLAMA_HOST', 'http://localhost:11434');
        this.client = new Ollama({ host });
        this.logger.log(`Connecting to Ollama at ${host}`);

        try {
            const models = await this.client.list();
            this.logger.log(
                `✅ Connected to Ollama. ${models.models.length} model(s) available: ${models.models.map((m) => m.name).join(', ') || 'none'}`,
            );
        } catch (error) {
            this.logger.warn(`⚠️  Could not connect to Ollama at ${host}. Is it running?`);
        }
    }

    /**
     * Stream a chat completion from Ollama.
     * Returns an async iterable of ChatResponse chunks.
     *
     * @param model    - e.g. 'deepseek-r1', 'llama3'
     * @param messages - Array of { role, content } messages
     * @param options  - Optional Ollama parameters (num_ctx, temperature, etc.)
     */
    async *chat(
        model: string,
        messages: Array<{ role: string; content: string }>,
        options?: {
            num_ctx?: number;
            temperature?: number;
            tools?: any[];
        },
        abortSignal?: AbortSignal,
    ): AsyncGenerator<ChatResponse> {
        const request: ChatRequest & { stream: true } = {
            model,
            messages,
            stream: true,
            keep_alive: '60m',
            options: {
                num_ctx: options?.num_ctx ?? 4096,
                temperature: options?.temperature ?? 0.7,
            },
        };

        if (options?.tools?.length) {
            (request as any).tools = options.tools;
        }

        const stream = await this.client.chat({
            ...request,
            stream: true,
        });

        for await (const chunk of stream) {
            if (abortSignal?.aborted) {
                break;
            }
            yield chunk;
        }
    }

    /**
     * Generate embeddings for a text string.
     */
    async embed(text: string, model = 'nomic-embed-text'): Promise<number[]> {
        const response = await this.client.embed({
            model,
            input: text,
        });
        return response.embeddings[0];
    }

    /**
     * List all available models.
     */
    async listModels(): Promise<ListResponse> {
        return this.client.list();
    }

    /**
     * Get details about a specific model (size, quantization, etc.).
     */
    async showModel(model: string) {
        return this.client.show({ model });
    }
}
