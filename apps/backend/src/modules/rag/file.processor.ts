/**
 * File Processor (v0.3.0)
 * =======================
 * Handles file upload ingestion for the RAG pipeline.
 *
 * Pipeline for PDFs:
 *   pdfjs-dist text extraction (getTextContent API)
 *
 * Pipeline for TXT/MD/CSV/JSON:
 *   Direct text read.
 *
 * After text extraction, all paths converge:
 *   → Chunk text → Embed via nomic-embed-text → Store in VectorStoreService.
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
    pageCount: number;
    status: 'processing' | 'ocr' | 'embedding' | 'ready' | 'failed';
    progress: number; // 0-100
    error?: string;
    createdAt: string;
}

/** OCR prompt instructs the model to output clean structured Markdown. */
const OCR_PROMPT = `Extract ALL text from this document page as clean, structured Markdown.

Rules:
- Preserve headings (use # for H1, ## for H2, etc.)
- Preserve tables using standard Markdown table syntax
- Preserve lists (ordered and unordered)
- Preserve bold (**text**) and italic (*text*) formatting
- Do NOT add any commentary, explanation, or tags
- Do NOT wrap the output in code blocks
- Output ONLY the extracted text in Markdown format`;

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
     * Process a file: extract text (OCR for PDFs), chunk, embed, and store.
     * Returns the document metadata with status tracking.
     */
    async processFile(filePath: string, originalFilename: string): Promise<DocumentMetadata> {
        const documentId = uuid();
        const ext = path.extname(originalFilename).toLowerCase();

        const metadata: DocumentMetadata = {
            documentId,
            filename: originalFilename,
            chunkCount: 0,
            pageCount: 0,
            status: 'processing',
            progress: 0,
            createdAt: new Date().toISOString(),
        };
        this.documents.set(documentId, metadata);

        this.logger.log(`Processing document: ${originalFilename} (ID: ${documentId})`);

        try {
            // 1. Extract text (OCR pipeline for PDFs, direct read for text files)
            let text: string;
            if (ext === '.pdf') {
                metadata.status = 'processing';
                text = await this.extractPdfText(filePath, metadata);
            } else {
                // .txt, .md, .csv, .json
                text = fs.readFileSync(filePath, 'utf-8');
                metadata.pageCount = 1;
            }

            if (!text || text.trim().length === 0) {
                throw new Error('No text could be extracted from the file.');
            }

            metadata.progress = 60;
            this.logger.log(`Extracted ${text.length} chars from ${originalFilename}`);

            // 2. Chunk
            const chunks = this.chunkText(text, 500, 100);
            this.logger.log(`Split into ${chunks.length} chunks (sizes: ${chunks.map(c => c.length).join(', ')})`);

            // 3. Embed each chunk
            metadata.status = 'embedding';
            metadata.progress = 70;
            this.logMemory('before-embedding');

            const entries: VectorEntry[] = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                try {
                    this.logger.log(`Embedding chunk ${i + 1}/${chunks.length} (${chunkText.length} chars)...`);
                    const embedding = await this.ollama.embed(chunkText);

                    // Validate embedding before storing
                    if (!Array.isArray(embedding) || embedding.length === 0) {
                        this.logger.warn(`Chunk ${i}: invalid embedding, skipping`);
                        continue;
                    }

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
                    this.logger.log(`✓ Chunk ${i + 1} embedded (dim=${embedding.length})`);
                } catch (embedErr) {
                    this.logger.warn(`Failed to embed chunk ${i}: ${embedErr.message}`);
                }

                // Update progress (70-95 range for embedding)
                metadata.progress = 70 + Math.round(((i + 1) / chunks.length) * 25);
            }

            this.logMemory('after-embedding');

            // 4. Store in vector store
            if (entries.length > 0) {
                this.logger.log(`Storing ${entries.length} vectors...`);
                this.vectorStore.addEntries(entries);
            } else {
                this.logger.warn('No valid embeddings produced — nothing to store');
            }

            // Update metadata
            metadata.chunkCount = entries.length;
            metadata.status = 'ready';
            metadata.progress = 100;
            this.logger.log(`✅ Document "${originalFilename}" ready: ${entries.length} vectors stored`);

            return metadata;
        } catch (err) {
            metadata.status = 'failed';
            metadata.error = err.message;
            this.logger.error(`❌ Failed to process "${originalFilename}": ${err.message}`);
            this.logger.error(err.stack || '(no stack trace)');
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

    // ===================================================================
    // DeepSeek-OCR Pipeline (Phases 1–5)
    // ===================================================================

    /**
     * Extract text from a PDF using pdfjs-dist's text extraction API.
     * This works directly on the PDF object model — no canvas rendering needed.
     * Much faster and more reliable than OCR for text-based PDFs.
     * For scanned/image-only PDFs, pages will yield empty text and be logged.
     */
    private async extractPdfText(filePath: string, metadata: DocumentMetadata): Promise<string> {
        // Use the legacy build for Node.js (avoids browser API dependencies)
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

        const fileBuffer = fs.readFileSync(filePath);
        const pdfDoc = await pdfjsLib.getDocument({
            data: new Uint8Array(fileBuffer),
            useSystemFonts: true,
        }).promise;

        metadata.pageCount = pdfDoc.numPages;
        metadata.progress = 10;
        this.logger.log(`PDF has ${pdfDoc.numPages} pages`);

        const pageTexts: string[] = [];

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Extract and join text items, preserving basic layout
            const pageText = textContent.items
                .filter((item: any) => 'str' in item)
                .map((item: any) => item.str)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (pageText.length > 0) {
                pageTexts.push(pageText);
            } else {
                this.logger.warn(`Page ${pageNum} has no extractable text (possibly scanned/image-only)`);
                pageTexts.push(`[No text extracted from page ${pageNum}]`);
            }

            // Update progress (10-55 range)
            const pageProgress = 10 + Math.round((pageNum / pdfDoc.numPages) * 45);
            metadata.progress = pageProgress;
            this.logger.log(`Extracted text from page ${pageNum}/${pdfDoc.numPages}`);
        }

        metadata.progress = 58;

        // Stitch pages into a single document
        return pageTexts
            .filter(text => !text.startsWith('[No text'))
            .join('\n\n---\n\n');
    }

    /**
     * Phase 2: Preprocess a single page image.
     * Uses sharp for normalization, deskewing, contrast adjustment.
     */
    private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
        const sharp = (await import('sharp')).default;

        return sharp(imageBuffer)
            .grayscale()                 // Convert to grayscale for cleaner OCR
            .normalize()                 // Auto-adjust contrast/brightness
            .sharpen({ sigma: 1.0 })     // Enhance text edges
            .png()                       // Ensure consistent PNG output
            .toBuffer();
    }

    /**
     * Phase 5: Clean OCR artifacts and stitch page texts into a single Markdown document.
     */
    private postProcess(pageTexts: string[]): string {
        const cleanedPages = pageTexts.map((text, index) => {
            let cleaned = text;

            // Remove model artifact tags that may leak into output
            cleaned = cleaned.replace(/<\|ref\|>/g, '');
            cleaned = cleaned.replace(/<\|\/ref\|>/g, '');
            cleaned = cleaned.replace(/<\|grounding\|>/g, '');
            cleaned = cleaned.replace(/<\|\/grounding\|>/g, '');
            cleaned = cleaned.replace(/<\|endoftext\|>/g, '');

            // Remove any accidental code block wrapping
            cleaned = cleaned.replace(/^```(?:markdown)?\n?/gm, '');
            cleaned = cleaned.replace(/\n?```$/gm, '');

            // Trim whitespace
            cleaned = cleaned.trim();

            return cleaned;
        });

        // Stitch pages with clear separation
        return cleanedPages
            .filter((text) => text.length > 0 && !text.startsWith('[OCR Error'))
            .join('\n\n---\n\n');
    }

    // ===================================================================
    // Text Processing Utilities
    // ===================================================================

    /**
     * Split text into overlapping chunks.
     * Uses a sliding window with preference for natural break points.
     *
     * @param text      - The full document text
     * @param chunkSize - Target characters per chunk (default: 500)
     * @param overlap   - Characters of overlap between chunks (default: 100)
     */
    private chunkText(text: string, chunkSize: number, overlap: number): string[] {
        if (!text || text.length === 0) return [];

        // For short texts, return as a single chunk
        if (text.length <= chunkSize) {
            return [text.trim()].filter(c => c.length > 0);
        }

        const chunks: string[] = [];
        const step = chunkSize - overlap; // Always advance by this much

        for (let start = 0; start < text.length; start += step) {
            let end = Math.min(start + chunkSize, text.length);

            // Try to break at a natural boundary (only for mid-document chunks)
            if (end < text.length) {
                // Search in the last 100 chars of the chunk for a good break point
                const searchFrom = Math.max(start, end - 100);
                const snippet = text.substring(searchFrom, end);
                const breakPoints = ['\n\n', '.\n', '. ', '! ', '? ', '\n', ', '];

                for (const bp of breakPoints) {
                    const idx = snippet.lastIndexOf(bp);
                    if (idx !== -1 && idx > 20) { // Don't break too early
                        end = searchFrom + idx + bp.length;
                        break;
                    }
                }
            }

            const chunk = text.substring(start, end).trim();
            if (chunk.length > 0) {
                chunks.push(chunk);
            }

            // If we've reached the end, stop
            if (end >= text.length) break;
        }

        return chunks;
    }

    /**
     * Log current heap memory usage for diagnostics.
     */
    private logMemory(label: string): void {
        const mem = process.memoryUsage();
        const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
        this.logger.log(
            `[Memory:${label}] heap=${mb(mem.heapUsed)}/${mb(mem.heapTotal)}MB, rss=${mb(mem.rss)}MB`,
        );
    }
}
