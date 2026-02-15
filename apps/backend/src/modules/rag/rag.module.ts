/**
 * RAG Module
 * ==========
 */
import { Module } from '@nestjs/common';
import { VectorStoreService } from './vector.store';
import { FileProcessor } from './file.processor';

@Module({
    providers: [VectorStoreService, FileProcessor],
    exports: [VectorStoreService, FileProcessor],
})
export class RagModule { }
