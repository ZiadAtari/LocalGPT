/**
 * Ollama Wrapper Service
 * ======================
 * Low-level wrapper around the `ollama` Node.js library.
 * Based on: Docs/Apps/Engine/SpecSheet.md § 5
 *
 * Responsibilities:
 *   - ollama.chat()       (always streaming)
 *   - ollama.embeddings() (for RAG)
 *   - ollama.list()       (model inventory)
 *   - ollama.pull()       (dynamic provisioning)
 *   - ollama.show()       (model details / hardware guardrails)
 *
 * Configuration:
 *   - keep_alive: "60m" on every request (prevent cold starts)
 *   - num_ctx: 4096 default, 8192/16384 for RAG mode
 *   - temperature: configurable per request
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OllamaWrapper implements OnModuleInit {
    constructor(private readonly config: ConfigService) { }

    async onModuleInit() {
        const host = this.config.get<string>('OLLAMA_HOST', 'http://localhost:11434');
        console.log(`🧠 Connecting to Ollama at ${host}`);
        // TODO: Initialize ollama client with host
        // TODO: Call ollama.list() to verify connection
    }

    // TODO: Implement chat(request) -> AbortableAsyncIterator
    // TODO: Implement embed(text) -> number[]
    // TODO: Implement listModels() -> Model[]
    // TODO: Implement pullModel(model) -> stream progress
}
