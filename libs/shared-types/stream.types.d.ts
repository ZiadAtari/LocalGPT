export type StreamEventType = 'token' | 'thought' | 'tool_start' | 'tool_result' | 'error' | 'done';
export interface StreamPacket {
    id: string;
    type: StreamEventType;
    payload: string | object;
    timestamp: number;
}
export type StreamEvent = {
    type: 'token';
    payload: string;
} | {
    type: 'thought';
    payload: string;
} | {
    type: 'tool_start';
    payload: {
        tool: string;
    };
} | {
    type: 'tool_result';
    payload: {
        tool: string;
        result: string;
    };
} | {
    type: 'error';
    payload: {
        message: string;
    };
} | {
    type: 'done';
    payload: {
        metrics: Record<string, any>;
    };
};
