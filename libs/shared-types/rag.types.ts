/**
 * RAG Types
 * =========
 * Types for Retrieval-Augmented Generation workflows.
 * Based on: Docs/Apps/Data Layer/SpecSheet.md § 4 & § 6
 */

// ---------------------------------------------------------------------------
// Vector Storage Types
// ---------------------------------------------------------------------------

/**
 * The metadata stored alongside each vector chunk in ChromaDB.
 */
export interface VectorDocumentMetadata {
    source_file: string;
    page_number?: number;
    created_at: string;
    hash: string; // SHA-256 of original content for duplicate detection
}

/**
 * A single result returned from a ChromaDB similarity search.
 */
export interface SearchResult {
    id: string;
    document: string;   // The raw text chunk
    score: Float32Array[0] extends number ? number : number; // Relevance 0.0–1.0
    metadata: VectorDocumentMetadata;
}

/**
 * Named ChromaDB collections.
 * Segregated to improve search accuracy and latency.
 */
export type VectorCollection =
    | 'library_main'   // PDF/Txt documents
    | 'chat_history'   // Past user messages (long-term memory)
    | 'code_snippets'; // Code files

// ---------------------------------------------------------------------------
// Repository Interfaces
// ---------------------------------------------------------------------------

/**
 * Data-access contract for conversational history (SQLite/Prisma).
 * Implemented in: apps/backend/src/core/database/
 */
export interface IChatRepository {
    createConversation(title: string): Promise<{ id: string }>;

    addMessage(data: {
        conversationId: string;
        role: 'user' | 'assistant' | 'system' | 'tool';
        content: string;
        thinking?: string;
    }): Promise<{ id: string }>;

    getRecentMessages(conversationId: string, limit: number): Promise<any[]>;
}

/**
 * Data-access contract for ChromaDB vector operations.
 * Implemented in: apps/backend/src/modules/rag/
 */
export interface IVectorStore {
    addDocument(collection: VectorCollection, text: string, metadata: VectorDocumentMetadata): Promise<void>;
    similaritySearch(collection: VectorCollection, queryEmbedding: number[], limit: number): Promise<SearchResult[]>;
}
