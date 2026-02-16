import { OnModuleInit } from '@nestjs/common';
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
export declare class VectorStoreService implements OnModuleInit {
    private readonly logger;
    private entries;
    private readonly storePath;
    constructor();
    onModuleInit(): Promise<void>;
    addEntries(entries: VectorEntry[]): void;
    search(queryEmbedding: number[], topK?: number, documentIds?: string[]): SearchResult[];
    removeByDocumentId(documentId: string): number;
    listDocuments(): string[];
    getCount(): number;
    private cosineSimilarity;
    private persist;
}
