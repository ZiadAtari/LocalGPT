/**
 * API Service
 * ===========
 * HTTP wrapper for REST calls to the NestJS Middleware.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConversationSummary {
    id: string;
    title: string;
    summary: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationDetail {
    id: string;
    title: string;
    summary: string | null;
    messages: MessageRecord[];
}

export interface MessageRecord {
    id: string;
    role: string;
    content: string;
    thoughtProcess: string | null;
    createdAt: string;
}

export interface ModelInfo {
    name: string;
    size: number;
    modifiedAt: string;
}

export interface DocumentMetadata {
    documentId: string;
    filename: string;
    chunkCount: number;
    status: 'processing' | 'ready' | 'failed';
    error?: string;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
    constructor(private http: HttpClient) { }

    // --- Chat ---

    /**
     * Initializes a new chat conversation.
     * @param title - Optional title for the conversation.
     * @returns Observable containing the new conversation ID.
     */
    initConversation(title?: string): Observable<{ conversationId: string }> {
        return this.http.post<{ conversationId: string }>('/api/chat/init', { title });
    }

    /**
     * Lists all previous conversations.
     * @returns Observable array of conversation summaries.
     */
    listConversations(): Observable<ConversationSummary[]> {
        return this.http.get<ConversationSummary[]>('/api/chat');
    }

    /**
     * Retrieves the full history of a specific conversation.
     * @param id - The UUID of the conversation.
     * @returns Observable containing messages and metadata.
     */
    getConversation(id: string): Observable<ConversationDetail> {
        return this.http.get<ConversationDetail>(`/api/chat/${id}`);
    }

    /**
     * Lists available LLM models from the backend (proxy to Ollama).
     * @returns Observable array of model information.
     */
    listModels(): Observable<ModelInfo[]> {
        return this.http.get<ModelInfo[]>('/api/models');
    }

    /**
     * Requests the backend to abort a currently streaming response.
     * @param conversationId - The ID of the conversation to stop.
     * @returns Observable indicating success.
     */
    stopStream(conversationId: string): Observable<{ stopped: boolean }> {
        return this.http.post<{ stopped: boolean }>('/api/chat/stop', { conversationId });
    }

    // --- Documents (RAG) ---

    /**
     * Uploads a file for RAG processing.
     * The backend will split, embed, and store this file in the vector DB.
     * @param file - The file object from input[type="file"].
     * @returns Observable containing the uploaded document's metadata.
     */
    uploadDocument(file: File): Observable<DocumentMetadata> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post<DocumentMetadata>('/api/documents/upload', formData);
    }

    /**
     * Lists all documents currently indexed in the RAG system.
     * @returns Observable array of document metadata.
     */
    listDocuments(): Observable<DocumentMetadata[]> {
        return this.http.get<DocumentMetadata[]>('/api/documents');
    }

    /**
     * Deletes a document from both the file system and vector database.
     * @param id - The UUID of the document to delete.
     * @returns Observable indicating success.
     */
    deleteDocument(id: string): Observable<{ removed: boolean }> {
        return this.http.delete<{ removed: boolean }>(`/api/documents/${id}`);
    }
}

