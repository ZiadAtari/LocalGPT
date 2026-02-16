import { OllamaWrapper } from '../ollama/ollama.wrapper';
import { VectorStoreService } from './vector.store';
export interface DocumentMetadata {
    documentId: string;
    filename: string;
    chunkCount: number;
    status: 'processing' | 'ready' | 'failed';
    error?: string;
    createdAt: string;
}
export declare class FileProcessor {
    private readonly ollama;
    private readonly vectorStore;
    private readonly logger;
    private documents;
    constructor(ollama: OllamaWrapper, vectorStore: VectorStoreService);
    processFile(filePath: string, originalFilename: string): Promise<DocumentMetadata>;
    listDocuments(): DocumentMetadata[];
    getDocument(documentId: string): DocumentMetadata | undefined;
    removeDocument(documentId: string): boolean;
    private extractPdf;
    private chunkText;
}
