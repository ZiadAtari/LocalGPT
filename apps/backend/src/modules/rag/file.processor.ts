/**
 * File Processor
 * ==============
 * Handles file upload ingestion: extract text, chunk, embed, and store.
 * Based on: Docs/Apps/Data Layer/SpecSheet.md § 7.2 (Ingestion Pipeline)
 *
 * Pipeline:
 *   1. Receive uploaded file -> determine type (PDF, TXT, MD)
 *   2. Extract raw text
 *   3. Split into chunks (~500 chars with 100-char overlap)
 *   4. Embed each chunk via OllamaWrapper.embed()
 *   5. Store vectors + metadata in VectorStoreService
 */
import { Injectable, Logger } from '@nestjs/common';
import { OllamaWrapper } from '../ollama/ollama.wrapper';
import { VectorStoreService, VectorEntry } from './vector.store';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface DocumentMetadata {
    documentId: string;
    filename: string;
    chunkCount: number;
    status: 'processing' | 'ready' | 'failed';
    error?: string;
    createdAt: string;
}

@Injectable()
export class FileProcessor {
    private readonly logger = new Logger(FileProcessor.name);

    /** In-memory registry of processed documents */
    private documents = new Map<string, DocumentMetadata>();

    constructor(
        private readonly ollama: OllamaWrapper,
        private readonly vectorStore: VectorStoreService,
    ) { }

    /**
     * Process a file: extract text, chunk, embed, and store.
     * Returns the document ID.
     */
    async processFile(filePath: string, originalFilename: string): Promise<DocumentMetadata> {
        const documentId = uuid();
        const ext = path.extname(originalFilename).toLowerCase();

        const metadata: DocumentMetadata = {
            documentId,
            filename: originalFilename,
            chunkCount: 0,
            status: 'processing',
            createdAt: new Date().toISOString(),
        };
        this.documents.set(documentId, metadata);

        this.logger.log(`Processing document: ${originalFilename} (ID: ${documentId})`);

        try {
            // 1. Extract text
            let text: string;
            if (ext === '.pdf') {
                text = await this.extractPdf(filePath);
            } else {
                // .txt, .md, .csv, .json, etc.
                text = fs.readFileSync(filePath, 'utf-8');
            }

            if (!text || text.trim().length === 0) {
                throw new Error('No text could be extracted from the file.');
            }

            this.logger.log(`Extracted ${text.length} chars from ${originalFilename}`);

            // 2. Chunk
            const chunks = this.chunkText(text, 500, 100);
            this.logger.log(`Split into ${chunks.length} chunks`);

            // 3. Embed each chunk
            const entries: VectorEntry[] = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                try {
                    const embedding = await this.ollama.embed(chunkText);
                    entries.push({
                        id: uuid(),
                        documentId,
                        text: chunkText,
                        embedding,
                        metadata: {
                            filename: originalFilename,
                            chunkIndex: i,
                        },
                    });
                } catch (embedErr) {
                    this.logger.warn(`Failed to embed chunk ${i}: ${embedErr.message}`);
                    // Continue with remaining chunks
                }

                // Log progress every 10 chunks
                if ((i + 1) % 10 === 0) {
                    this.logger.log(`Embedded ${i + 1}/${chunks.length} chunks`);
                }
            }

            // 4. Store in vector store
            if (entries.length > 0) {
                this.vectorStore.addEntries(entries);
            }

            // Update metadata
            metadata.chunkCount = entries.length;
            metadata.status = 'ready';
            this.logger.log(`✅ Document "${originalFilename}" ready: ${entries.length} vectors stored`);

            return metadata;
        } catch (err) {
            metadata.status = 'failed';
            metadata.error = err.message;
            this.logger.error(`❌ Failed to process "${originalFilename}": ${err.message}`);
            return metadata;
        }
    }

    /**
     * List all processed documents.
     */
    listDocuments(): DocumentMetadata[] {
        return Array.from(this.documents.values());
    }

    /**
     * Get a specific document by ID.
     */
    getDocument(documentId: string): DocumentMetadata | undefined {
        return this.documents.get(documentId);
    }

    /**
     * Remove a document and its vectors.
     */
    removeDocument(documentId: string): boolean {
        const doc = this.documents.get(documentId);
        if (!doc) return false;

        this.vectorStore.removeByDocumentId(documentId);
        this.documents.delete(documentId);
        this.logger.log(`Removed document: ${doc.filename}`);
        return true;
    }

    // -------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------

    /**
     * Extract text from a PDF file using pdf-parse.
     */
    private async extractPdf(filePath: string): Promise<string> {
        try {
            // Robust import for pdf-parse (CommonJS module)
            let pdfParse = require('pdf-parse');
            // Handle "default" export if present (ESM interop)
            if (pdfParse.default) {
                pdfParse = pdfParse.default;
            }

            const buffer = fs.readFileSync(filePath);
            const data = await pdfParse(buffer);
            return data.text;
        } catch (err) {
            this.logger.error(`PDF parsing failed: ${err.message}`);
            throw new Error(`PDF parsing failed: ${err.message}. Make sure 'pdf-parse' is installed.`);
        }
    }

    /**
     * Split text into overlapping chunks.
     * Simple sliding window approach.
     *
     * @param text      - The full document text
     * @param chunkSize - Target characters per chunk (default: 500)
     * @param overlap   - Characters of overlap between chunks (default: 100)
     * @returns Array of text chunks
     */
    private chunkText(text: string, chunkSize: number, overlap: number): string[] {
        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            let end = start + chunkSize;

            // Try to break at a sentence or paragraph boundary
            if (end < text.length) {
                // Look for natural break points near the end
                const searchRange = text.substring(end - 50, end + 50);
                const breakPoints = ['\n\n', '.\n', '. ', '! ', '? ', '\n'];

                for (const bp of breakPoints) {
                    const idx = searchRange.lastIndexOf(bp);
                    if (idx !== -1) {
                        end = end - 50 + idx + bp.length;
                        break;
                    }
                }
            }

            end = Math.min(end, text.length);
            const chunk = text.substring(start, end).trim();

            if (chunk.length > 0) {
                chunks.push(chunk);
            }

            start = end - overlap;
            if (start >= text.length) break;
        }

        return chunks;
    }
}
