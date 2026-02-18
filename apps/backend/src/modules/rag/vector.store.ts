/**
 * Vector Store Service
 * ====================
 * File-based vector storage with cosine similarity search.
 * No external database dependency — stores everything in a local JSON file.
 *
 * Schema per entry:
 *   { id, documentId, text, embedding, metadata }
 *
 * Based on: Docs/Apps/Data Layer/SpecSheet.md § 4
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface VectorEntry {
    id: string;
    documentId: string;
    text: string;
    embedding: number[];
    metadata: {
        filename: string;
        chunkIndex: number;
        pageNumber?: number;
    };
}

export interface SearchResult {
    entry: VectorEntry;
    score: number;
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
    private readonly logger = new Logger(VectorStoreService.name);
    private entries: VectorEntry[] = [];
    private readonly storePath: string;

    constructor() {
        // Store vectors in /data/vectors/store.json relative to project root.
        // This ensures data survives server restarts but is easy to backup/inspect.
        const dataDir = path.resolve(process.cwd(), 'data', 'vectors');
        this.storePath = path.join(dataDir, 'store.json');
    }

    async onModuleInit() {
        // Ensure data directory exists
        const dir = path.dirname(this.storePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Load existing vectors from disk
        if (fs.existsSync(this.storePath)) {
            try {
                const raw = fs.readFileSync(this.storePath, 'utf-8');
                this.entries = JSON.parse(raw);
                this.logger.log(`Loaded ${this.entries.length} vectors from disk`);
            } catch (err) {
                this.logger.warn('Failed to load vector store, starting fresh');
                this.entries = [];
            }
        } else {
            this.logger.log('No existing vector store found. Starting fresh.');
            this.entries = [];
        }
    }

    /**
     * Add document chunks with their embeddings.
     */
    addEntries(entries: VectorEntry[]): void {
        // Use loop instead of spread to avoid RangeError with large arrays
        for (const entry of entries) {
            this.entries.push(entry);
        }
        this.persist();
        this.logger.log(`Added ${entries.length} vectors (total: ${this.entries.length})`);
    }

    /**
     * Search for the most similar vectors to a query embedding.
     * Uses cosine similarity.
     *
     * @param queryEmbedding  - The embedding of the user query
     * @param topK            - Number of results to return
     * @param documentIds     - Optional: limit search to specific documents
     */
    search(queryEmbedding: number[], topK = 5, documentIds?: string[]): SearchResult[] {
        let pool = this.entries;

        // Filter by document IDs if specified
        if (documentIds?.length) {
            pool = pool.filter((e) => documentIds.includes(e.documentId));
        }

        if (pool.length === 0) return [];

        // Compute cosine similarity for each entry
        const scored = pool.map((entry) => ({
            entry,
            score: this.cosineSimilarity(queryEmbedding, entry.embedding),
        }));

        // Sort descending by score and take top K
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }

    /**
     * Remove all vectors for a given document.
     */
    removeByDocumentId(documentId: string): number {
        const before = this.entries.length;
        this.entries = this.entries.filter((e) => e.documentId !== documentId);
        const removed = before - this.entries.length;
        this.persist();
        this.logger.log(`Removed ${removed} vectors for document ${documentId}`);
        return removed;
    }

    /**
     * List unique document IDs in the store.
     */
    listDocuments(): string[] {
        return [...new Set(this.entries.map((e) => e.documentId))];
    }

    /**
     * Get total vector count.
     */
    getCount(): number {
        return this.entries.length;
    }

    // -------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    private persist(): void {
        try {
            fs.writeFileSync(this.storePath, JSON.stringify(this.entries), 'utf-8');
        } catch (err) {
            this.logger.error('Failed to persist vector store:', err);
        }
    }
}
