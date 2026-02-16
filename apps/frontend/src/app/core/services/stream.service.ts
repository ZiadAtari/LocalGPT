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
     * Connect to the SSE stream via POST /api/chat/stream.
     * Returns an Observable that emits StreamPacket events.
     */
    connect(conversationId: string, message: string, model?: string): Observable<StreamPacket> {
        return new Observable<StreamPacket>((observer) => {
            this.abortController = new AbortController();

            this.ngZone.runOutsideAngular(() => {
                this.fetchStream(conversationId, message, model, observer);
            });

            // Cleanup on unsubscribe
            return () => {
                this.disconnect();
            };
        });
    }

    /**
     * Abort the active stream.
     */
    disconnect(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    private async fetchStream(
        conversationId: string,
        message: string,
        model: string | undefined,
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
                }),
                signal: this.abortController?.signal,
            });

            if (!response.ok) {
                throw new Error(`Stream failed: ${response.status}`);
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE lines: "event: <type>\ndata: <json>\n\n"
                const lines = buffer.split('\n');
                buffer = '';

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    if (line.startsWith('data: ')) {
                        try {
                            const packet: StreamPacket = JSON.parse(line.slice(6));
                            this.ngZone.run(() => observer.next(packet));
                        } catch {
                            // Skip malformed JSON
                        }
                    } else if (line !== '' && !line.startsWith('event:')) {
                        // Incomplete line — push back to buffer
                        buffer = lines.slice(i).join('\n');
                        break;
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
