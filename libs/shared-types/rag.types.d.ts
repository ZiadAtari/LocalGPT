export interface VectorDocumentMetadata {
    source_file: string;
    page_number?: number;
    created_at: string;
    hash: string;
}
export interface SearchResult {
    id: string;
    document: string;
    score: Float32Array[0] extends number ? number : number;
    metadata: VectorDocumentMetadata;
}
export type VectorCollection = 'library_main' | 'chat_history' | 'code_snippets';
export interface IChatRepository {
    createConversation(title: string): Promise<{
        id: string;
    }>;
    addMessage(data: {
        conversationId: string;
        role: 'user' | 'assistant' | 'system' | 'tool';
        content: string;
        thinking?: string;
    }): Promise<{
        id: string;
    }>;
    getRecentMessages(conversationId: string, limit: number): Promise<any[]>;
}
export interface IVectorStore {
    addDocument(collection: VectorCollection, text: string, metadata: VectorDocumentMetadata): Promise<void>;
    similaritySearch(collection: VectorCollection, queryEmbedding: number[], limit: number): Promise<SearchResult[]>;
}
