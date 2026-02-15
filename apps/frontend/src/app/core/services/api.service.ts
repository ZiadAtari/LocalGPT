/**
 * API Service
 * ===========
 * HTTP wrapper for REST calls to the NestJS Middleware.
 * Based on: Docs/Apps/Client/SpecSheet.md § 6 (core/services)
 *
 * All communication goes through Tier 2 (NestJS).
 * The Client NEVER calls Ollama directly.
 */
import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    // private baseUrl = environment.apiUrl; // e.g. 'http://localhost:3000/api'

    // TODO: Implement:
    //   initConversation(): Observable<{ conversationId: string }>
    //   getConversations(): Observable<Conversation[]>
    //   getConversation(id: string): Observable<Conversation>
    //   uploadFile(file: File): Observable<{ fileId: string }>
    //   getModels(): Observable<Model[]>
}
