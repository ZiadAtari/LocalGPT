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

@Injectable({ providedIn: 'root' })
export class ApiService {
    constructor(private http: HttpClient) { }

    initConversation(title?: string): Observable<{ conversationId: string }> {
        return this.http.post<{ conversationId: string }>('/api/chat/init', { title });
    }

    listConversations(): Observable<ConversationSummary[]> {
        return this.http.get<ConversationSummary[]>('/api/chat');
    }

    getConversation(id: string): Observable<ConversationDetail> {
        return this.http.get<ConversationDetail>(`/api/chat/${id}`);
    }

    listModels(): Observable<ModelInfo[]> {
        return this.http.get<ModelInfo[]>('/api/models');
    }

    stopStream(conversationId: string): Observable<{ stopped: boolean }> {
        return this.http.post<{ stopped: boolean }>('/api/chat/stop', { conversationId });
    }
}
