/**
 * Ollama Module
 * =============
 */
import { Module } from '@nestjs/common';
import { OllamaWrapper } from './ollama.wrapper';

@Module({
    providers: [OllamaWrapper],
    exports: [OllamaWrapper],
})
export class OllamaModule { }
