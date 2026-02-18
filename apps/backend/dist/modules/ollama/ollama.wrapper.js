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
var OllamaWrapper_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaWrapper = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ollama_1 = require("ollama");
let OllamaWrapper = OllamaWrapper_1 = class OllamaWrapper {
    config;
    logger = new common_1.Logger(OllamaWrapper_1.name);
    client;
    constructor(config) {
        this.config = config;
    }
    async onModuleInit() {
        const host = this.config.get('OLLAMA_HOST', 'http://localhost:11434');
        this.client = new ollama_1.Ollama({ host });
        this.logger.log(`Connecting to Ollama at ${host}`);
        try {
            const models = await this.client.list();
            this.logger.log(`✅ Connected to Ollama. ${models.models.length} model(s) available: ${models.models.map((m) => m.name).join(', ') || 'none'}`);
        }
        catch (error) {
            this.logger.warn(`⚠️  Could not connect to Ollama at ${host}. Is it running?`);
        }
    }
    async *chat(model, messages, options, abortSignal) {
        const request = {
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
            request.tools = options.tools;
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
    embedDimensionLogged = false;
    async embed(text, model = 'nomic-embed-text') {
        const response = await this.client.embed({
            model,
            input: text,
        });
        if (!response?.embeddings || !Array.isArray(response.embeddings) || response.embeddings.length === 0) {
            this.logger.error(`Ollama embed returned invalid response: ${JSON.stringify(response).slice(0, 200)}`);
            throw new Error(`Embedding model "${model}" returned no embeddings`);
        }
        const embedding = response.embeddings[0];
        if (!Array.isArray(embedding) || embedding.length === 0) {
            this.logger.error(`Embedding[0] is invalid: type=${typeof embedding}, length=${embedding?.length}`);
            throw new Error(`Embedding model "${model}" returned invalid embedding vector`);
        }
        if (!this.embedDimensionLogged) {
            this.logger.log(`Embedding dimension: ${embedding.length} (model: ${model})`);
            this.embedDimensionLogged = true;
        }
        return embedding;
    }
    async generateFromImage(prompt, imageBuffer, model = 'deepseek-ocr') {
        const base64Image = imageBuffer.toString('base64');
        const response = await this.client.generate({
            model,
            prompt,
            images: [base64Image],
            stream: false,
            keep_alive: '60m',
            options: {
                num_ctx: 8192,
                temperature: 0.1,
            },
        });
        return response.response;
    }
    async listModels() {
        return this.client.list();
    }
    async showModel(model) {
        return this.client.show({ model });
    }
};
exports.OllamaWrapper = OllamaWrapper;
exports.OllamaWrapper = OllamaWrapper = OllamaWrapper_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OllamaWrapper);
//# sourceMappingURL=ollama.wrapper.js.map