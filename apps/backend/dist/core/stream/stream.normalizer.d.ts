import { ChatResponse } from 'ollama';
export type StreamEventType = 'token' | 'thought' | 'tool_start' | 'tool_result' | 'error' | 'done';
export interface StreamPacket {
    id: string;
    type: StreamEventType;
    payload: string | object;
    timestamp: number;
}
export declare class StreamNormalizer {
    private readonly logger;
    normalize(stream: AsyncGenerator<ChatResponse>): AsyncGenerator<StreamPacket>;
    private packet;
}
