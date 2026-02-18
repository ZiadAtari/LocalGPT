import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatResponse, ListResponse } from 'ollama';
export declare class OllamaWrapper implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private client;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    chat(model: string, messages: Array<{
        role: string;
        content: string;
    }>, options?: {
        num_ctx?: number;
        temperature?: number;
        tools?: any[];
    }, abortSignal?: AbortSignal): AsyncGenerator<ChatResponse>;
    private embedDimensionLogged;
    embed(text: string, model?: string): Promise<number[]>;
    generateFromImage(prompt: string, imageBuffer: Buffer, model?: string): Promise<string>;
    listModels(): Promise<ListResponse>;
    showModel(model: string): Promise<import("ollama").ShowResponse>;
}
