/**
 * RAG Module
 * ==========
 * Wires together the Retrieval-Augmented Generation pipeline:
 *   - DocumentController: File upload API
 *   - FileProcessor: Text extraction + chunking + embedding
 *   - VectorStoreService: Local vector storage + similarity search
 *
 * Depends on OllamaModule for embedding generation.
 */
import { Module } from '@nestjs/common';
import { VectorStoreService } from './vector.store';
import { FileProcessor } from './file.processor';
import { DocumentController } from './document.controller';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
    imports: [OllamaModule],
    controllers: [DocumentController],
    providers: [VectorStoreService, FileProcessor],
    exports: [VectorStoreService, FileProcessor],
})
export class RagModule { }
