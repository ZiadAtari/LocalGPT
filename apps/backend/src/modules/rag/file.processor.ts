/**
 * File Processor
 * ==============
 * Handles file upload ingestion: extract text, chunk, embed, and store.
 * Based on: Docs/Apps/Data Layer/SpecSheet.md § 7.2 (Ingestion Pipeline)
 *
 * Pipeline:
 *   1. Receive uploaded file -> save to /data/uploads/
 *   2. Extract text (PDF/Txt)
 *   3. Split into 500-token chunks with 50-token overlap
 *   4. Embed each chunk via ollama.embeddings({ model: 'nomic-embed-text' })
 *   5. Store vectors + metadata in ChromaDB
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileProcessor {
    // TODO: Inject OllamaWrapper (for embeddings)
    // TODO: Inject VectorStoreService (for storage)
    // TODO: Implement processFile(filePath) pipeline
    // TODO: Implement text extraction (PDF, TXT)
    // TODO: Implement chunking strategy (500 tokens, 50 overlap)
}
