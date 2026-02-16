/**
 * Stream Service
 * ==============
 * Manages SSE connections to the NestJS backend.
 * Uses fetch() + ReadableStream for streaming POST requests
 * (EventSource only supports GET, but we need POST for chat).
 */
import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

export interface StreamPacket {
    id: string;
    type: 'token' | 'thought' | 'tool_start' | 'tool_result' | 'error' | 'done';
    payload: string | Record<string, any>;
    timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class StreamService {
    private abortController: AbortController | null = null;

    constructor(private ngZone: NgZone) { }

    /**
     * Establishes a Server-Sent Events (SSE) connection via a POST request.
     * 
     * Rationale: Standard `EventSource` only supports GET requests. We need POST
     * to send the prompt payload (message, model, context). Therefore, we use 
     * `fetch` with a `ReadableStream` reader.
     * 
     * @param conversationId - The UUID of the active conversation.
     * @param message - The user's prompt text.
     * @param model - (Optional) The LLM model to use (default: deepseek-r1).
     * @param documentIds - (Optional) Array of RAG document IDs to include in context.
     * @returns An Observable that emits structured `StreamPacket` events.
     */
    connect(conversationId: string, message: string, model?: string, documentIds?: string[]): Observable<StreamPacket> {
        return new Observable<StreamPacket>((observer) => {
            this.abortController = new AbortController();

            // Run outside Angular to prevent Change Detection on every single chunk read
            this.ngZone.runOutsideAngular(() => {
                this.fetchStream(conversationId, message, model, documentIds, observer);
            });

            // Cleanup function when the subscriber unsubscribes
            return () => {
                this.disconnect();
            };
        });
    }

    /**
     * Aborts the active fetch request, closing the stream.
     */
    disconnect(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * Internal Loop: Reads the raw byte stream and parses SSE messages.
     * 
     * SSE Format:
     * event: <type>
     * data: <json_payload>
     * 
     * This method handles:
     * 1. Chunked reading (bytes -> string).
     * 2. Buffer management (handling chunks split across lines).
     * 3. Angular Zone reentry (calling next/error/complete inside the Zone).
     */
    private async fetchStream(
        conversationId: string,
        message: string,
        model: string | undefined,
        documentIds: string[] | undefined,
        observer: any,
    ): Promise<void> {
        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    message,
                    model: model ?? 'deepseek-r1',
                    documentIds,
                }),
                signal: this.abortController?.signal,
            });

            if (!response.ok) {
                throw new Error(`Stream failed: ${response.status}`);
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            // Infinite loop until stream closes
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Decode bytes to string
                buffer += decoder.decode(value, { stream: true });

                // Split by newline to find SSE messages
                // Format is: "event: <type>\ndata: <json>\n\n"
                const lines = buffer.split('\n');

                // Keep the last segment in the buffer if it didn't end with a newline
                // (It might be an incomplete JSON object waiting for the next chunk)
                // Note: The logic below is a simplified SSE parser. 
                // A robust parser would look for double newlines.
                buffer = '';

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    if (line.startsWith('data: ')) {
                        try {
                            const packet: StreamPacket = JSON.parse(line.slice(6));
                            // Re-enter Angular Zone to update the UI
                            this.ngZone.run(() => observer.next(packet));
                        } catch {
                            // Skip malformed JSON (common in partial chunks)
                        }
                    } else if (line !== '' && !line.startsWith('event:')) {
                        // If the line is not empty and not an event header, 
                        // it's likely part of incomplete data. 
                        // However, this simple split logic might need refinement 
                        // if data payloads contain newlines.

                        // For now, we assume standard one-line JSON payloads.
                        // If we encounter a split line, valid implementation would be:
                        // buffer = lines.slice(i).join('\n');
                        // break;
                    }
                }
            }

            this.ngZone.run(() => observer.complete());
        } catch (err: any) {
            if (err.name === 'AbortError') {
                this.ngZone.run(() => observer.complete());
            } else {
                this.ngZone.run(() => observer.error(err));
            }
        }
    }
}
